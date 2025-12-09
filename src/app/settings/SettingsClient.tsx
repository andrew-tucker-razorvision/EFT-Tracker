"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface CompanionToken {
  id: string;
  tokenHint: string;
  deviceName: string;
  gameMode: string;
  lastSeen: string;
  createdAt: string;
}

interface NewTokenResponse {
  token: string;
  tokenId: string;
  deviceName: string;
  gameMode: string;
  createdAt: string;
  message: string;
}

export function SettingsClient() {
  const [tokens, setTokens] = useState<CompanionToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New token form
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [gameMode, setGameMode] = useState<"PVP" | "PVE">("PVP");
  const [creating, setCreating] = useState(false);

  // Newly created token (shown once)
  const [newToken, setNewToken] = useState<NewTokenResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoking
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/companion/link");
      if (!res.ok) throw new Error("Failed to fetch tokens");
      const data = await res.json();
      setTokens(data.tokens);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      setError("Device name is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/companion/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName, gameMode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create token");
      }

      const data: NewTokenResponse = await res.json();
      setNewToken(data);
      setShowNewTokenForm(false);
      setDeviceName("");
      await fetchTokens();
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this token? The device will be disconnected."
      )
    ) {
      return;
    }

    setRevoking(tokenId);
    setError(null);

    try {
      const res = await fetch("/api/companion/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke token");
      }

      await fetchTokens();
    } catch (err) {
      setError(String(err));
    } finally {
      setRevoking(null);
    }
  };

  const handleCopyToken = async () => {
    if (!newToken?.token) return;

    try {
      await navigator.clipboard.writeText(newToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = newToken.token;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastSeen = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#e5e5e5]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Companion App Section */}
        <section className="bg-[#2d2d2d] rounded-lg border border-[#404040] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-[#d4a574]" />
              <h2 className="text-lg font-semibold">Companion App</h2>
            </div>
            <a
              href="https://github.com/andrew-tucker-razorvision/EFT-Tracker/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#d4a574] hover:text-[#d4a574]/80 flex items-center gap-1"
            >
              Download App
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-[#9ca3af] text-sm mb-6">
            Connect the EFT Tracker Companion app to automatically sync your
            quest progress from the game. Generate a token below and enter it in
            the companion app.
          </p>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* New token display */}
          {newToken && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-400">Token Created!</p>
                  <p className="text-sm text-[#9ca3af] mt-1">
                    Copy this token now. It will not be shown again.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={newToken.token}
                  className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded-lg px-3 py-2 font-mono text-sm"
                />
                <button
                  onClick={handleCopyToken}
                  className="px-4 py-2 bg-[#d4a574] hover:bg-[#d4a574]/80 text-[#1a1a1a] rounded-lg font-medium flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setNewToken(null)}
                className="mt-3 text-sm text-[#9ca3af] hover:text-[#e5e5e5]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* New token form */}
          {showNewTokenForm ? (
            <form
              onSubmit={handleCreateToken}
              className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-[#404040]"
            >
              <h3 className="font-medium mb-4">Generate New Token</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-1">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g., Gaming PC, Laptop"
                    maxLength={100}
                    className="w-full bg-[#2d2d2d] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4a574]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#9ca3af] mb-1">
                    Game Mode
                  </label>
                  <select
                    value={gameMode}
                    onChange={(e) =>
                      setGameMode(e.target.value as "PVP" | "PVE")
                    }
                    className="w-full bg-[#2d2d2d] border border-[#404040] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4a574]"
                  >
                    <option value="PVP">PVP</option>
                    <option value="PVE">PVE</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#d4a574] hover:bg-[#d4a574]/80 disabled:opacity-50 text-[#1a1a1a] rounded-lg font-medium flex items-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Generate Token
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTokenForm(false)}
                  className="px-4 py-2 bg-[#404040] hover:bg-[#505050] rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowNewTokenForm(true)}
              className="mb-6 px-4 py-2 bg-[#d4a574] hover:bg-[#d4a574]/80 text-[#1a1a1a] rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate New Token
            </button>
          )}

          {/* Linked devices */}
          <div>
            <h3 className="font-medium mb-3">Linked Devices</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#d4a574]" />
              </div>
            ) : tokens.length === 0 ? (
              <p className="text-[#9ca3af] text-sm py-4 text-center">
                No devices linked. Generate a token above to connect the
                companion app.
              </p>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#404040]"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-[#9ca3af]" />
                      <div>
                        <p className="font-medium">{token.deviceName}</p>
                        <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                new Date(token.lastSeen).getTime() >
                                Date.now() - 300000
                                  ? "bg-green-500"
                                  : "bg-[#9ca3af]"
                              }`}
                            />
                            {formatLastSeen(token.lastSeen)}
                          </span>
                          <span>{token.gameMode}</span>
                          <span className="font-mono">
                            ...{token.tokenHint}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeToken(token.id)}
                      disabled={revoking === token.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg disabled:opacity-50"
                      title="Revoke token"
                    >
                      {revoking === token.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Other settings can be added here */}
      </div>
    </div>
  );
}
