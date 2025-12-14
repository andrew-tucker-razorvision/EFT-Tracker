# Quest Tracking Tutorial

Master all the features of EFT Quest Tracker to efficiently track your Escape from Tarkov quest progress.

## Basic Quest Actions

### Marking Quests Complete

**Click to Complete:**

1. Find the quest you've finished
2. Click anywhere on the quest card
3. The quest turns gray and dependent quests unlock automatically

**Keyboard Shortcut:**

- Navigate to a quest with arrow keys
- Press `Enter` to toggle completion

**Mobile:**

- Tap the quest card to mark complete
- Long-press for quest details

### Viewing Quest Details

**Desktop:**

- Click the info icon (i) on the quest card
- Press `Space` when a quest is selected
- Hover over the quest for a quick tooltip

**Mobile:**

- Long-press any quest card
- Or tap the info icon

**Quest Details Include:**

- Full quest description
- All objectives with checkboxes
- Prerequisites (what you need before starting)
- Dependent quests (what this unlocks)
- Rewards (XP, trader rep, items)
- Required items and their locations

### Quest Status Types

The tracker uses three status types:

- **Available** (Green border) - Prerequisites met, ready to start
- **In Progress** (Yellow border) - Started but not completed
- **Completed** (Gray) - Finished

**Changing Status:**

- Click a quest multiple times to cycle through states
- Or use the status dropdown in quest details

## Advanced Features

### Focus Mode

Focus mode highlights the entire dependency chain for a quest:

**Activate Focus Mode:**

- **Desktop:** Double-click any quest
- **Keyboard:** Select a quest and press `F`
- **Mobile:** Not yet supported

**What Gets Highlighted:**

- The selected quest (bright)
- All prerequisites (what you need first)
- All dependent quests (what unlocks after)
- Everything else is dimmed

**Exit Focus Mode:**

- Double-click anywhere
- Press `Escape`
- Click the "Exit Focus" button

**Why Use Focus Mode:**

- Plan your quest progression path
- See which quests block the most content
- Understand quest chains visually

### Catch-Up Feature

Already mid-wipe? Use the catch-up feature to quickly set your current progress:

**How to Use:**

1. On first login, click **"Already mid-wipe? Catch up"**
2. Select all quests you've completed this wipe
3. Click **Save Progress**
4. The tracker updates your entire quest tree

**Tips:**

- Use the trader tabs to work through one trader at a time
- Use search to find specific quests quickly
- Don't worry about getting every quest - you can update later

### Smart Filtering

#### Filter by Trader

Show quests from specific traders:

1. Click the **All Traders** dropdown
2. Select Prapor, Therapist, Skier, Peacekeeper, Mechanic, Ragman, Jaeger, or Fence
3. Only quests from that trader appear

**Use Case:** Focus on one trader's reputation at a time.

#### Filter by Map

Plan efficient raids by filtering quests by location:

1. Click the **All Maps** dropdown
2. Select a map (Customs, Woods, Shoreline, etc.)
3. See all quests with objectives on that map

**Pro Tip:** Before a raid, filter by that map to see what quests you can work on.

#### Filter by Quest Type

Filter by quest category:

1. Click the **All Types** dropdown
2. Choose from:
   - Elimination - Kill PMCs or Scavs
   - Exploration - Find locations or items
   - Collection - Gather and turn in items
   - Completion - Multi-objective quests
   - Loyalty - Trader relationship quests

#### Status Filter

Show only quests in a specific state:

1. Click the **Status** button (shows current filter)
2. Select **Available**, **In Progress**, **Completed**, or **All**

**Common Workflows:**

- Filter to **Available** to see what you can do now
- Filter to **In Progress** to focus on unfinished quests
- Filter to **Completed** to review your achievements

#### Combining Filters

You can combine multiple filters:

**Example:** "Show available Customs quests from Prapor"

1. Set Status: **Available**
2. Set Map: **Customs**
3. Set Trader: **Prapor**

Click **Clear All** to reset all filters.

### PMC Level Management

Set your current PMC level to:

- Hide quests above your level
- Focus on quests you can actually accept

**How to Set:**

1. Look for the level indicator in the filter bar
2. Enter your current PMC level
3. Quests above your level are hidden

**Show Hidden Quests:**

- Click **Show All** to temporarily reveal all quests
- Updates the count: "60 quests hidden (above level 6)"

### Kappa Container Tracking

Focus on quests required for the Kappa container:

**Toggle Kappa Mode:**

1. Look for the Kappa icon in the toolbar
2. Click to toggle Kappa-only mode
3. Only Kappa-required quests are shown

**Kappa Indicators:**

- Quest cards show a Kappa badge icon
- Badge appears on all Kappa-required quests

**Pro Tip:** Use this from the start if Kappa is your goal.

### Search Functionality

Quickly find specific quests:

**How to Search:**

1. Click the search box (or press `/`)
2. Type quest name or keyword
3. Results filter in real-time

**Search Tips:**

- Search works across quest names and descriptions
- Partial matches work (e.g., "ther" finds "Therapist")
- Clear search to see all quests again

### Quest Grouping Views

The tracker offers multiple ways to organize quests:

**View Options:**

1. **Traders** - Group by quest giver (default)
2. **Levels** - Group by minimum PMC level
3. **Maps** - Group by location
4. **Raid** - Optimize for current raid (mobile)

**Switching Views:**

- Click the view buttons in the toolbar
- Each view reorganizes the quest tree

**Best View by Use Case:**

- **Traders:** General progression tracking
- **Levels:** See what unlocks at each level
- **Maps:** Plan raids by location
- **Raid:** Quick reference during raids (mobile)

### Progress Statistics

Track your overall progress:

**Stats Shown:**

- **Completed** - Quests marked as done
- **In Progress** - Quests started but not finished
- **Available** - Quests ready to start
- **Overall Percentage** - Total completion

**Where to Find:**

- Top navigation bar shows counts and percentage
- Progress bar fills as you complete quests

### "Next Up" Recommendations

The tracker suggests which quests to do next:

**How It Works:**

- Prioritizes quests that unlock the most content
- Shows Kappa-required quests first
- Considers your current filters and level

**Using Recommendations:**

1. Look for the "Next Up" section
2. See recommended quests with unlock counts
3. Click to view details or mark complete

### Sync Indicator

Your progress syncs automatically to the server:

**Sync Status:**

- **Syncing...** - Saving in progress
- **Synced 10s ago** - Last successful sync time
- **Sync failed** - Connection issue

**Troubleshooting Sync:**

- Check your internet connection
- Refresh the page to force a sync
- See [Troubleshooting](troubleshooting.md) for help

## Keyboard Shortcuts

Master keyboard shortcuts for faster tracking:

| Key          | Action                     |
| ------------ | -------------------------- |
| `/`          | Focus search box           |
| `Arrow Keys` | Navigate quests            |
| `Enter`      | Toggle quest completion    |
| `Space`      | Open quest details         |
| `F`          | Toggle focus mode          |
| `Escape`     | Close dialogs / Exit focus |
| `?`          | Show help dialog           |

## Best Practices

### Starting a New Wipe

1. **Use "Start Fresh"** on the welcome dialog
2. **Set your PMC level** to 1
3. **Mark early quests** as you complete them
4. **Update level regularly** to reveal new quests

### Mid-Wipe Catch-Up

1. **Use "Already mid-wipe? Catch up"** feature
2. **Work trader-by-trader** to ensure accuracy
3. **Don't stress perfection** - update as you go
4. **Check dependent unlocks** after bulk updates

### Raid Planning

1. **Filter by your target map** before raid
2. **Note quest objectives** for that location
3. **Use focus mode** to see quest chains
4. **Update progress** immediately after raid

### Kappa Grinding

1. **Toggle Kappa mode** to focus
2. **Prioritize "Next Up" quests** that are Kappa-required
3. **Use trader filter** to complete one trader fully
4. **Track progress percentage** to see completion

### Team Coordination

1. **Share quest details** with squadmates
2. **Plan raids** around multiple people's quests
3. **Use map filter** to find shared objectives
4. **Update progress** together after raids

## Common Workflows

### "What can I do right now?"

1. Set your current PMC level
2. Filter to **Available** status
3. Look at "Next Up" recommendations
4. Pick a quest and go!

### "What unlocks after this quest?"

1. Find the quest in the tracker
2. Open quest details (Space or click info)
3. Look at the "Unlocks" section
4. Or use focus mode to visualize the chain

### "What do I need for Customs raids?"

1. Filter by **Maps** → **Customs**
2. Filter by **Status** → **Available**
3. See all available Customs quests
4. Plan your raid route

### "Am I ready for Kappa?"

1. Toggle **Kappa mode** on
2. Check your completion percentage
3. See remaining Kappa-required quests
4. Prioritize the "Next Up" list

## Tips & Tricks

1. **Use keyboard shortcuts** - Much faster than clicking
2. **Update immediately after raids** - Don't forget what you did
3. **Check "Next Up" daily** - Efficient progression planning
4. **Focus mode is your friend** - Visualize quest chains
5. **Filter before raids** - Know your objectives
6. **Set realistic level** - Don't overwhelm yourself with high-level quests
7. **Sync indicator is useful** - Wait for sync before closing browser

## Next Steps

- [Companion App Setup](companion-app.md) - Install the desktop overlay (optional)
- [Troubleshooting](troubleshooting.md) - Fix common issues
- [FAQ](faq.md) - Common questions answered

---

**Happy quest tracking!** Remember, the goal is to make your Tarkov progression easier, not harder. Use the features that help you and ignore the rest.
