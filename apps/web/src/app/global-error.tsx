"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

/**
 * Global Error Handler
 *
 * This component catches errors at the root level of the application.
 * It automatically reports errors to Sentry and displays a fallback UI.
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Capture the error in Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* NextError component renders a default error page */}
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
