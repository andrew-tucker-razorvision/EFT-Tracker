import { useState, useCallback } from "react";
import {
  ArrowLeft,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { validateToken, type TokenValidation } from "../lib/tauri";

interface LinkAccountProps {
  onComplete: (token: string, validation: TokenValidation) => void;
  onBack: () => void;
}

export function LinkAccount({ onComplete, onBack }: LinkAccountProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<TokenValidation | null>(null);

  const handleValidate = useCallback(async () => {
    if (!token.trim()) {
      setError("Please enter a companion token");
      return;
    }

    if (!token.startsWith("cmp_")) {
      setError("Invalid token format. Token should start with 'cmp_'");
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const result = await validateToken(token);
      setValidation(result);

      if (!result.valid) {
        setError(result.error || "Invalid or expired token");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setValidating(false);
    }
  }, [token]);

  const handleConfirm = useCallback(() => {
    if (validation?.valid) {
      onComplete(token, validation);
    }
  }, [token, validation, onComplete]);

  return (
    <div className="h-screen bg-tarkov-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-tarkov-surface border-b border-tarkov-border p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-tarkov-border text-tarkov-muted hover:text-tarkov-text"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-tarkov-text">
            Link Account
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <h2 className="font-medium text-tarkov-text mb-2">
            How to get a companion token
          </h2>
          <ol className="list-decimal list-inside text-sm text-tarkov-muted space-y-2">
            <li>
              Go to{" "}
              <a
                href="https://eft-tracker.vercel.app/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tarkov-accent hover:underline"
              >
                eft-tracker.vercel.app/settings
              </a>
            </li>
            <li>Sign in to your account</li>
            <li>Navigate to &quot;Companion App&quot; section</li>
            <li>Click &quot;Generate New Token&quot;</li>
            <li>Copy the token and paste it below</li>
          </ol>
        </div>

        {/* Token input */}
        <div className="bg-tarkov-surface rounded-lg p-4 border border-tarkov-border">
          <label className="block text-sm font-medium text-tarkov-text mb-2">
            Companion Token
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tarkov-muted" />
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError(null);
                  setValidation(null);
                }}
                placeholder="cmp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-tarkov-bg border border-tarkov-border rounded-lg py-2 pl-10 pr-10 text-tarkov-text placeholder-tarkov-muted/50 focus:outline-none focus:border-tarkov-accent"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tarkov-muted hover:text-tarkov-text"
                title={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              onClick={handleValidate}
              disabled={validating || !token.trim()}
              className="bg-tarkov-accent hover:bg-tarkov-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-tarkov-bg font-medium rounded-lg px-4 py-2 flex items-center gap-2"
            >
              {validating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Validate"
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-start gap-2 text-tarkov-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Validation result */}
        {validation?.valid && (
          <div className="bg-tarkov-success/10 rounded-lg p-4 border border-tarkov-success">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-tarkov-success" />
              <span className="font-medium text-tarkov-success">
                Token Valid!
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-tarkov-muted">Account</span>
                <span className="text-tarkov-text">{validation.userName}</span>
              </div>
              {validation.playerLevel && (
                <div className="flex justify-between">
                  <span className="text-tarkov-muted">Level</span>
                  <span className="text-tarkov-text">
                    {validation.playerLevel}
                  </span>
                </div>
              )}
              {validation.deviceName && (
                <div className="flex justify-between">
                  <span className="text-tarkov-muted">Device</span>
                  <span className="text-tarkov-text">
                    {validation.deviceName}
                  </span>
                </div>
              )}
              {validation.gameMode && (
                <div className="flex justify-between">
                  <span className="text-tarkov-muted">Mode</span>
                  <span className="text-tarkov-text">
                    {validation.gameMode}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleConfirm}
              className="w-full mt-4 bg-tarkov-success hover:bg-tarkov-success/80 text-white font-medium rounded-lg py-2 px-4"
            >
              Link This Account
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
