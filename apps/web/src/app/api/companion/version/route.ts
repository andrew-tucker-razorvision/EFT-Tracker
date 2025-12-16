import { NextResponse } from "next/server";

// In a real app, this would come from a database or GitHub releases API
// For now, hardcode the current version
const COMPANION_VERSION = {
  latestVersion: "0.1.0",
  downloadUrl:
    "https://github.com/andrew-tucker-razorvision/EFT-Tracker/releases",
  releaseNotes: "Initial release of EFT Tracker Companion",
  releaseDate: "2025-12-09",
};

/**
 * GET /api/companion/version
 *
 * Returns the latest companion app version information.
 * This endpoint is public (no auth required).
 */
export async function GET() {
  return NextResponse.json(COMPANION_VERSION);
}
