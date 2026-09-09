import type { LoggedUser, LoginRequest } from "@/types/auth";
import { MOCK_USER_PASSWORD, mockAuthUsers } from "./users";

const MOCK_USER_STORAGE_KEY = "carecahub:mock-user";

export function loginMockUser(
  storage: Storage,
  credentials: LoginRequest,
): LoggedUser {
  const email = credentials.username.trim().toLowerCase();
  const user = mockAuthUsers.find((candidate) => candidate.email === email);

  if (!user || credentials.password !== MOCK_USER_PASSWORD) {
    throw new Error("E-mail ou senha inválidos.");
  }

  storage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function loadMockUser(storage: Storage): LoggedUser | undefined {
  const persistedUser = storage.getItem(MOCK_USER_STORAGE_KEY);
  if (!persistedUser) return undefined;

  try {
    const parsedUser = JSON.parse(persistedUser) as { id?: string };
    return mockAuthUsers.find((user) => user.id === parsedUser.id);
  } catch {
    return undefined;
  }
}

export function logoutMockUser(storage: Storage) {
  storage.removeItem(MOCK_USER_STORAGE_KEY);
}
