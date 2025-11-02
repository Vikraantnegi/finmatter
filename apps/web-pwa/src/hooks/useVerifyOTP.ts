import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// OTP validation schema
const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter the complete 6-digit OTP'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

interface UseVerifyOTPOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useVerifyOTP = (options?: UseVerifyOTPOptions) => {
  const router = useRouter();
  const { verifyOTP, sendOTP } = useAuth();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [otpError, setOtpError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Form setup
  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Initialize phone from sessionStorage
  useEffect(() => {
    const pendingPhoneNumber = sessionStorage.getItem('pendingPhoneNumber');
    const savedAuthMode = sessionStorage.getItem('authMode');

    if (pendingPhoneNumber) {
      setPhone(pendingPhoneNumber);
      setAuthMode((savedAuthMode as 'login' | 'signup') || 'login');
      setResendCooldown(60);
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Masked phone for display
  const maskedPhone = phone
    ? `${phone.slice(0, 3)} ${'X'.repeat(4)} ${phone.slice(-3)}`
    : '';

  // Handle OTP change
  const handleOtpChange = (value: string) => {
    setOtp(value);
    setOtpError(false);
    if (value.length === 6) {
      handleVerifyOTP({ otp: value });
    }
  };

  // Parse error message from API response
  const parseErrorMessage = (error: unknown): string => {
    let errorMessage = 'Failed to verify OTP. Please try again.';

    if (error && typeof error === 'object') {
      if ('code' in error) {
        const errorCode = String(error.code);

        // Handle error codes
        if (
          errorCode === 'INVALID_OTP' ||
          errorCode === 'INVALID_CODE' ||
          errorCode === 'WRONG_OTP' ||
          errorCode === 'CODE_MISMATCH'
        ) {
          errorMessage = 'Invalid OTP. Please try again.';
        } else if (
          errorCode === 'OTP_EXPIRED' ||
          errorCode === 'EXPIRED' ||
          errorCode === 'TOKEN_EXPIRED'
        ) {
          errorMessage = 'OTP has expired. Please request a new one.';
        } else if ('message' in error && error.message) {
          errorMessage = String(error.message);
        }
      } else if ('message' in error && error.message) {
        errorMessage = String(error.message);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return errorMessage;
  };

  // Verify OTP
  const handleVerifyOTP = async (data: OtpFormData) => {
    try {
      setIsLoading(true);
      setOtpError(false);

      const result = await verifyOTP(phone, data.otp);

      if (result.success) {
        sessionStorage.removeItem('pendingPhoneNumber');
        sessionStorage.removeItem('authMode');
        setIsRedirecting(true);
        options?.onSuccess?.();
      } else {
        setOtpError(true);
        setOtp('');

        const errorMessage = parseErrorMessage(result.error);
        toast.error(errorMessage, { id: 'otp-error' });
        options?.onError?.(new Error(errorMessage));
      }
    } catch (error) {
      setOtpError(true);
      setOtp('');
      console.error('Unexpected error in OTP verification:', error);
      toast.error('Something went wrong. Please try again.', {
        id: 'otp-unexpected-error',
      });
      options?.onError?.(
        error instanceof Error ? error : new Error('Unexpected error'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const phoneWithCountryCode = phone.startsWith('+91')
        ? phone
        : `+91${phone}`;
      const result = await sendOTP(phoneWithCountryCode);

      if (result.success) {
        setOtp('');
        setOtpError(false);
        setResendCooldown(60);
        toast.success('OTP sent successfully!');
      } else {
        const error = result.error;
        if (error && typeof error === 'object' && 'message' in error) {
          toast.error(error.message || 'Failed to resend OTP');
        } else {
          toast.error('Failed to resend OTP');
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Navigation handlers
  const handleBack = () => {
    router.push(`/auth/login?mode=${authMode}`);
  };

  return {
    // Form
    form,
    handleSubmit: form.handleSubmit(handleVerifyOTP),

    // State
    otp,
    phone,
    maskedPhone,
    authMode,
    otpError,
    isLoading,
    isResending,
    isRedirecting,
    resendCooldown,

    // Handlers
    handleOtpChange,
    handleVerifyOTP,
    handleResendOTP,
    handleBack,
  };
};
