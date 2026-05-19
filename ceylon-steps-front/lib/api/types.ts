export type Me = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type StartEmailVerificationRequest = {
  email?: string;
};

export type VerifyEmailOtpRequest = {
  email?: string;
  code: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};

