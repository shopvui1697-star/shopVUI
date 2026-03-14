export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}
