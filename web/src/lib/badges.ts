import type { User } from "@/types/user";

export const getBadgeClassNamesByRole = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return "bg-purple-500";
    case "teacher":
      return "bg-blue-500";
    case "mentor":
      return "bg-green-500";
    case "student":
      return "bg-yellow-500";
    default:
      return "";
  }
};
