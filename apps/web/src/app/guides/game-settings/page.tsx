"use client";

import { useState } from "react";

export default function GameSettingsPage() {
  const [activeTab, setActiveTab] = useState("game-settings");

  return (
    <div className="page" style={styles.page}>
      <style>{cssContent}</style>

      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>Tarkov 1.0 Settings Guide</h1>
          <p style={styles.subtitle}>
            Complete reference for RTX 3080 + 5800X3D @ 1440p
          </p>
          <p style={styles.creatorCredit}>
            📺 Based on <strong>Klemintime</strong>&apos;s comprehensive guide.
            <a
              href="https://www.youtube.com/@klemintime1452"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.creatorLink}
            >
              {" "}
              ▶ Subscribe to his channel
            </a>{" "}
            — he puts serious work into this!
          </p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.hardwareBadge}>RTX 3080 + 5800X3D</span>
          <a
            href="https://youtu.be/9KqNwl7BKuA?si=7Yh3twozle93y78h"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.videoLink}
          >
            ▶ Watch Full Guide
          </a>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={styles.tabsNav}>
        {[
          "Game Settings",
          "NVIDIA CP",
          "Afterburner",
          "Testing",
          "Known Bugs",
        ].map((tab) => {
          const tabId = tab.toLowerCase().replace(/\s+/g, "-");
          return (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tabId
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive),
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Color Legend */}
      <div style={styles.colorLegend}>
        <div style={styles.legendItem}>
          <div
            style={{
              ...styles.legendColor,
              backgroundColor: "var(--accent-gold)",
            }}
          ></div>
          <span style={styles.legendText}>
            <strong>Gold values</strong> = Recommended setting
          </span>
        </div>
        <div style={styles.legendItem}>
          <div
            style={{ ...styles.legendColor, backgroundColor: "var(--kappa)" }}
          ></div>
          <span style={styles.legendText}>
            <strong>Yellow border</strong> = Critical warning (can cause bugs)
          </span>
        </div>
      </div>

      {/* TAB 1: GAME SETTINGS */}
      {activeTab === "game-settings" && (
        <div>
          <div style={styles.settingsPanel}>
            {/* Game Performance Settings */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Game Settings</h3>
              <span style={styles.badge}>Important</span>
            </div>
            <div style={styles.settingsList}>
              <SettingRow
                label="FOV"
                value="75"
                note="Max FOV, +15-20% FPS"
                valueClass="gold"
              />
              <SettingRow
                label="Only use physical cores"
                value="✓ ON"
                note="Hyperthreaded CPUs only"
              />
              <SettingRow
                label="Automatic RAM Cleaner"
                value="✗ OFF"
                note="64GB RAM doesn't need it"
              />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* Display Settings */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Display</h3>
              <span style={styles.badge}>Critical</span>
            </div>
            <div style={styles.settingsList}>
              <SettingRow
                label="Screen resolution"
                value="2560x1440 (16:9)"
                note="Native 1440p"
                valueClass="gold"
              />
              <SettingRow label="Aspect ratio" value="16:9" />
              <SettingRow
                label="Screen mode"
                value="Borderless"
                note="Fullscreen = -50 FPS!"
                valueClass="warning"
                isCritical
              />
              <SettingRow label="Monitor" value="Primary Display" />
              <SettingRow
                label="VSync"
                value="✗ OFF"
                note="Use G-SYNC instead"
              />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* Quality Settings */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Quality</h3>
            </div>
            <div style={styles.settingsList}>
              <SettingRow label="Overall graphics quality" value="custom" />
              <SettingRow
                label="Texture quality"
                value="HIGH"
                note="12-16GB VRAM. Ultra=16GB+"
                valueClass="warning"
                isCritical
              />
              <SettingRow
                label="Shadows quality"
                value="HIGH"
                note="Minimal FPS impact, looks great"
                valueClass="gold"
              />
              <SettingRow label="Shadow Visibility" value="80" />
              <SettingRow
                label="Object LOD quality"
                value="2"
                note="+10% FPS vs 2.5"
                valueClass="gold"
              />
              <SettingRow
                label="Overall visibility"
                value="1500"
                note="Minimal FPS impact"
              />
              <SettingRow
                label="Clouds quality"
                value="HIGH"
                note="No FPS impact"
              />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* Anti-aliasing & Upscaling */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Anti-aliasing &amp; Upscaling</h3>
            </div>
            <div style={styles.settingsList}>
              <SettingRow
                label="Anti-aliasing"
                value="OFF"
                note="DLSS replaces this"
              />
              <SettingRow
                label="NVIDIA DLSS"
                value="QUALITY"
                note="Best balance"
                valueClass="gold"
              />
              <SettingRow
                label="DLSS Preset"
                value="K"
                note="RTX 30 optimized"
                valueClass="gold"
              />
              <SettingRow label="AMD FSR 2.2" value="OFF" />
              <SettingRow label="AMD FSR 3.0" value="OFF" />
              <SettingRow label="Resampling" value="1x off" />
              <SettingRow label="Sharpness" value="0.7" note="Edge clarity" />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* Lighting & Effects */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Lighting &amp; Effects</h3>
            </div>
            <div style={styles.settingsList}>
              <SettingRow
                label="Volumetric lighting"
                value="LOW"
                note="25% FPS on Ultra"
                valueClass="gold"
              />
              <SettingRow
                label="HBAO"
                value="MAX PERFORMANCE"
                note="Detail shadows, low cost"
                valueClass="gold"
              />
              <SettingRow
                label="SSR"
                value="MEDIUM"
                note="Low shimmers too much"
                valueClass="gold"
              />
              <SettingRow
                label="Anisotropic filtering"
                value="ON"
                note="Big visual gain, low cost"
                valueClass="gold"
              />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* FPS & Latency */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>FPS &amp; Latency</h3>
            </div>
            <div style={styles.settingsList}>
              <SettingRow
                label="NVIDIA Reflex Low Latency"
                value="ON (test!)"
                note="30% FPS bug possible"
                valueClass="warning"
                isCritical
              />
              <SettingRow
                label="Disable game FPS limit"
                value="✓ ON"
                note="Uncapped"
              />
              <SettingRow
                label="Lobby FPS Limit"
                value="60"
                note="Save power in menus"
              />
              <SettingRow label="Game FPS Limit" value="Uncapped" />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* Streaming & Memory */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Streaming &amp; Memory</h3>
              <span style={styles.badge}>Critical</span>
            </div>
            <div style={styles.settingsList}>
              <SettingRow
                label="Mip Streaming"
                value="✗ OFF"
                note="Causes crashes!"
              />
              <SettingRow
                label="High-quality color"
                value="✗ OFF"
                note="0 visual gain"
              />
              <SettingRow
                label="Streets Lower Texture Resolution"
                value="✗ OFF"
                note="Only for Ultra tex"
              />
            </div>

            <div style={styles.sectionDivider}></div>

            {/* Effects to Disable */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                Effects (Disable for Visibility)
              </h3>
            </div>
            <div style={styles.settingsList}>
              <SettingRow label="Z-Blur" value="✗ OFF" />
              <SettingRow label="Chromatic aberrations" value="✗ OFF" />
              <SettingRow label="Noise" value="✗ OFF" />
              <SettingRow
                label="Grass shadows"
                value="✓ ON"
                note="Slight GPU cost, looks great"
              />
            </div>
          </div>

          {/* FPS Targets */}
          <div style={styles.fpsSection}>
            <div style={styles.fpsTitle}>Expected FPS @ 1440p</div>
            <div style={styles.fpsGrid}>
              <FpsBadge map="Factory" fps="144+" />
              <FpsBadge map="Labs" fps="144+" />
              <FpsBadge map="Woods" fps="135-144+" />
              <FpsBadge map="Customs" fps="130-144+" />
              <FpsBadge map="Shoreline" fps="125-140" />
              <FpsBadge map="Reserve" fps="115-135" />
              <FpsBadge map="Interchange" fps="110-130" />
              <FpsBadge map="Lighthouse" fps="100-120" />
              <FpsBadge map="Ground Zero" fps="105-125" />
              <FpsBadge map="Streets" fps="80-100" isWarning />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NVIDIA CONTROL PANEL */}
      {activeTab === "nvidia-cp" && (
        <div style={styles.settingsPanel}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Program-Specific Settings</h3>
          </div>
          <p style={styles.helpText}>
            Set these in NVIDIA Control Panel → Manage 3D Settings → Program
            Settings (select EscapeFromTarkov.exe)
          </p>

          <div style={styles.settingsList}>
            <SettingRow
              label="Power Management Mode"
              value="Prefer Maximum Performance"
              valueClass="gold"
            />
            <SettingRow
              label="Low Latency Mode"
              value="ULTRA"
              note="(if Reflex disabled)"
              valueClass="gold"
            />
            <SettingRow label="Texture Filtering" value="High Performance" />
            <SettingRow label="Threaded Optimization" value="✓ ON" />
            <SettingRow
              label="Max Frame Rate"
              value="✗ OFF"
              note="Let game handle it"
            />
          </div>

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              G-SYNC Configuration (if supported)
            </h3>
          </div>
          <div style={styles.settingsList}>
            <SettingRow label="Enable G-SYNC" value="✓ YES" />
            <SettingRow
              label="In-Game FPS Limit"
              value="Monitor Hz - 3"
              note="e.g., 144Hz → 141 FPS"
            />
            <SettingRow
              label="Why"
              value=""
              note="Prevents G-SYNC boundary crossing"
              hideValue
            />
          </div>
        </div>
      )}

      {/* TAB 3: MSI AFTERBURNER */}
      {activeTab === "afterburner" && (
        <div style={styles.settingsPanel}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Installation &amp; Setup</h3>
          </div>
          <div style={styles.helpText}>
            <p>1. Download MSI Afterburner from MSI&apos;s official website</p>
            <p style={{ marginTop: "8px" }}>
              2. Install and launch with admin privileges
            </p>
            <p style={{ marginTop: "8px" }}>
              3. Enable the on-screen display (OSD) in settings
            </p>
            <p style={{ marginTop: "8px" }}>
              4. Configure monitoring tab to show desired metrics
            </p>
          </div>

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              Metrics to Monitor During Testing
            </h3>
          </div>
          <div style={styles.settingsList}>
            <SettingRow label="GPU Usage" value="95-100%" note="If GPU-bound" />
            <SettingRow
              label="VRAM Usage"
              value="< 9.5GB"
              note="For RTX 3080 on HIGH"
            />
            <SettingRow
              label="CPU Usage"
              value="Monitor all cores"
              note="Look for bottleneck"
            />
            <SettingRow
              label="FPS (Average)"
              value="80+ Streets"
              note="Target minimum"
              valueClass="gold"
            />
            <SettingRow
              label="FPS (1% Low)"
              value="> 60 FPS"
              note="Consistency matters"
              valueClass="gold"
            />
            <SettingRow
              label="GPU Temperature"
              value="< 80°C"
              note="Safe operating zone"
            />
          </div>

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Overlay Configuration</h3>
          </div>
          <div style={styles.helpText}>
            <p>
              <strong style={{ color: "var(--text-bright)" }}>
                Recommended OSD Layout:
              </strong>
            </p>
            <p style={{ marginTop: "8px" }}>- GPU Load (%)</p>
            <p>- GPU Temperature (°C)</p>
            <p>- GPU Memory Usage (MB)</p>
            <p>- FPS Counter</p>
            <p style={{ marginTop: "12px" }}>
              <strong style={{ color: "var(--text-bright)" }}>Position:</strong>{" "}
              Top-left corner (doesn&apos;t block HUD)
            </p>
            <p style={{ marginTop: "8px" }}>
              <strong style={{ color: "var(--text-bright)" }}>Hotkey:</strong>{" "}
              Set custom hotkey to toggle on/off during raids
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: TESTING PROTOCOL */}
      {activeTab === "testing" && (
        <div style={styles.settingsPanel}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Pre-Launch Checklist</h3>
            <span style={styles.badge}>Important</span>
          </div>
          <div style={styles.checklist}>
            <ChecklistItem
              icon="✓"
              label="Screen Mode"
              desc="BORDERLESS verified (test in-game)"
              isCritical
            />
            <ChecklistItem
              icon="✓"
              label="Texture Quality"
              desc="HIGH (12-16GB VRAM)"
            />
            <ChecklistItem
              icon="✓"
              label="DLSS"
              desc="ON (QUALITY, Preset K)"
            />
            <ChecklistItem
              icon="⚠"
              label="Reflex"
              desc="ON but will test for bug"
              isWarning
            />
            <ChecklistItem
              icon="✓"
              label="All Critical Settings"
              desc="See Game Settings tab"
            />
          </div>

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              Initial Testing (Streets Offline)
            </h3>
          </div>
          <div style={styles.checklist}>
            <ChecklistItem
              icon="✓"
              label="MSI Afterburner"
              desc="Installed and monitoring active"
            />
            <ChecklistItem
              icon="✓"
              label="VRAM Usage"
              desc="Stays below 9.5GB throughout"
            />
            <ChecklistItem
              icon="✓"
              label="FPS 1% Low"
              desc="No drops below 60 FPS"
            />
            <ChecklistItem
              icon="✓"
              label="GPU Temperature"
              desc="Stays below 80°C"
            />
          </div>

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Reflex Stability Test</h3>
            <span style={styles.badge}>Critical</span>
          </div>
          <div style={styles.checklist}>
            <ChecklistItem
              icon="!"
              label="Run 3 Online Raids"
              desc="Monitor for sudden 30% FPS drops"
              isWarning
            />
            <ChecklistItem
              icon="!"
              label="Document Performance"
              desc="Note any drops or anomalies"
              isWarning
            />
            <ChecklistItem
              icon="!"
              label="If Drops Occur"
              desc="Disable Reflex and retest"
              isWarning
            />
          </div>

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Final Validation</h3>
          </div>
          <div style={styles.checklist}>
            <ChecklistItem
              icon="✓"
              label="FPS Targets Met"
              desc="See Game Settings tab for map targets"
            />
            <ChecklistItem
              icon="✓"
              label="No Crashes or Stutters"
              desc="Stable across multiple raids"
            />
            <ChecklistItem
              icon="✓"
              label="Comfortable Performance"
              desc="Ready for competitive gameplay"
            />
          </div>
        </div>
      )}

      {/* TAB 5: KNOWN BUGS */}
      {activeTab === "known-bugs" && (
        <div style={styles.settingsPanel}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Critical Bugs (Must Know)</h3>
            <span style={styles.badge}>Critical</span>
          </div>

          <BugItem
            title="Fullscreen Mode Bug"
            details={[
              "Symptom: ~50 FPS loss (30% reduction)",
              "Example: Factory offline: 230 FPS borderless → 185 FPS fullscreen",
              "Cause: Unity engine bug with fullscreen mode",
              "Fix: ALWAYS use BORDERLESS mode",
            ]}
          />

          <BugItem
            title="Nvidia Reflex FPS Bug"
            details={[
              "Symptom: Sudden 30% FPS drop mid-raid that persists",
              "Status: Recurring bug across patches",
              "Fix: Disable Nvidia Reflex, restart game",
              'Note: This is why "test first" is emphasized',
            ]}
          />

          <BugItem
            title="MIP Streaming Crashes"
            details={[
              "Symptom: Game crashes at raid end or during load",
              "Status: Broken in current patch",
              "Recommendation: Keep OFF unless you know it helps",
            ]}
          />

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Common Issues &amp; Fixes</h3>
          </div>

          <BugItem
            title="Streets Stuttering/Micro-Stutters"
            details={[
              "Check 1: Ensure Texture Quality = HIGH (not Ultra)",
              "Check 2: Disable VRAM-hungry settings (Volumetric Ultra, SSR Ultra, etc.)",
              "Monitor: VRAM usage should stay < 9.5GB",
            ]}
          />

          <BugItem
            title="DLSS Ghosting/Motion Blur"
            details={[
              "Symptom: Trails on fast camera movement",
              "Fix 1: Update GPU drivers to latest version",
              "Fix 2: Try DLSS Preset F (if K is problematic)",
              "Note: K is recommended, F is older CNN model",
            ]}
          />

          <div style={styles.sectionDivider}></div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Quick FPS Boost Sequence</h3>
            <span style={styles.badge}>If Needed</span>
          </div>
          <div style={styles.helpText}>
            <p>
              <strong style={{ color: "var(--text-bright)" }}>
                Only use if Streets FPS drops below 60:
              </strong>
            </p>
            <p style={{ marginTop: "12px" }}>
              <strong>1. DLSS Quality → Balanced</strong>
              <br />
              +15-20 FPS, slight blur
            </p>
            <p style={{ marginTop: "10px" }}>
              <strong>2. SSR Medium → Low</strong>
              <br />
              +5 FPS, minimal reflection impact
            </p>
            <p style={{ marginTop: "10px" }}>
              <strong>3. Object LOD 2.2 → 2.0</strong>
              <br />
              +10 FPS, more pop-in
            </p>
            <p style={{ marginTop: "10px" }}>
              <strong>4. Volumetric LOW → OFF</strong>
              <br />
              +5-8 FPS
            </p>
            <p style={{ marginTop: "12px", color: "var(--kappa)" }}>
              <strong>⚠ Stop sequence once FPS stable above 60</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function SettingRow({
  label,
  value,
  note,
  valueClass,
  isCritical,
  hideValue,
}: {
  label: string;
  value?: string;
  note?: string;
  valueClass?: string;
  isCritical?: boolean;
  hideValue?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.settingRow,
        ...(isCritical ? { borderLeft: "3px solid var(--kappa)" } : {}),
      }}
    >
      <span style={styles.settingLabel}>{label}</span>
      {!hideValue && (
        <div style={styles.settingValue}>
          <span
            style={{
              ...styles.valueBox,
              ...(valueClass === "gold"
                ? styles.valueBoxGold
                : valueClass === "warning"
                  ? styles.valueBoxWarning
                  : {}),
            }}
          >
            {value}
          </span>
          {note && (
            <span
              style={
                valueClass === "warning"
                  ? styles.settingNoteWarning
                  : styles.settingNote
              }
            >
              {note}
            </span>
          )}
        </div>
      )}
      {hideValue && note && (
        <div style={styles.settingValue}>
          <span style={styles.settingNote}>{note}</span>
        </div>
      )}
    </div>
  );
}

function FpsBadge({
  map,
  fps,
  isWarning,
}: {
  map: string;
  fps: string;
  isWarning?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.fpsBadge,
        ...(isWarning ? styles.fpsBadgeWarning : {}),
      }}
    >
      <span style={styles.fpsMap}>{map}</span>
      <span
        style={{
          ...styles.fpsValue,
          ...(isWarning ? { color: "var(--kappa)" } : {}),
        }}
      >
        {fps}
      </span>
    </div>
  );
}

function ChecklistItem({
  icon,
  label,
  desc,
  isCritical,
  isWarning,
}: {
  icon: string;
  label: string;
  desc: string;
  isCritical?: boolean;
  isWarning?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.checklistItem,
        ...(isCritical || isWarning ? styles.checklistItemCritical : {}),
      }}
    >
      <div
        style={{
          ...styles.checklistItemIcon,
          color: isWarning ? "var(--kappa)" : "var(--success)",
        }}
      >
        {icon}
      </div>
      <div style={styles.checklistItemText}>
        <div style={styles.checklistLabel}>{label}</div>
        <div style={styles.checklistDesc}>{desc}</div>
      </div>
    </div>
  );
}

function BugItem({ title, details }: { title: string; details: string[] }) {
  return (
    <div style={styles.bugItem}>
      <div style={styles.bugTitle}>{title}</div>
      <div style={styles.bugDetail}>
        {details.map((detail, idx) => (
          <div key={idx}>{detail}</div>
        ))}
      </div>
    </div>
  );
}

// Inline styles object
const styles = {
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "24px",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "32px",
    alignItems: "start",
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid var(--tactical-border)",
  } as React.CSSProperties,
  h1: {
    fontFamily: "var(--font-heading)",
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-bright)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: 0,
    lineHeight: 1.2,
  } as React.CSSProperties,
  subtitle: {
    margin: 0,
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  } as React.CSSProperties,
  creatorCredit: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    marginTop: "8px",
  } as React.CSSProperties,
  creatorLink: {
    color: "var(--accent-gold)",
    textDecoration: "none",
    fontWeight: 600,
    transition: "all 0.2s",
  } as React.CSSProperties,
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "12px",
    justifyContent: "flex-start",
  } as React.CSSProperties,
  hardwareBadge: {
    padding: "10px 14px",
    background: "var(--bg-card)",
    border: "1px solid var(--tactical-border)",
    borderRadius: "6px",
    fontFamily: "var(--font-heading)",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--accent-gold)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    minWidth: "max-content",
  } as React.CSSProperties,
  videoLink: {
    padding: "10px 14px",
    background: "var(--bg-card)",
    border: "1px solid var(--tactical-border)",
    borderRadius: "6px",
    color: "var(--text-tertiary)",
    fontSize: "0.75rem",
    textDecoration: "none",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    minWidth: "max-content",
  } as React.CSSProperties,
  tabsNav: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    borderBottom: "1px solid var(--tactical-border)",
    overflowX: "auto",
    paddingBottom: "0",
  } as React.CSSProperties,
  tabButton: {
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "var(--text-tertiary)",
    fontFamily: "var(--font-heading)",
    fontSize: "0.85rem",
    fontWeight: 600,
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  } as React.CSSProperties,
  tabButtonInactive: {
    color: "var(--text-tertiary)",
  } as React.CSSProperties,
  tabButtonActive: {
    color: "var(--accent-gold)",
    borderBottomColor: "var(--accent-gold)",
  } as React.CSSProperties,
  colorLegend: {
    display: "flex",
    gap: "24px",
    padding: "12px 16px",
    background: "var(--bg-card)",
    border: "1px solid var(--tactical-border)",
    borderRadius: "6px",
    marginBottom: "20px",
    flexWrap: "wrap",
  } as React.CSSProperties,
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.75rem",
  } as React.CSSProperties,
  legendColor: {
    width: "16px",
    height: "16px",
    borderRadius: "3px",
    flexShrink: 0,
  } as React.CSSProperties,
  legendText: {
    color: "var(--text-tertiary)",
  } as React.CSSProperties,
  settingsPanel: {
    background: "var(--bg-panel)",
    border: "1px solid var(--tactical-border)",
    borderRadius: "8px",
    padding: "20px",
  } as React.CSSProperties,
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--tactical-border)",
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-bright)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: 0,
  } as React.CSSProperties,
  badge: {
    fontSize: "0.6rem",
    padding: "2px 6px",
    background: "var(--warning-bg)",
    border: "1px solid var(--warning-border)",
    borderRadius: "3px",
    color: "var(--kappa)",
    textTransform: "uppercase",
    fontWeight: 600,
  } as React.CSSProperties,
  settingsList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  } as React.CSSProperties,
  settingRow: {
    display: "grid",
    gridTemplateColumns: "1fr 110px",
    alignItems: "start",
    gap: "12px",
    padding: "8px 12px",
    background: "var(--bg-card)",
    borderRadius: "4px",
    transition: "background 0.15s",
  } as React.CSSProperties,
  settingLabel: {
    fontSize: "0.8rem",
    color: "var(--text-tertiary)",
    paddingTop: "4px",
  } as React.CSSProperties,
  settingValue: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "4px",
  } as React.CSSProperties,
  valueBox: {
    padding: "5px 10px",
    background: "var(--bg-input)",
    border: "1px solid var(--tactical-border)",
    borderRadius: "4px",
    fontFamily: "var(--font-heading)",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-bright)",
    textAlign: "center",
  } as React.CSSProperties,
  valueBoxGold: {
    color: "var(--accent-gold)",
    borderColor: "var(--accent-gold-dim)",
  } as React.CSSProperties,
  valueBoxWarning: {
    color: "var(--kappa)",
    borderColor: "var(--warning-border)",
    background: "var(--warning-bg)",
  } as React.CSSProperties,
  settingNote: {
    fontSize: "0.65rem",
    color: "var(--text-tertiary)",
    textAlign: "center",
    lineHeight: 1.3,
  } as React.CSSProperties,
  settingNoteWarning: {
    fontSize: "0.65rem",
    color: "var(--kappa)",
    textAlign: "center",
    lineHeight: 1.3,
  } as React.CSSProperties,
  sectionDivider: {
    height: "1px",
    background: "var(--tactical-border)",
    margin: "20px 0",
  } as React.CSSProperties,
  fpsSection: {
    marginTop: "20px",
    padding: "16px",
    background: "var(--bg-card)",
    border: "1px solid var(--tactical-border)",
    borderRadius: "8px",
  } as React.CSSProperties,
  fpsTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    marginBottom: "12px",
  } as React.CSSProperties,
  fpsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  } as React.CSSProperties,
  fpsBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "var(--bg-panel)",
    borderRadius: "4px",
    borderLeft: "2px solid var(--success)",
  } as React.CSSProperties,
  fpsBadgeWarning: {
    borderLeftColor: "var(--kappa)",
    background: "var(--warning-bg)",
  } as React.CSSProperties,
  fpsMap: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
  } as React.CSSProperties,
  fpsValue: {
    fontFamily: "var(--font-heading)",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--success)",
  } as React.CSSProperties,
  checklist: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  } as React.CSSProperties,
  checklistItem: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "12px",
    padding: "12px",
    background: "var(--bg-card)",
    borderRadius: "4px",
    alignItems: "start",
  } as React.CSSProperties,
  checklistItemCritical: {
    borderLeft: "3px solid var(--kappa)",
  } as React.CSSProperties,
  checklistItemIcon: {
    fontSize: "1.1rem",
    color: "var(--success)",
    marginTop: "2px",
  } as React.CSSProperties,
  checklistItemText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  } as React.CSSProperties,
  checklistLabel: {
    fontFamily: "var(--font-heading)",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-bright)",
    textTransform: "uppercase",
  } as React.CSSProperties,
  checklistDesc: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)",
  } as React.CSSProperties,
  bugItem: {
    padding: "12px",
    background: "var(--bg-card)",
    borderLeft: "3px solid var(--kappa)",
    borderRadius: "4px",
    marginBottom: "12px",
  } as React.CSSProperties,
  bugTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-bright)",
    marginBottom: "6px",
  } as React.CSSProperties,
  bugDetail: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "0.75rem",
    color: "var(--text-tertiary)",
  } as React.CSSProperties,
  helpText: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    marginBottom: "20px",
  } as React.CSSProperties,
};

// CSS Content
const cssContent = `
  :root {
    --bg-dark: #0a0a0a;
    --bg-panel: #111111;
    --bg-card: #161616;
    --bg-elevated: #1a1a1a;
    --bg-input: #1e1e1e;
    --text-bright: #e8e6d4;
    --text-secondary: #b0ae9e;
    --text-tertiary: #7a7868;
    --text-disabled: #4a4a40;
    --accent-gold: #c4aa6a;
    --accent-gold-dim: rgba(196,170,106,0.25);
    --success: #4ade80;
    --kappa: #ffcc00;
    --warning-bg: rgba(255,204,0,0.08);
    --warning-border: rgba(255,204,0,0.3);
    --tactical-border: rgba(196,170,106,0.2);
    --tactical-border-hover: rgba(196,170,106,0.4);
    --font-heading: 'Rajdhani', sans-serif;
    --font-body: 'Inter', sans-serif;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: var(--font-body);
    background: var(--bg-dark);
    color: var(--text-secondary);
    line-height: 1.5;
    min-height: 100vh;
  }

  @media (max-width: 768px) {
    .setting-note {
      display: none;
    }

    .header {
      flex-direction: column;
      gap: 12px;
    }

    .tabs-nav {
      gap: 4px;
    }

    .tab-button {
      padding: 10px 12px;
      font-size: 0.75rem;
    }
  }
`;
