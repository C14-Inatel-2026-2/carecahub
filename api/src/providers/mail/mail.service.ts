import { systemParams } from "@db";
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { inArray } from "drizzle-orm";
import { env } from "@/providers/config/env";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import { LoggerFactory } from "@/providers/logger/logger-factory.service";
import { ONE_DAY_IN_MS, SystemParams } from "@/types";
import { isAfter, subHours } from "@/utils/date";
import { CacheService } from "../cache/cache.service";
import { CacheKey } from "../cache/cache.types";
import { DrizzleService } from "../database/drizzle.service";
import { MailProps } from "./mail.types";
import { join } from "node:path";

@Injectable()
export class MailService {
  private readonly logger: CustomLogger;
  readonly MAX_EMAILS_PER_HOUR = 5;
  readonly CACHE_TTL = ONE_DAY_IN_MS;
  private systemParameterCache: {
    platformName: string;
    platformUrl: string;
    platformLogo: string;
    platformColor: string;
  } | null = null;
  constructor(
    private readonly mailerService: MailerService,
    private readonly database: DrizzleService,
    private readonly cache: CacheService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(MailService.name);
  }

  private readonly LOGO_PATH = join(
    __dirname,
    "templates",
    "images",
    "carecahub.png",
  );

  private readonly LOGO_CID = "carecahub-logo";

  private async canSendEmail(email: string): Promise<boolean> {
    const mailbox = email.toLowerCase().trim();

    const cachedMailboxCount = await this.cache.get({
      key: CacheKey.mailMessagesCount,
      scope: mailbox,
    });

    const emailsSentInLastHour =
      cachedMailboxCount?.lastMessages?.filter((msg) =>
        isAfter(msg.date, subHours(new Date(), 1)),
      ) || [];

    if (emailsSentInLastHour.length >= this.MAX_EMAILS_PER_HOUR) {
      this.logger.warn(
        `Mailbox ${mailbox} has reached the hourly limit of ${this.MAX_EMAILS_PER_HOUR} emails.`,
      );
      return false;
    }

    this.logger.log(`Caching email count for ${mailbox}`);

    await this.cache.set({
      key: CacheKey.mailMessagesCount,
      scope: mailbox,
      value: {
        count: (cachedMailboxCount?.count || 0) + 1,
        lastMessages: [...emailsSentInLastHour, { date: new Date() }],
        lastMessageDate: new Date(),
      },
      ttl: this.CACHE_TTL,
    });

    return true;
  }

  async getEmailDefaultContext(): Promise<Partial<MailProps["context"]>> {
    const parameterMap = this.systemParameterCache;

    if (!parameterMap) {
      const systemParamRows = await this.database.db
        .select({ key: systemParams.key, value: systemParams.value })
        .from(systemParams)
        .where(
          inArray(systemParams.key, [
            SystemParams.PLATFORM_COLOR,
            SystemParams.PLATFORM_LOGO,
            SystemParams.PLATFORM_NAME,
            SystemParams.PLATFORM_URL,
          ]),
        );

      this.systemParameterCache = {
        platformColor:
          systemParamRows.find((p) => p.key === SystemParams.PLATFORM_COLOR)
            ?.value ?? "#21678e",
        platformLogo:
          systemParamRows.find((p) => p.key === SystemParams.PLATFORM_LOGO)
            ?.value ?? "",
        platformName:
          systemParamRows.find((p) => p.key === SystemParams.PLATFORM_NAME)
            ?.value ?? "CarecaHub",
        platformUrl:
          systemParamRows.find((p) => p.key === SystemParams.PLATFORM_URL)
            ?.value ?? "",
      };
    }

    return {
      lang: "pt-br",
      title: parameterMap?.platformName || "CarecaHub",
      webUrl: parameterMap?.platformUrl,
      logo: parameterMap?.platformLogo,
      color: parameterMap?.platformColor || "#21678e",
      ctaUrl: parameterMap?.platformUrl,
      CTA: "Conferir",
    };
  }

  /**
   * 👇 Will be called by consumer in secondary process to send email
   * @summary Do not call this method directly, use `sendMail` instead
   */
  async executeProviderService({
    to,
    subject,
    template,
    context,
    attachments,
  }: MailProps) {
    if (!env.MAIL_ENABLED) {
      this.logger.log(
        `Email sending is disabled, skipping email to ${to} with subject ${subject}`,
      );
      return;
    }

    if (!(await this.canSendEmail(to))) {
      return;
    }

    try {
      this.logger.log(`Sending email to ${to} with subject ${subject}`);

      const defaultContext = await this.getEmailDefaultContext();

      await this.mailerService.sendMail({
        to,
        subject,
        template: template || "default",
        context: {
          ...defaultContext,
          ...context,
          logo: `cid:${this.LOGO_CID}`,
        },
        attachments: [
          ...(attachments ?? []),
          {
            filename: "carecahub.png",
            path: this.LOGO_PATH,
            cid: this.LOGO_CID,
            contentType: "image/png",
            contentDisposition: "inline",
          },
        ],
      });
    } catch (error) {
      const smtpError = error as {
        message?: unknown;
        code?: unknown;
        response?: unknown;
        responseCode?: unknown;
      };
      const details = [
        smtpError.message && `message=${String(smtpError.message)}`,
        smtpError.code && `code=${String(smtpError.code)}`,
        smtpError.responseCode &&
          `responseCode=${String(smtpError.responseCode)}`,
        smtpError.response && `response=${String(smtpError.response)}`,
      ]
        .filter(Boolean)
        .join(" ");
      this.logger.error(
        `Error sending email to ${to} with subject ${subject} ${details || "without SMTP details"}`,
      );
    }
  }

  /**
   * 👇 Schedule mail sending in a broker topic to be consumed by a secondary process
   */
  async sendMail(props: MailProps) {
    if (!env.MAIL_ENABLED) {
      this.logger.log(
        `Email sending is disabled, skipping email to ${props.to} with subject ${props.subject}`,
      );
      return;
    }

    this.logger.log(
      `Scheduling email to ${props.to} with subject ${props.subject}`,
    );
    await this.executeProviderService(props);
  }

  async sendTwoFactorAuthCode(user: {
    email: string;
    username: string;
    code: string;
  }) {
    await this.sendMail({
      to: user.email,
      subject: `Código de autenticação`,
      template: "default",
      context: {
        title: `Código de autenticação`,
        message: `Seu código de autenticação é: ${user.code}`,
      },
    });
  }

  async sendRegistrationVerificationCode(user: {
    email: string;
    username: string;
    code: string;
  }) {
    await this.sendMail({
      to: user.email,
      subject: `Confirme seu e-mail`,
      template: "registration-verification",
      context: {
        firstName: user.username.trim().split(/\s+/)[0],
        code: user.code,
      },
    });
  }

  async sendRecoverPasswordMail(user: {
    email: string;
    username: string;
    token: string;
  }) {
    await this.sendMail({
      to: user.email,
      subject: `Recuperação de senha`,
      context: {
        title: `Recuperação de senha`,
        message: `Olá ${user.username}, clique no botão abaixo para recuperar sua senha. Se você não solicitou a recuperação de senha, por favor, ignore este e-mail.`,
        CTA: "Recuperar senha",
        ctaUrl: `${env.WEB_URL}/reset?token=${user.token}`,
      },
    });
  }
}
