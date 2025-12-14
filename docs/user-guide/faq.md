# Frequently Asked Questions (FAQ)

Common questions about EFT Quest Tracker answered.

## Table of Contents

- [General Questions](#general-questions)
- [Account & Privacy](#account--privacy)
- [Features & Functionality](#features--functionality)
- [Game Integration](#game-integration)
- [Technical Questions](#technical-questions)
- [Contributing & Support](#contributing--support)

---

## General Questions

### What is EFT Quest Tracker?

EFT Quest Tracker is a free web-based tool that helps you track your quest progress in Escape from Tarkov. It provides visual quest dependency trees, progress tracking, and helpful filters to optimize your quest progression toward Kappa or any other goal.

### Is it free?

Yes, completely free. No subscriptions, no ads, no monetization. Open-source and community-driven.

### Do I need an account?

- **No account required** to browse quests and view dependencies
- **Account required** to save progress across sessions and devices

Guest mode lets you explore everything before signing up.

### Does it work on mobile?

Yes! The tracker is fully responsive and works on phones and tablets. Mobile features include:

- Touch-optimized interface
- Long-press for quest details
- Portrait mode for compact view
- "Raid" view for quick reference
- Add to home screen for app-like experience

### Is this affiliated with Battlestate Games?

No, this is an independent community project. Quest data is sourced from the Tarkov community (tarkov.dev API). Not affiliated with or endorsed by Battlestate Games.

---

## Account & Privacy

### What data do you collect?

We collect minimal data:

- **Account info:** Email (if using email/password), OAuth ID (if using Google/Discord)
- **Quest progress:** Which quests you've marked complete
- **Session data:** For keeping you logged in
- **Analytics:** Anonymous usage stats (page views, feature usage)

**We do NOT collect:**

- In-game username or account details
- Game files or memory
- Personal information beyond email
- Financial information

### Is my data safe?

Yes. We implement industry-standard security:

- Passwords hashed with bcrypt
- HTTPS encryption for all traffic
- OAuth authentication supported (no password stored)
- Regular security audits
- Database hosted on secure infrastructure (Neon PostgreSQL)

See our [Security Documentation](../SECURITY.md) for details.

### Can I delete my account?

Yes. Go to Settings → Account → Delete Account. This action is permanent and cannot be undone. All your quest progress will be permanently deleted.

### Do you sell user data?

Absolutely not. We will never sell, rent, or share your data with third parties for marketing purposes. Your data is yours.

### Can I export my progress?

Export feature is planned but not yet implemented. You can manually review your progress in the tracker. Feature request: [Issue #XXX](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)

---

## Features & Functionality

### How does quest tracking work?

1. You mark quests as complete in the tracker
2. Progress syncs to our server automatically
3. Dependent quests unlock automatically when prerequisites are met
4. Your progress persists across sessions and devices

The tracker doesn't connect to the game - you manually update it as you complete quests.

### Can I use this without the companion app?

Yes! The web tracker is fully functional on its own. The companion app (when released) is just a convenience feature for in-game overlay. Most users use the web tracker with a second monitor or mobile device.

### How accurate is the quest data?

Quest data is sourced from tarkov.dev, which is maintained by the community and regularly updated. If you notice outdated or incorrect information:

- Report it on [GitHub Issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)
- Or report to tarkov.dev directly

### What does "Next Up" mean?

"Next Up" shows recommended quests to do next based on:

- Quests that unlock the most dependent quests
- Kappa-required quests (if Kappa mode enabled)
- Your current filters and PMC level

It helps you prioritize efficiently.

### How does the Kappa filter work?

When Kappa mode is enabled:

- Only quests required for the Kappa container are shown
- Other quests are hidden unless they're prerequisites
- Kappa badge appears on all required quests
- Progress % shows Kappa completion specifically

Toggle it on to focus your progression toward Kappa.

### Can I track hideout upgrades?

Not yet. The tracker currently focuses on quests only. Hideout tracking is a planned feature. Vote for it: [Issue #XXX](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)

### Can I share my progress with friends?

Profile sharing is planned but not yet implemented. You can manually show your progress by screenshotting or streaming. Feature request: [Issue #XXX](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)

### How do I reset my progress for a new wipe?

1. Go to Settings → Account
2. Click "Reset All Progress"
3. Confirm the reset

**Note:** This is permanent. Your progress will be completely cleared.

### What's the "Catch-Up" feature?

If you're mid-wipe, the catch-up feature lets you quickly set your current progress:

1. Select all quests you've already completed
2. Click Save Progress
3. The tracker updates your entire quest tree

Saves time compared to marking quests one-by-one.

---

## Game Integration

### Is this against Escape from Tarkov's Terms of Service?

No. EFT Quest Tracker is an **external tool** that does not:

- Modify game files
- Inject into game memory
- Provide unfair advantages
- Automate gameplay
- Read game data

It's equivalent to taking notes on paper or using a spreadsheet - completely allowed.

### Does it read my game data?

No. The tracker has zero integration with the game. You manually update your progress. The tracker doesn't know what you're doing in-game.

### Will it get me banned?

No. It's an external website/app that doesn't interact with the game at all. Battlestate Games allows external tools and calculators. Many popular streamers use similar tools.

### Can it auto-sync with the game?

No, and this is intentional. Auto-syncing would require reading game memory, which:

- Could violate TOS
- Could trigger anti-cheat
- Raises security concerns

Manual tracking is the safest approach.

### How do I use it while playing?

**Recommended setups:**

1. **Dual monitor:** Open tracker on second monitor, update between raids
2. **Mobile device:** Use phone/tablet as second screen with auto-sync
3. **Single monitor:** Play in borderless windowed, Alt-Tab to update
4. **Companion app:** (When released) In-game overlay for quick reference

See [Companion App Guide](companion-app.md) for details.

---

## Technical Questions

### Which browsers are supported?

**Fully supported:**

- Google Chrome (latest)
- Microsoft Edge (latest)
- Mozilla Firefox (latest)

**Partially supported:**

- Safari (minor visual issues possible)
- Brave (disable shields)
- Opera (untested but should work)

**Not supported:**

- Internet Explorer (any version)

See [Troubleshooting - Browser Compatibility](troubleshooting.md#browser-compatibility) for details.

### Why is the tracker slow?

Common causes:

- Slow internet connection
- Too many browser tabs open
- Browser extensions interfering
- Outdated browser version
- Ad blocker causing issues

See [Troubleshooting - Performance Issues](troubleshooting.md#performance-issues) for solutions.

### Does it work offline?

No, internet connection is required to:

- Load quest data
- Sync progress
- Authenticate your account

Offline mode is a potential future feature.

### Can I self-host it?

Yes! The project is open-source. To self-host:

1. Clone the GitHub repository
2. Set up PostgreSQL database
3. Configure environment variables
4. Deploy with Docker or traditional hosting

See [Developer Documentation](../README.md) for setup instructions.

### Is there an API?

Not yet. Public API is planned for future releases to allow:

- Third-party integrations
- Custom tools and overlays
- Mobile app development

### Why does it need CAPTCHA?

CAPTCHA (Cloudflare Turnstile) prevents:

- Bot spam accounts
- Automated abuse
- Credential stuffing attacks
- API scraping

Most legitimate users won't see it - it's invisible for trusted traffic.

---

## Contributing & Support

### Can I contribute to the project?

Yes! Contributions welcome:

- **Code:** Submit pull requests on GitHub
- **Bug reports:** Open issues with details
- **Feature requests:** Discuss on GitHub Discussions
- **Documentation:** Improve guides and tutorials
- **Testing:** Report bugs and edge cases

See [Contributing Guide](../CONTRIBUTING.md) for details.

### How do I report a bug?

1. Check if it's already reported: [Open Issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)
2. If not, create a new issue
3. Include:
   - Browser and version
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshot if relevant
   - Console errors (F12 → Console)

### How do I request a feature?

1. Check if it's already requested: [GitHub Issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)
2. If not, create a feature request issue
3. Describe:
   - What you want
   - Why it's useful
   - How you imagine it working
   - Any examples from other tools

### Is there a roadmap?

Yes! See the project milestones and issues on GitHub:

- [Project Roadmap](https://github.com/andrew-tucker-razorvision/EFT-Tracker/milestones)
- [Epic Issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues?q=label%3Aepic)

### How can I support the project?

The best ways to support:

- **Star the GitHub repo** - Shows appreciation and helps visibility
- **Share with friends** - Tell other Tarkov players about it
- **Report bugs** - Help us improve quality
- **Contribute code** - Submit pull requests
- **Provide feedback** - Let us know what's working and what's not

No donations accepted - this is a passion project.

### Who maintains this?

The project is maintained by [andrew-tucker-razorvision](https://github.com/andrew-tucker-razorvision) with contributions from the community. It's a side project built for the Tarkov community.

---

## Gameplay Questions

### Which quests should I do first?

General priority order:

1. **Mechanic's early quests** - Unlock Flea Market (level 15)
2. **Jaeger unlock** - Complete "Introduction" from Mechanic
3. **Kappa-required quests** - If going for Kappa
4. **Quests that unlock multiple others** - Check "Unlocks X quests" badge
5. **Map-based grinding** - Do all quests on one map per session

Use the "Next Up" recommendations for guidance.

### How do I unlock Kappa?

Complete all Kappa-required quests (marked with Kappa badge in tracker):

1. Toggle Kappa mode in the tracker
2. Focus on completing those quests
3. Track your Kappa-specific progress %
4. Some quests have Kappa as a prerequisite

Kappa is a long grind - the tracker helps you stay organized.

### What's the fastest way to level up?

Quest XP is the fastest leveling method:

1. Prioritize quests with high XP rewards
2. Complete multiple objectives in one raid
3. Use the map filter to plan efficient raids
4. Focus on early trader quests for quick completions

The tracker helps you identify efficient progression paths.

### Which traders should I level first?

Suggested priority:

1. **Prapor & Therapist** - Essential items and healing
2. **Peacekeeper** - Good armor and weapons
3. **Mechanic** - Flea Market unlock
4. **Ragman** - Armor and rigs
5. **Jaeger** - Requires unlock quest first
6. **Skier** - Later priority

Use trader filter to focus on one at a time.

---

## More Questions?

If your question isn't answered here:

1. Check other guides:
   - [Getting Started](getting-started.md)
   - [Quest Tracking Tutorial](quest-tracking.md)
   - [Troubleshooting](troubleshooting.md)
   - [Companion App](companion-app.md)

2. Search GitHub Issues:
   - [All Issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)
   - Someone may have already asked

3. Create a new issue:
   - [Ask a question](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues/new)
   - Maintainers and community will respond

---

**Happy questing!** Good luck on your journey to Kappa (or whatever your goal is).
