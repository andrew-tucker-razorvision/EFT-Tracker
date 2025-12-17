# Manual Testing Checklist

**Version:** 0.1.5
**Date Tested:** [FILL IN DATE]
**Tester:** [FILL IN NAME]
**OS:** Windows [VERSION]

## Test Setup

- [ ] Downloaded installer from GitHub releases
- [ ] Running on clean Windows environment (or reinstalled app)
- [ ] System has internet connection
- [ ] Have Learn to Tarkov account credentials available
- [ ] Have EFT installation path ready

## Installation & Launch

### First-Time Installation

- [ ] Double-click `.msi` installer
- [ ] Windows UAC prompt appears
- [ ] Installation wizard completes successfully
- [ ] Shortcuts created in Start Menu
- [ ] System tray icon appears after installation
- [ ] App not automatically launched after install

### Launching from Start Menu

- [ ] Start Menu contains "EFT Tracker Companion"
- [ ] Clicking entry launches app
- [ ] App window appears on screen
- [ ] Window size reasonable (400x600 default)
- [ ] Window can be resized (min: 350x400)
- [ ] Window can be moved around desktop

### System Tray Integration

- [ ] Icon visible in system tray (bottom-right)
- [ ] Single click opens app window
- [ ] Single click when already open minimizes to tray
- [ ] Right-click shows context menu with options
- [ ] "Quit" option in context menu closes app
- [ ] Icon disappears from tray when app closed

## First Run Experience

### Welcome Screen

- [ ] Welcome dialog appears on first launch
- [ ] Dialog has "Link Account" button
- [ ] Dialog explains purpose (sync quest progress)
- [ ] Dialog mentions Learn to Tarkov website
- [ ] Can close dialog without linking (X button works)

### Linking Account

- [ ] "Link Account" button opens token entry form
- [ ] Token input field has placeholder text
- [ ] Can type/paste token into field
- [ ] Whitespace trimmed from token
- [ ] Submit button appears below input
- [ ] Submit button disabled while field empty

### Token Validation

- [ ] Enter invalid token (e.g., "invalid123") → Error message appears
- [ ] Error message is clear (e.g., "Invalid token format")
- [ ] Can retry after error
- [ ] Enter valid token from Learn to Tarkov → Accepts without error
- [ ] After valid token, form closes/changes view

### Settings Auto-Configuration

- [ ] After linking, app shows initial load
- [ ] App attempts to detect EFT installation path
- [ ] If found, path displayed in settings
- [ ] If not found, user prompted to enter manually
- [ ] Can browse file system to select EFT folder

## Settings Panel

### Accessing Settings

- [ ] Settings icon (gear) visible in app
- [ ] Clicking settings icon opens settings panel
- [ ] Settings panel shows all available options
- [ ] Settings panel can be closed (X or back button)

### Notification Settings

- [ ] "Enable notifications" toggle visible
- [ ] Toggle can be turned ON and OFF
- [ ] Toggled state saves immediately (no "Save" button needed)
- [ ] Setting persists after app restart

### Auto-Watch Settings

- [ ] "Auto-watch active quest" toggle visible
- [ ] Toggle can be turned ON and OFF
- [ ] Setting persists after app restart
- [ ] When enabled, game log watching starts automatically

### Autostart Settings

- [ ] "Launch at Windows startup" toggle visible
- [ ] Toggle can be turned ON and OFF
- [ ] When enabled, app launches on Windows restart
- [ ] When disabled, app does not auto-launch on restart

### EFT Path Settings

- [ ] Current EFT path displayed in settings
- [ ] Can edit path manually (text field or browse button)
- [ ] "Browse" button opens file picker
- [ ] Changed path saved immediately
- [ ] App validates path (shows error if invalid)

### Settings Persistence

- [ ] Change setting (e.g., disable notifications)
- [ ] Close app completely (quit from system tray)
- [ ] Reopen app
- [ ] Setting is still disabled (persisted correctly)
- [ ] All settings survive app restart

## Sync & Progress Updates

### Initial Sync

- [ ] After linking account, app syncs quest data
- [ ] Sync completes without errors
- [ ] Quest progress displays in app
- [ ] Recent updates show in "Recent Activity" section (if present)

### Log Watching

- [ ] App monitors EFT game logs in real-time
- [ ] When quest completed in game, app detects it
- [ ] Completed quest appears in "Recent Activity"
- [ ] Auto-syncs to Learn to Tarkov within seconds

### Manual Refresh

- [ ] Refresh button (if present) re-syncs progress
- [ ] Shows loading state during refresh
- [ ] Displays update completion message
- [ ] Recent activity updated with latest progress

## System Tray Behavior

### Minimize/Restore

- [ ] Click system tray icon → App window appears
- [ ] Click app title bar close button → Minimizes to tray (not close)
- [ ] "Quit" from context menu → Closes app completely
- [ ] "Show" from context menu → Opens window

### Context Menu

- [ ] Right-click tray icon → Context menu appears
- [ ] Menu shows "Show/Hide" option
- [ ] Menu shows "Settings" option (if available)
- [ ] Menu shows "Quit" option
- [ ] Menu disappears when clicking elsewhere

### App Running Indicator

- [ ] System tray icon clearly indicates app is running
- [ ] Icon visible/consistent when app is open
- [ ] Icon visible/consistent when app is minimized to tray
- [ ] No duplicate icons in tray

## Error Handling

### Invalid EFT Path

- [ ] Set EFT path to invalid location
- [ ] App shows error message (not crash)
- [ ] Error message suggests solutions
- [ ] Can correct path and retry

### Network Disconnection

- [ ] Disable internet connection
- [ ] App handles gracefully (no crash)
- [ ] Shows "offline" or "connection error" message
- [ ] Reconnects automatically when internet restored

### Invalid Token/Auth Failure

- [ ] Link account with expired/invalid token
- [ ] App shows clear error message
- [ ] Offers to retry or re-link account
- [ ] No sensitive data logged or displayed

### Missing WebView2

- [ ] Uninstall WebView2 runtime
- [ ] Try to launch app
- [ ] Get helpful error message with download link
- [ ] Can proceed after installing WebView2

## Auto-Update Flow

### Check for Updates

- [ ] Launch app
- [ ] Within 5-10 seconds, update check completes
- [ ] If no update available, no notification shown
- [ ] If update available, notification dialog appears

### Update Installation

- [ ] Update dialog shows new version number
- [ ] Shows changelog or update notes
- [ ] Has "Update" and "Later" buttons
- [ ] Clicking "Update" starts download
- [ ] Progress indicator shows during download

### Post-Update

- [ ] After download completes, app restarts automatically
- [ ] App version in settings shows new version number
- [ ] All settings preserved after update
- [ ] Linked account still active after update

### Decline Update

- [ ] Click "Later" button on update prompt
- [ ] App continues running normally
- [ ] Update prompt doesn't show again immediately (cooldown active)
- [ ] Can manually check for updates (if feature exists)

## Performance & Stability

### Startup Time

- [ ] App launches within 3 seconds (measured from double-click to window visible)
- [ ] No freezing or stuttering during startup
- [ ] All UI elements responsive immediately after load

### Memory Usage

- [ ] App uses reasonable memory when idle (<150 MB)
- [ ] Memory doesn't continuously increase over time
- [ ] No memory leaks after long-running (30 min idle)

### CPU Usage

- [ ] App uses minimal CPU when idle (<5%)
- [ ] No constant background activity
- [ ] Log watching doesn't spike CPU

### Stability

- [ ] App doesn't crash during normal use
- [ ] No unexpected restarts
- [ ] No unhandled exceptions in logs
- [ ] Survives long periods of running (8+ hours)

## UI Polish & Consistency

### Visual Design

- [ ] UI is clean and professional-looking
- [ ] Colors consistent throughout app
- [ ] Typography readable at all text sizes
- [ ] Icons clear and recognizable
- [ ] No alignment issues or misaligned elements

### User Experience

- [ ] Button text is clear and actionable
- [ ] All interactive elements have clear hover states
- [ ] Loading states show feedback to user
- [ ] Error messages are helpful (not technical jargon)
- [ ] Success messages confirm actions

### Accessibility

- [ ] All text has sufficient contrast
- [ ] Can navigate using Tab key
- [ ] Screen reader can read main content (if supported)
- [ ] Font size readable without zooming

## Uninstallation

### Uninstall Process

- [ ] Settings → Apps → Apps & Features
- [ ] Find "EFT Tracker Companion" in list
- [ ] Click "Uninstall"
- [ ] Windows uninstall dialog appears
- [ ] Uninstall completes successfully

### Cleanup

- [ ] Shortcuts removed from Start Menu
- [ ] Desktop shortcut removed (if created)
- [ ] System tray icon no longer appears
- [ ] App data removed from `%APPDATA%`
- [ ] Registry entries cleaned up

### Reinstallation

- [ ] Download installer again
- [ ] Install succeeds (no conflicts or errors)
- [ ] First-time experience shows (welcome dialog)
- [ ] No data/settings from previous install remain

## Edge Cases & Stress Testing

### Rapid Clicking

- [ ] Click buttons rapidly
- [ ] App doesn't freeze or show multiple dialogs
- [ ] State remains consistent

### Extreme Paths

- [ ] Set EFT path to very long path
- [ ] Set EFT path with special characters
- [ ] App handles without crashing

### Large Log Files

- [ ] If EFT has very large log files (100+ MB)
- [ ] App handles log parsing without freezing
- [ ] Doesn't consume excessive memory

### Multiple Accounts

- [ ] Link account A
- [ ] Close and reopen app
- [ ] Link different account B
- [ ] Previous account's data replaced (no cross-contamination)

## Sign-Off

### Overall Assessment

- [ ] App works as intended
- [ ] No critical bugs found
- [ ] UX is intuitive and polished
- [ ] Performance meets targets

### Issues Found

**Critical (blocks release):**

- [ ] None found

**High (should fix before release):**

- [ ] [List any issues]

**Medium (nice to fix):**

- [ ] [List any issues]

**Low (document for later):**

- [ ] [List any issues]

### Recommendation

- [ ] ✅ **APPROVED FOR RELEASE** - All tests passed, no blockers
- [ ] ⚠️ **CONDITIONAL APPROVAL** - Minor issues found, document and release anyway
- [ ] ❌ **DO NOT RELEASE** - Critical bugs found, must fix first

### Notes

[Add any additional observations, workarounds, or follow-up items]

---

**Tester Signature:** ********\_******** **Date:** ****\_****
