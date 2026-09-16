export function isUniqueViolation(error: unknown): error is { code: "23505" } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }