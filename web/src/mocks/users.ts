import type { LoggedUser } from "@/types/auth";
import type { User } from "@/types/user";

export const MOCK_USER_PASSWORD = "Careca!123";

export const mockAuthUsers = [
  {
    id: "mock-admin",
    name: "Admin CarecaHub",
    email: "admin@carecahub.com",
    role: "admin",
  },
  {
    id: "mock-teacher",
    name: "Prof. CarecaHub",
    email: "professor@carecahub.com",
    role: "teacher",
  },
  {
    id: "mock-mentor",
    name: "Mon. CarecaHub",
    email: "monitor@carecahub.com",
    role: "mentor",
  },
  {
    id: "mock-student",
    name: "Aluno CarecaHub",
    email: "aluno@carecahub.com",
    role: "student",
  },
] as const satisfies readonly LoggedUser[];

export const mockUsers = [
  {
    id: "mock-admin",
    name: "Admin CarecaHub",
    email: "admin@carecahub.com",
    githubName: "admin-carecahub",
    role: "admin",
    status: "active",
    registration: null,
    classroom: null,
    twoFactor: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-teacher",
    name: "Prof. CarecaHub",
    email: "professor@carecahub.com",
    role: "teacher",
    status: "active",
    classroom: null,
    registration: null,
    githubName: "professor-carecahub",
    twoFactor: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-mentor",
    name: "Mon. CarecaHub",
    email: "monitor@carecahub.com",
    role: "mentor",
    status: "active",
    classroom: null,
    githubName: "monitor-carecahub",
    registration: 654321,
    twoFactor: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-student",
    name: "Aluno CarecaHub",
    email: "aluno@carecahub.com",
    role: "student",
    status: "active",
    githubName: "aluno-carecahub",
    registration: 123456,
    classroom: "A",
    twoFactor: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
] as const satisfies readonly User[];
