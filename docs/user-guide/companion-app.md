# Companion App Setup Guide

The EFT Quest Tracker Companion App provides an in-game overlay to check your quest progress without alt-tabbing.

## Status: In Development

The Windows companion app is currently in active development using Tauri framework. A detailed [implementation plan](../COMPANION_APP_IMPLEMENTATION.md) has been created with an estimated 8-10 hours of development work remaining.

**Architecture:** Thin client that connects to learntotarkov.com API
**Estimated Release:** TBD based on development progress
**Platform:** Windows (initial release), Linux/macOS (future)

## What the Companion App Will Offer

Once released, the companion app will provide:

- **In-Game Overlay** - View quest progress while playing
- **Minimal Resource Usage** - Lightweight system footprint
- **Auto-Sync** - Real-time sync with web tracker
- **Hotkey Support** - Show/hide overlay with a keypress
- **Raid Planning** - Quick reference for current map quests
- **Auto-Updates** - Automatic updates via GitHub Releases

## Alternative: Use Web Tracker

While waiting for the companion app, use the web tracker:

### Second Monitor Setup

**Recommended for dual-monitor users:**

1. Open [https://learntotarkov.com/quests](https://learntotarkov.com/quests)
2. Drag browser window to second monitor
3. Set browser to full-screen (F11)
4. Use keyboard shortcuts for quick updates:
   - `/` - Search quests
   - Arrow keys - Navigate
   - `Enter` - Mark complete

### Mobile/Tablet Setup

**Use your phone or tablet as a second screen:**

1. Open [https://learntotarkov.com/quests](https://learntotarkov.com/quests) on mobile
2. Log in with the same account
3. Progress syncs automatically between devices
4. Mobile-optimized interface with touch controls
5. Use "Raid" view for quick reference

**Mobile Tips:**

- Add to home screen for app-like experience
- Enable auto-lock prevention in browser settings
- Tap to complete, long-press for details
- Portrait mode shows compact quest cards

### Single Monitor Workaround

**If you only have one monitor:**

1. Play in **Borderless Windowed** mode (not fullscreen)
2. Alt-Tab to browser between raids
3. Update your progress after each raid
4. Use search (`/`) to quickly find quests

**Quick Update Workflow:**

1. Alt-Tab to browser
2. Press `/` to search
3. Type quest name
4. Press `Enter` to mark complete
5. Alt-Tab back to game (under 10 seconds)

## Future Companion App Features

### Planned for Initial Release

- Windows desktop application
- System tray integration
- Configurable hotkeys
- Low-latency overlay rendering
- Auto-login with saved credentials
- Quest search and filtering
- Map-based quest display

### Potential Future Enhancements

- Linux support
- macOS support
- Voice commands for hands-free tracking
- Raid timer and extract countdown
- Loot tracking integration
- Team quest coordination

## Will the Companion App Violate TOS?

**No.** The companion app is an **external overlay** that:

- Does NOT modify game files
- Does NOT inject into game memory
- Does NOT automate gameplay
- Does NOT provide unfair advantages
- Does NOT read game memory

It's equivalent to having a second monitor or using your phone - just more convenient.

**Similar to:** StreamerBot, OBS overlays, Discord overlay

## Technical Requirements (When Released)

### Minimum System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 100 MB additional
- **Storage:** 50 MB
- **Internet:** Required for sync
- **Graphics:** DirectX 11 compatible GPU

### Recommended Setup

- **Dual monitors** - One for game, one for tracker
- **Or single monitor** with game in borderless windowed mode
- **Or mobile device** as second screen

## Stay Updated

Want to know when the companion app releases?

1. **Star the GitHub repository** - Get notified of releases
   - [github.com/andrew-tucker-razorvision/EFT-Tracker](https://github.com/andrew-tucker-razorvision/EFT-Tracker)

2. **Check the website** - Announcement will be on homepage
   - [https://learntotarkov.com](https://learntotarkov.com)

3. **Follow development** - Track progress on GitHub
   - [Issue #209: Companion App Distribution](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues/209)

## Frequently Asked Questions

### When will the companion app be released?

Development is ongoing. No specific release date yet. Follow the GitHub repo for updates.

### Will it work with other games?

The companion app is specifically designed for Escape from Tarkov quest tracking. It won't work with other games.

### Will there be a Linux/Mac version?

Windows is the priority for initial release. Linux and macOS support may come later based on demand.

### How much will it cost?

The companion app will be **completely free**, just like the web tracker.

### Will it require an account?

Yes, you'll need an EFT Quest Tracker account to sync your progress between the web and companion app.

### Can I use the web tracker without the companion app?

Absolutely! The web tracker is fully functional on its own. The companion app is just a convenience feature.

### Will it cause performance issues in-game?

The app is designed to be lightweight with minimal resource usage. It should not impact game performance.

## Need Help?

- [Getting Started Guide](getting-started.md) - Set up web tracker
- [Quest Tracking Tutorial](quest-tracking.md) - Master the features
- [Troubleshooting](troubleshooting.md) - Fix common issues
- [FAQ](faq.md) - General questions

---

**Until the companion app releases**, use the web tracker with a second monitor or mobile device for the best experience!
