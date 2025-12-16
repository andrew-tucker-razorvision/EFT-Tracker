import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Test Endpoint
 *
 * This endpoint is used to test Sentry error tracking.
 * Access it at: http://localhost:3000/api/sentry-test
 *
 * After calling this endpoint, check your Sentry dashboard at:
 * https://sentry.io/organizations/[org]/issues/
 *
 * IMPORTANT: Remove this endpoint before deploying to production
 * or protect it with authentication.
 */
export async function GET() {
  try {
    // Capture a test message
    Sentry.captureMessage("Sentry test message from API route", "info");

    // Throw a test error
    throw new Error("This is a test error from the Sentry test API route");
  } catch (error) {
    // Capture the error with additional context
    Sentry.captureException(error, {
      tags: {
        endpoint: "/api/sentry-test",
        test: true,
      },
      extra: {
        timestamp: new Date().toISOString(),
        message: "This is a test error to verify Sentry integration",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Test error sent to Sentry",
        note: "Check your Sentry dashboard to see if the error was captured",
      },
      { status: 200 }
    );
  }
}
