import { Resend } from "resend";
import { logger } from "./logger";

// Initialize Resend client only if API key is available
// In development without a key, email sending will be skipped gracefully
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = "Learn to Tarkov";

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send a password reset email with a secure reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<SendEmailResult> {
  // If no Resend client (no API key), log and return success (dev mode)
  if (!resend) {
    logger.warn(
      { email: email.substring(0, 3) + "***", resetUrl },
      "Resend API key not configured - skipping email send (dev mode)"
    );
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: "Reset your password",
      html: getPasswordResetEmailHtml(resetUrl),
      text: getPasswordResetEmailText(resetUrl),
    });

    if (error) {
      logger.error(
        { error, email: email.substring(0, 3) + "***" },
        "Failed to send password reset email"
      );
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error({ err }, "Unexpected error sending password reset email");
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Generate HTML email content for password reset
 */
function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #c4aa6a; letter-spacing: 1px; text-transform: uppercase;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #1a1a1a; border-radius: 8px; padding: 32px; border: 1px solid #333;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
                We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #c4aa6a; color: #0a0a0a; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #737373;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>

              <!-- Fallback Link -->
              <div style="padding: 16px; background-color: #262626; border-radius: 4px; margin-top: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #737373;">
                  If the button doesn't work, copy and paste this link:
                </p>
                <p style="margin: 0; font-size: 12px; word-break: break-all;">
                  <a href="${resetUrl}" style="color: #c4aa6a; text-decoration: none;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #525252;">
                This is an automated message from ${APP_NAME}.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email content for password reset
 */
function getPasswordResetEmailText(resetUrl: string): string {
  return `
Reset Your Password - ${APP_NAME}

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

---
This is an automated message from ${APP_NAME}. Please do not reply to this email.
  `.trim();
}
