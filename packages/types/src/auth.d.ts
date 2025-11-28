/**
 * Authentication types for FinMatter
 * Phone-based OTP authentication
 */
import { User } from './user';
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    details?: any;
  };
  timestamp: string;
}
export type SendOTPRequest = {
  phoneNumber: string;
};
export type VerifyOTPRequest = {
  phoneNumber: string;
  otp: string;
};
export type SendOTPResponse = ApiResponse<{
  message: string;
  expiresIn: number;
}>;
export type VerifyOTPResponse = ApiResponse<{
  user: User;
  session: {
    token: string;
    expiresAt: string;
  };
}>;
export type RefreshTokenRequest = {
  refreshToken?: string;
};
export type RefreshTokenResponse = ApiResponse<{
  token: string;
  expiresAt: string;
}>;
//# sourceMappingURL=auth.d.ts.map
