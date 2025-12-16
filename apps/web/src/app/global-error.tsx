"use client";

import NextError from "next/error";

/**
 * Global Error Handler
 *
 * This component catches errors at the root level of the application
 * and displays a fallback UI.
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body>
        {/* NextError component renders a default error page */}
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
