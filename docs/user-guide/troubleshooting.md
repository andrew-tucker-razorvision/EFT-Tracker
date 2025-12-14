# Troubleshooting Guide

Common issues and solutions for EFT Quest Tracker.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Progress Not Saving](#progress-not-saving)
- [Performance Issues](#performance-issues)
- [Display & UI Issues](#display--ui-issues)
- [Browser Compatibility](#browser-compatibility)
- [Account Management](#account-management)

---

## Authentication Issues

### Can't Sign In

**Symptoms:**

- Login form shows "Invalid credentials"
- OAuth (Google/Discord) login fails
- "User not found" error

**Solutions:**

1. **Check your credentials**
   - Verify email and password are correct
   - Check for typos and capitalization
   - Try copying/pasting password from password manager

2. **Try password reset**
   - Click "Forgot Password" on login page
   - Check email (including spam folder)
   - Follow reset link and create new password

3. **OAuth issues**
   - Ensure you're using the correct Google/Discord account
   - Check if pop-ups are blocked (OAuth requires pop-ups)
   - Try signing in via a different browser
   - Verify your email with the OAuth provider

4. **Clear browser cache**

   ```
   Chrome: Ctrl+Shift+Delete → Clear browsing data
   Firefox: Ctrl+Shift+Delete → Clear history
   Edge: Ctrl+Shift+Delete → Clear browsing data
   ```

5. **Disable browser extensions**
   - Ad blockers can interfere with authentication
   - Try incognito/private mode
   - Whitelist learntotarkov.com if needed

### CAPTCHA Not Appearing

**Symptoms:**

- Registration/login form missing CAPTCHA widget
- Stuck at "Verify you're human"

**Solutions:**

1. **Check JavaScript**
   - Ensure JavaScript is enabled in browser
   - Disable script blockers temporarily

2. **Clear Cloudflare cookies**
   - Go to browser settings
   - Clear cookies for cloudflare.com and learntotarkov.com

3. **Try different network**
   - VPNs can sometimes block CAPTCHA
   - Try disabling VPN or switching locations
   - Use mobile data instead of WiFi

4. **Browser compatibility**
   - Update browser to latest version
   - Try Chrome or Firefox (best supported)

### Session Expired

**Symptoms:**

- Randomly logged out
- "Session expired" message

**Solutions:**

1. **Re-login**
   - Simply log back in
   - Check "Remember me" to stay logged in longer

2. **Cookie settings**
   - Enable cookies for learntotarkov.com
   - Check if browser is set to clear cookies on exit

3. **Browser privacy settings**
   - "Enhanced tracking protection" can clear sessions
   - Add learntotarkov.com to exceptions

---

## Progress Not Saving

### Changes Not Syncing

**Symptoms:**

- Mark quests complete but they reset
- Progress doesn't persist after refresh
- "Sync failed" indicator

**Solutions:**

1. **Check sync indicator**
   - Look for "Synced X seconds ago" at bottom of page
   - If stuck on "Syncing...", wait 10 seconds
   - If "Sync failed", check internet connection

2. **Verify you're logged in**
   - Guest mode doesn't save progress
   - Check if profile icon shows in top-right
   - Log in if you see "Create Account" button

3. **Internet connection**
   - Check if other websites load
   - Try refreshing the page
   - Reconnect to WiFi if needed

4. **Force sync**
   - Refresh the page (F5 or Ctrl+R)
   - Wait for "Synced X seconds ago" message
   - Try marking a different quest to trigger sync

5. **Clear local storage**
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Delete learntotarkov.com entries
   - Refresh page and log in again

### Progress Lost After Update

**Symptoms:**

- All progress reset to zero
- Quests show as incomplete after app update

**Solutions:**

1. **Check if logged in**
   - You may have been logged out during update
   - Log back in to restore cloud-saved progress

2. **Wrong account**
   - Verify you're using the correct login method
   - If you used Google before, use Google again
   - Each OAuth provider creates separate accounts

3. **Contact support**
   - If progress is truly lost, report on GitHub
   - Include: email used, approximate completion %, last login date
   - [Report issue here](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)

---

## Performance Issues

### Slow Loading

**Symptoms:**

- Quest page takes >5 seconds to load
- Scrolling is laggy
- Interactions feel delayed

**Solutions:**

1. **Check internet speed**
   - Run speed test at fast.com
   - Minimum required: 1 Mbps
   - Try on different network if too slow

2. **Reduce active filters**
   - Too many simultaneous filters can slow rendering
   - Clear unnecessary filters
   - Use search instead of multiple filters

3. **Browser performance**
   - Close unnecessary tabs
   - Restart browser
   - Update to latest browser version
   - Try Chrome or Edge for best performance

4. **Disable browser extensions**
   - Extensions can slow down page rendering
   - Try incognito/private mode
   - Re-enable extensions one by one to find culprit

5. **Clear browser cache**
   - Old cached files can cause issues
   - Clear cache and reload page
   - See "Clear browser cache" section above

### High CPU/Memory Usage

**Symptoms:**

- Computer fan runs loud
- Other apps slow down
- High memory in Task Manager

**Solutions:**

1. **Close other tabs**
   - EFT Quest Tracker uses moderate resources
   - Other tabs compound the usage
   - Close unnecessary browser tabs

2. **Disable animations**
   - Some browsers allow disabling CSS animations
   - This can reduce CPU usage
   - Check browser accessibility settings

3. **Update browser**
   - Newer browsers have better performance
   - Update to latest version

4. **Use supported browser**
   - Chrome, Firefox, Edge recommended
   - Safari may have performance issues

---

## Display & UI Issues

### Quest Cards Not Displaying

**Symptoms:**

- Blank page after loading
- "No quests found" with no filters active
- Quest tree shows empty

**Solutions:**

1. **Clear filters**
   - Click "Clear All" in filter bar
   - Reset PMC level to 1 (or your actual level)
   - Toggle "Show All" to reveal hidden quests

2. **Disable ad blocker**
   - Ad blockers can hide content by mistake
   - Whitelist learntotarkov.com
   - Try in incognito mode without extensions

3. **Browser console errors**
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Screenshot errors and report on GitHub

4. **Refresh page**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - This bypasses cache

### Layout Issues / Overlapping Text

**Symptoms:**

- Text overlaps other elements
- Buttons cut off or hidden
- Mobile layout on desktop (or vice versa)

**Solutions:**

1. **Check zoom level**
   - Browser zoom should be 100%
   - Press Ctrl+0 (Windows) or Cmd+0 (Mac) to reset

2. **Resize window**
   - Minimum width: 768px for desktop layout
   - Mobile layout activates below 768px
   - Try full-screen mode (F11)

3. **Clear cache**
   - Old CSS files can cause layout issues
   - Hard refresh: Ctrl+Shift+R

4. **Update browser**
   - Old browsers may not support modern CSS
   - Update to latest version

### Dark Mode Issues

**Symptoms:**

- Wrong colors after theme switch
- Some elements stay in wrong theme
- Text unreadable in current theme

**Solutions:**

1. **Toggle theme**
   - Click theme toggle in navigation
   - Try toggling off and back on
   - Refresh page after changing theme

2. **Browser theme override**
   - Some browsers force dark mode
   - Check browser settings for forced colors
   - Disable "Force Dark Mode" if enabled

3. **Clear cache**
   - Theme CSS may be cached incorrectly
   - Hard refresh page

---

## Browser Compatibility

### Recommended Browsers

**Fully Supported:**

- Google Chrome (latest)
- Microsoft Edge (latest)
- Mozilla Firefox (latest)

**Partially Supported:**

- Safari (may have minor visual issues)
- Brave (disable shields for full functionality)
- Opera (should work but not tested)

**Not Supported:**

- Internet Explorer (any version)
- Old browser versions (update to latest)

### Mobile Browsers

**Fully Supported:**

- Chrome (Android)
- Safari (iOS)
- Firefox (Android/iOS)

**Tips for Mobile:**

- Use portrait mode for compact view
- Long-press for quest details
- Add to home screen for app-like experience
- Enable "Request Desktop Site" if mobile layout has issues

### Safari-Specific Issues

**Known Issues:**

- Slower performance than Chrome/Firefox
- Some animations may not work
- OAuth pop-ups may be blocked

**Solutions:**

- Enable pop-ups for learntotarkov.com
- Update iOS/macOS to latest version
- Try Chrome on Mac for better experience

---

## Account Management

### Can't Reset Password

**Symptoms:**

- No password reset email received
- Reset link expired or invalid

**Solutions:**

1. **Check spam folder**
   - Reset emails sometimes filtered as spam
   - Add noreply@learntotarkov.com to contacts
   - Wait 5-10 minutes for delivery

2. **Try again**
   - Request another reset email
   - Only one reset link is valid at a time

3. **Verify email address**
   - Ensure you're using the correct email
   - Check for typos when requesting reset

4. **OAuth accounts**
   - If you signed up with Google/Discord, use that method
   - OAuth accounts don't have passwords
   - Can't reset OAuth passwords

### Want to Delete Account

**To delete your account:**

1. Log in to your account
2. Go to Settings → Account
3. Click "Delete Account"
4. Confirm deletion

**Note:** Account deletion is permanent and cannot be undone. All progress will be lost.

### Can't Change Email

**Email changes not yet supported.**

**Workaround:**

1. Create new account with desired email
2. Use catch-up feature to migrate progress
3. Delete old account

**Future:** Email change feature is planned.

### Merging Multiple Accounts

**Account merging not supported.**

If you accidentally created multiple accounts:

1. Choose the account you want to keep
2. Manually transfer progress using catch-up feature
3. Delete unwanted accounts

---

## Still Having Issues?

### Report a Bug

If your issue isn't covered here:

1. **Check GitHub Issues** - Your issue may already be reported
   - [View open issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)

2. **Create a new issue**
   - [Report a bug](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues/new)
   - Include:
     - Browser and version
     - Operating system
     - Steps to reproduce
     - Screenshot if possible
     - Any error messages

3. **Provide details**
   - More information = faster resolution
   - Console errors are very helpful (F12 → Console tab)
   - Describe what you expected vs. what happened

### Get Help

- [FAQ](faq.md) - Common questions answered
- [Getting Started Guide](getting-started.md) - Basic setup help
- [Quest Tracking Tutorial](quest-tracking.md) - Feature explanations

---

## Quick Troubleshooting Checklist

If something isn't working, try these steps in order:

1. ☐ Refresh the page (F5)
2. ☐ Check if you're logged in
3. ☐ Clear all filters
4. ☐ Check internet connection
5. ☐ Try incognito/private mode
6. ☐ Clear browser cache
7. ☐ Disable ad blocker
8. ☐ Try different browser
9. ☐ Restart browser
10. ☐ Report issue on GitHub

Most issues are resolved by steps 1-4. If not, continue down the list.
