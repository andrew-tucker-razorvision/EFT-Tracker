"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Github, ExternalLink, AlertCircle } from "lucide-react";

interface VersionInfo {
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseDate: string;
}

export default function DownloadPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch("/api/companion/version");
        if (!response.ok) throw new Error("Failed to fetch version info");
        const data = await response.json();
        setVersionInfo(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load version info"
        );
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-900 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            EFT Tracker Companion
          </h1>
          <p className="text-lg text-slate-600">
            Desktop companion app for quest tracking and automatic progress sync
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">
                Error loading version info
              </p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Download Card */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Download Now
              </h2>
              {versionInfo && (
                <p className="text-slate-600">
                  Version {versionInfo.latestVersion} • Released{" "}
                  {new Date(versionInfo.releaseDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <Download className="w-8 h-8 text-blue-600" />
          </div>

          {versionInfo && (
            <>
              <p className="text-slate-700 mb-6">{versionInfo.releaseNotes}</p>

              <div className="space-y-3 mb-8">
                <a
                  href={`https://github.com/tuckerandrew21/EFT-Tracker/releases/download/tauri-v${versionInfo.latestVersion}/EFT.Tracker.Companion_${versionInfo.latestVersion}_x64_en-US.msi`}
                  className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                >
                  <Download className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">
                      Windows MSI Installer (Recommended)
                    </p>
                    <p className="text-sm text-blue-700">
                      Easier installation and uninstall
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>

                <a
                  href={`https://github.com/tuckerandrew21/EFT-Tracker/releases/download/tauri-v${versionInfo.latestVersion}/EFT.Tracker.Companion_${versionInfo.latestVersion}_x64-setup.exe`}
                  className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                >
                  <Download className="w-5 h-5 text-slate-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      Windows NSIS Installer (Alternative)
                    </p>
                    <p className="text-sm text-slate-600">
                      Alternative installer option
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                </a>
              </div>

              <a
                href={versionInfo.downloadUrl}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Github className="w-4 h-4" />
                View all releases on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          )}
        </div>

        {/* Features */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Features</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold text-slate-900">
                  System Tray Integration
                </p>
                <p className="text-sm text-slate-600">
                  Lightweight app that runs in your system tray
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold text-slate-900">
                  Automatic Quest Sync
                </p>
                <p className="text-sm text-slate-600">
                  Reads quest progress from game logs automatically
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold text-slate-900">
                  Web App Synchronization
                </p>
                <p className="text-sm text-slate-600">
                  Syncs progress with your account on learntotarkov.com
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold text-slate-900">Auto-Updates</p>
                <p className="text-sm text-slate-600">
                  Updates install automatically in the background
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Installation Guide */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            Installation Guide
          </h3>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  Download the installer
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Click the download button above to get the MSI installer
                  (recommended)
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  Run the installer
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Double-click the downloaded file to start the installation
                  wizard
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  Follow the setup wizard
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Choose installation location and allow the installer to
                  proceed
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                4
              </span>
              <div>
                <p className="font-semibold text-slate-900">Launch the app</p>
                <p className="text-sm text-slate-600 mt-1">
                  Find EFT Tracker Companion in your Start Menu or click the
                  installer&apos;s &ldquo;Launch&rdquo; button
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                5
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  Sign in with your account
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Log in using your EFT Tracker account credentials
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* System Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            System Requirements
          </h3>
          <ul className="space-y-2 text-blue-900">
            <li>• Windows 10 or later (64-bit)</li>
            <li>• 100 MB free disk space</li>
            <li>• Active internet connection</li>
            <li>• Escape from Tarkov installed</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            Troubleshooting
          </h3>
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-slate-900 mb-2">
                &ldquo;Unknown Publisher&rdquo; warning appears during
                installation
              </p>
              <p className="text-sm text-slate-600">
                This is normal for the initial release. Click &ldquo;More
                info&rdquo; then &ldquo;Run anyway&rdquo; to proceed. We plan to
                add code signing in a future update.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-2">
                Installation fails
              </p>
              <p className="text-sm text-slate-600">
                Try running the installer as Administrator. Right-click the file
                and select &ldquo;Run as administrator&rdquo;
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-2">
                App won&apos;t start after installation
              </p>
              <p className="text-sm text-slate-600">
                Make sure you have an active internet connection and your
                account is properly configured
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-2">
                Need more help?
              </p>
              <p className="text-sm text-slate-600">
                Check the{" "}
                <Link
                  href="/faq"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  FAQ page
                </Link>{" "}
                or{" "}
                <a
                  href="https://github.com/tuckerandrew21/EFT-Tracker/issues"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  open an issue on GitHub
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
