import { Resend } from 'resend';

export interface SendOtpOptions {
  email: string;
  otp: string;
  role: 'ADMIN' | 'STUDENT';
  name?: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.EMAIL_FROM || 'DBSM Academy <onboarding@resend.dev>';

export async function sendOtpEmail(options: SendOtpOptions): Promise<boolean> {
  // Always log to server terminal for instant inspection/debugging
  console.log('\n========================================================');
  console.log(`✉️  [DBSM AUTH DISPATCH] Verification OTP Code`);
  console.log(`   Recipient: ${options.email} (${options.role})`);
  console.log(`   OTP CODE : >>> ${options.otp} <<<`);
  console.log(`   Validity : 5 Minutes`);
  console.log('========================================================\n');

  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY not configured. Simulated dispatch only.');
    return true;
  }

  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #131823; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; text-align: center; }
          .logo { font-size: 20px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; margin-bottom: 8px; }
          .logo span { color: #f59e0b; }
          .sub-title { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 30px; }
          .otp-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 24px; margin: 24px 0; }
          .otp-code { font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; }
          .message { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.7); margin-bottom: 20px; }
          .footer { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">DON BOSCO SKILL MISSION<span>®</span> ✳︎</div>
          <div class="sub-title">Academy Management & Security Suite</div>
          
          <p class="message">
            Hello ${options.name || 'Member'},<br>
            Here is your one-time verification access code for the <strong>${options.role}</strong> portal.
          </p>

          <div class="otp-card">
            <div class="otp-code">${options.otp}</div>
          </div>

          <p class="message" style="font-size: 12px;">
            This security code is valid for <strong>5 minutes</strong>.<br>
            If you did not request this verification code, please ignore this email.
          </p>

          <div class="footer">
            © 2026 Don Bosco Skill Mission Academy. All rights reserved.
          </div>
        </div>
      </body>
    </html>
    `;

    const result = await resend.emails.send({
      from: fromAddress,
      to: options.email,
      subject: `Your DBSM Security Code: ${options.otp}`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('❌ Resend email dispatch error:', result.error);
      return false;
    }

    console.log(`✅ [Resend] Dispatched security code to ${options.email} (Email ID: ${result.data?.id})`);
    return true;
  } catch (err) {
    console.error('❌ Error sending OTP via Resend:', err);
    return false;
  }
}
