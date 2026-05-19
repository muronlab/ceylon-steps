export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  emailVerifiedAt: string | null;
  roles?: string[];
}

export interface RegisterResponse extends User {}

export interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}
