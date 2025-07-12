export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

export interface AuthSession {
  user: AuthUser;
  isAuthenticated: boolean;
  createdAt: Date;
} 