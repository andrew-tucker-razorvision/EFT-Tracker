"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useRef } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

/**
 * Cloudflare Turnstile CAPTCHA widget component
 *
 * Provides bot protection for authentication forms with invisible verification
 * for most legitimate users. Automatically adapts to light/dark theme.
 *
 * @param onVerify - Callback when CAPTCHA is successfully verified
 * @param onError - Optional callback when CAPTCHA verification fails
 */
export function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const ref = useRef(null);

  // Skip rendering if site key not configured (development mode)
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      options={{
        theme: "auto", // Automatically matches light/dark theme
        size: "normal",
      }}
    />
  );
}
