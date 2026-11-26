# Email Registration Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require a six-digit code sent to the supplied e-mail before creating and authenticating a student account.

**Architecture:** Keep unverified registration data in the existing cache for a short TTL, addressed by an opaque verification identifier. The code is stored only as a hash; confirmation creates the user and only then starts a session. The web registration view changes into a two-step flow without retaining a password in the URL or browser storage.

**Tech Stack:** NestJS, Drizzle, cache provider, MailerService, React, React Hook Form, Zod.

**Spec:** User request in this conversation.

## Global Constraints

- Keep the implementation direct; do not add a database table or enum for temporary registrations.
- Do not create a session or a user before a successful verification.
- Do not commit changes.

## Review Focus

- Incorrect and expired codes must not create a user or session.
- A code is single-use after confirmation.
- Resending must replace the previous code and retain the pending registration data.
- The confirmation UI must not submit the original registration payload again.
- Email delivery must use the existing mail rate limit.

### Task 1: Pending-registration API

**Files:** auth DTOs, cache types, auth controller/service/interface, mail service, auth service tests.

- [ ] Write failing service tests for initiating and confirming a registration.
- [ ] Store a hashed six-digit code and pending registration payload in cache for ten minutes.
- [ ] Send the code, verify it, create the user only after verification, and issue cookies through the controller.
- [ ] Add a resend endpoint that replaces the code.
- [ ] Run focused API tests.

### Task 2: Registration confirmation UI

**Files:** auth types, writer map, register page and tests.

- [ ] Write failing rendering tests for a six-digit confirmation step.
- [ ] Submit the initial form to request a code, then confirm it without resending the password.
- [ ] Provide resend and back-to-edit-email actions.
- [ ] Run focused web tests and typecheck.
