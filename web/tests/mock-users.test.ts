import { describe, expect, it } from "vitest";
import { mockStudents } from "../src/mocks/users.ts";

describe("mockStudents", () => {
  it("provides 15 additional students with unique academic data", () => {
    const students = mockStudents.filter((user) =>
      user.id.startsWith("mock-student-"),
    );

    expect(students).toHaveLength(15);
    expect(new Set(students.map((student) => student.name)).size).toBe(15);
    expect(new Set(students.map((student) => student.email)).size).toBe(15);
    expect(new Set(students.map((student) => student.githubName)).size).toBe(
      15,
    );
    expect(new Set(students.map((student) => student.registration)).size).toBe(
      15,
    );

    for (const student of students) {
      expect(student.role).toBe("student");
      expect(student.registration).toBeGreaterThanOrEqual(1);
      expect(student.registration).toBeLessThanOrEqual(1000);
      expect(["A", "B"]).toContain(student.classroom);
    }
  });
});
