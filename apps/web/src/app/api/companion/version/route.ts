import { NextResponse } from "next/server";

// In a real app, this would come from a database or GitHub releases API
// For now, hardcode the current version
const COMPANION_VERSION = {
  latestVersion: "0.1.5",
  downloadUrl:
    "https://github.com/tuckerandrew21/EFT-Tracker/releases/tag/tauri-v0.1.5",
  releaseNotes:
    "Improved stability and bug fixes. Auto-updates now fully functional.",
  releaseDate: "2025-12-16",
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
