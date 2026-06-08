import { apiClient } from "../lib/axios";
import type { UserPublic, UserRegisterPayload } from "../types/api";

export async function requestLogin(
  username: string,
  password: string,
): Promise<void> {
  await apiClient.post(
    "/auth/token",
    new URLSearchParams({ username, password }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
}

export async function requestMe(): Promise<UserPublic> {
  const { data } = await apiClient.get<UserPublic>("/auth/me");
  return data;
}

export async function requestRegister(
  payload: UserRegisterPayload,
): Promise<UserPublic> {
  const { data } = await apiClient.post<UserPublic>("/auth/register", payload);
  return data;
}

export async function requestLogout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
