import crypto from 'crypto';

export function generateOtp(): string {
  // Cryptographically secure 6-digit number
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(otp: string, email: string): string {
  return crypto
    .createHash('sha256')
    .update(`${otp}:${email}:${process.env.JWT_SECRET || 'dbsm-secret'}`)
    .digest('hex');
}

export function verifyOtpHash(otp: string, email: string, hash: string): boolean {
  const calculated = hashOtp(otp, email);
  try {
    return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
  } catch {
    return false;
  }
}
