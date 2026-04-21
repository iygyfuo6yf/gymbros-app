export interface Session {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: { id: string; email: string; name: string };
  session: Session;
}
