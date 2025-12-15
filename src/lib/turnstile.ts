/**
 * Cloudflare Turnstile CAPTCHA verification utility
 *
 * Server-side verification of Turnstile tokens to prevent bot activity
 * on authentication forms. Falls back to allowing requests in development
 * when Turnstile is not configured.
 */

import { logger } from "./logger";
import { env } from "./env";

export interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile token with Cloudflare
 *
 * @param token - The Turnstile response token from the client
 * @returns Promise<boolean> - True if verification successful, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyTurnstile(turnstileToken);
 * if (!isValid) {
 *   return NextResponse.json(
 *     { error: 'CAPTCHA verification failed' },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  // Allow in development if Turnstile not configured
  if (!env.TURNSTILE_SECRET_KEY) {
    logger.warn(
      "Turnstile not configured (TURNSTILE_SECRET_KEY missing), skipping verification"
    );
    return true;
  }

  // Validate token format
  if (!token || token.trim().length === 0) {
    logger.warn("Invalid Turnstile token: empty or missing");
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        "Turnstile API request failed"
      );
      return false;
    }

    const data: TurnstileResponse = await response.json();

    if (!data.success) {
      logger.warn(
        { errorCodes: data["error-codes"] },
        "Turnstile verification failed"
      );
      return false;
    }

    logger.debug(
      {
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      },
      "Turnstile verification successful"
    );

    return true;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        token: token.substring(0, 10) + "...", // Log partial token for debugging
      },
      "Turnstile verification error"
    );
    return false;
  }
}
