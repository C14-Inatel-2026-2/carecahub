import { describe, expect, it } from "vitest";
import type { LoggedUser } from "@/types/auth";
import type { Group } from "@/types/group";
import { canPromoteGroupLeader } from "./group-permissions";

const group = { id: "group-id", leaderId: "leader-id" } as Group;
const user = (id: string, role: LoggedUser["role"]) =>
  ({ id, role }) as LoggedUser;

describe("canPromoteGroupLeader", () => {
  it("allows the current leader and administrators", () => {
    expect(canPromoteGroupLeader(user("leader-id", "student"), group)).toBe(
      true,
    );
    expect(canPromoteGroupLeader(user("admin-id", "admin"), group)).toBe(true);
  });

  it("forbids regular members and read-only management roles", () => {
    expect(canPromoteGroupLeader(user("member-id", "student"), group)).toBe(
      false,
    );
    expect(canPromoteGroupLeader(user("admin-id", "admin"), group)).toBe(true);
    expect(canPromoteGroupLeader(user("teacher-id", "teacher"), group)).toBe(
      true,
    );
    expect(canPromoteGroupLeader(user("mentor-id", "mentor"), group)).toBe(
      true,
    );
  });
});
