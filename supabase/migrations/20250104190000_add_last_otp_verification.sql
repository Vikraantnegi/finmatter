-- Add last_otp_verification field to users table
-- This field tracks when the user last verified with OTP for 30-day re-verification logic

ALTER TABLE users 
ADD COLUMN last_otp_verification TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.last_otp_verification IS 'Timestamp of last OTP verification for 30-day re-verification security requirement';
