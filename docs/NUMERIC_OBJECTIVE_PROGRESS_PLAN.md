# Numeric Objective Progress Tracking - Implementation Plan

## Executive Summary

Add numeric progress tracking for quest objectives (e.g., "1/2 PMC kills" instead of binary checkbox). This builds on the existing objective tracking system merged in PRs #406-#410.

**User Requirement:** Track granular progress like "Eliminate 2 PMC operatives" as "0/2 → 1/2 → 2/2" instead of just a checkbox.

**Current State:** Binary completion tracking (completed: true/false) is live in production.

**Proposed Solution:** Hybrid UI with checkboxes for binary objectives and counters with +/- buttons for numeric objectives.

## Current Implementation Analysis

### What Exists (Live in Production)

✅ **Database:**
- `ObjectiveProgress` model with `completed: Boolean`
- `Objective` model with `count: Int?` field (EXISTS but UNUSED)
- `Objective.type` field stores objective type from API

✅ **API:**
- `PATCH /api/progress/objective/[objectiveId]` accepts `{ completed: boolean }`
- Auto-completion logic when all objectives complete
- Quest status computation in `lib/quest-status.ts`

✅ **UI:**
- QuestDetailModal shows objective checkboxes
- Progress summary "Objectives (2/5)"
- Progress bars on QuestNode and LevelQuestCard
- Map filtering based on objective completion

### What's Missing

❌ **Database:**
- No `current` field in ObjectiveProgress (tracks 1, 2, 3... progress)
- `Objective.count` not populated from tarkov.dev API

❌ **API:**
- Endpoint doesn't accept numeric progress updates
- No logic to compute completion from `current >= target`

❌ **UI:**
- No counter UI with +/- buttons
- No display of "X/Y" per objective (only at quest level)

## Design Decision: Hybrid Approach

### Why Hybrid?

**Two types of objectives exist:**
1. **Binary:** "Mark location", "Find item" (checkbox ✓)
2. **Countable:** "Eliminate 2 PMC operatives", "Find 5 Flash Drives" (counter with +/-)

**Recommendation:** Use checkboxes for binary, counters for countable (matches user mental model).

### UI Pattern

**Binary objective:**
```
[✓] Mark the vehicle on Customs
```

**Countable objective:**
```
[ ] Eliminate PMC operatives    [−] 1/2 [+]
```

**Accessibility:**
- +/- buttons: 44x44px touch targets (mobile-friendly)
- `role="spinbutton"` on counter input
- Keyboard support: Arrow keys increment/decrement
- Screen reader announcements: "PMC kills: 1 of 2"

## Database Schema Changes

### 1. Update ObjectiveProgress Model

```prisma
model ObjectiveProgress {
  id          String     @id @default(cuid())
  userId      String
  objectiveId String
  completed   Boolean    @default(false)
  current     Int?       @default(0)      // NEW: Current progress (e.g., 1)
  target      Int?                        // NEW: Target count (copy of Objective.count)
  syncSource  SyncSource @default(WEB)
  updatedAt   DateTime   @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  objective Objective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)

  @@unique([userId, objectiveId])
  @@index([userId, completed])
}
```

**Why `target` denormalized?**
- Faster queries (no join to Objective table)
- Allows historical tracking if quest requirements change
- Matches existing pattern (`completed` computed but stored)

### 2. Populate Objective.count from API

`Objective.count` field already exists but is not populated. Update `update-quests.ts` to fetch count from tarkov.dev API.

**API Query Enhancement:**
```graphql
objectives {
  id
  type
  description
  optional
  maps { id name normalizedName }
  ... on TaskObjectiveItem {
    count  # ← ADD THIS
  }
}
```

### 3. Migration Script

**File:** `apps/web/prisma/migrate-numeric-progress.ts`

**Steps:**
1. Add `current` and `target` to ObjectiveProgress schema
2. For existing ObjectiveProgress records:
   - If `completed === true` → set `current = Objective.count` (or 1 if null), `target = Objective.count`
   - If `completed === false` → set `current = 0`, `target = Objective.count`
3. For objectives without count (binary):
   - Leave `current` and `target` as null
   - Keep checkbox behavior

**Safety:**
- Dry run mode to preview changes
- Backup ObjectiveProgress table before migration
- Rollback script to revert if issues

## API Changes

### 1. Update Request Schema

**File:** `apps/web/src/app/api/progress/objective/[objectiveId]/route.ts`

**Current:**
```typescript
const updateObjectiveSchema = z.object({
  completed: z.boolean(),
});
```

**New:**
```typescript
const updateObjectiveSchema = z.object({
  completed: z.boolean().optional(),
  current: z.number().int().min(0).optional(),
});
```

**Validation logic:**
- If `current` provided: Auto-set `completed = current >= target`
- If `completed` provided: Set `current = completed ? target : 0`
- If both provided: Use `current`, ignore `completed`

### 2. Update Response Schema

**Add `current` and `target` to response:**
```typescript
{
  objectiveProgress: {
    id: string,
    completed: boolean,
    current: number | null,
    target: number | null,
    updatedAt: Date
  },
  quest: {
    id: string,
    computedStatus: "locked" | "available" | "in_progress" | "completed",
    unlockedQuests: string[]
  }
}
```

### 3. Auto-Completion Logic

**File:** `apps/web/src/lib/quest-status.ts`

**Current:**
```typescript
return targetObjectives.every((o) => o.progress?.[0]?.completed === true);
```

**New:**
```typescript
return targetObjectives.every((o) => {
  const progress = o.progress?.[0];
  if (!progress) return false;

  // For numeric objectives, check current >= target
  if (progress.current !== null && progress.target !== null) {
    return progress.current >= progress.target;
  }

  // For binary objectives, check completed flag
  return progress.completed === true;
});
```

## UI Changes

### 1. QuestDetailModal - Hybrid Rendering

**File:** `apps/web/src/components/quest-detail/QuestDetailModal.tsx`

**Logic:**
```typescript
const renderObjective = (obj: ObjectiveWithProgress) => {
  const progress = obj.progress?.[0];
  const isBinary = obj.count === null || obj.count === undefined;

  if (isBinary) {
    // Render checkbox (existing behavior)
    return <ObjectiveCheckbox ... />;
  } else {
    // Render counter with +/- buttons
    return <ObjectiveCounter
      current={progress?.current ?? 0}
      target={obj.count}
      onIncrement={() => handleCountChange(obj.id, (progress?.current ?? 0) + 1)}
      onDecrement={() => handleCountChange(obj.id, Math.max(0, (progress?.current ?? 0) - 1))}
      onComplete={() => handleCountChange(obj.id, obj.count)}
    />;
  }
};
```

**New handler:**
```typescript
const handleCountChange = async (objectiveId: string, newCount: number) => {
  setLoadingStates(prev => ({ ...prev, [objectiveId]: true }));

  try {
    await fetch(`/api/progress/objective/${objectiveId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: newCount })
    });

    onRefresh?.(); // Refetch quest data
  } catch (error) {
    toast.error("Failed to update progress");
  } finally {
    setLoadingStates(prev => ({ ...prev, [objectiveId]: false }));
  }
};
```

### 2. ObjectiveCounter Component

**New file:** `apps/web/src/components/quest-detail/ObjectiveCounter.tsx`

**Props:**
```typescript
interface ObjectiveCounterProps {
  current: number;
  target: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onComplete: () => void;
  disabled?: boolean;
}
```

**Render:**
```tsx
<div className="flex items-center gap-2">
  <button
    onClick={onDecrement}
    disabled={disabled || current === 0}
    className="w-11 h-11 flex items-center justify-center border-2 rounded transition-colors"
    aria-label="Decrement progress"
  >
    <Minus className="w-5 h-5" />
  </button>

  <div
    className="text-sm font-medium min-w-[48px] text-center"
    role="spinbutton"
    aria-valuenow={current}
    aria-valuemin={0}
    aria-valuemax={target}
    aria-label={`Progress: ${current} of ${target}`}
  >
    {current}/{target}
  </div>

  <button
    onClick={onIncrement}
    disabled={disabled || current >= target}
    className="w-11 h-11 flex items-center justify-center border-2 rounded transition-colors"
    aria-label="Increment progress"
  >
    <Plus className="w-5 h-5" />
  </button>

  {current < target && (
    <button
      onClick={onComplete}
      className="ml-2 text-xs px-2 py-1 rounded hover:bg-accent-gold/20"
      aria-label="Mark as complete"
    >
      Complete
    </button>
  )}
</div>
```

**Styling:**
- Green border/text when `current === target` (completed)
- Gray border when incomplete
- Disabled state with opacity-50
- Hover effects on buttons

### 3. Progress Display Updates

**QuestNode.tsx:**
- Keep existing progress bar (shows completed objectives / total)
- Bar automatically updates when numeric objectives reach target

**LevelQuestCard.tsx:**
- Same as QuestNode - no changes needed

**MapGroupsView.tsx:**
- No changes - filtering logic already uses `completed` flag

## Type System Updates

### 1. Update Quest Types

**File:** `packages/types/src/quest.ts`

```typescript
export interface ObjectiveProgress {
  id: string;
  userId: string;
  objectiveId: string;
  completed: boolean;
  current: number | null;    // NEW
  target: number | null;     // NEW
  syncSource: "WEB" | "COMPANION";
  updatedAt: Date;
}

export interface Objective {
  id: string;
  description: string;
  map: string | null;
  maps: string[];
  optional: boolean;
  type: string | null;
  count: number | null;      // Ensure this is properly typed
  questId: string;
}
```

## Testing Strategy

### Unit Tests

**File:** `__tests__/unit/objective-counter.test.ts`

- Increment/decrement within bounds
- Disable buttons at min/max
- Complete button sets to target
- ARIA attributes correct
- Keyboard navigation works

**File:** `__tests__/unit/quest-status.test.ts` (update existing)

- Auto-completion with numeric objectives
- Mixed binary and numeric objectives
- Edge cases: target=0, target=1, large targets

### Integration Tests

**File:** `__tests__/integration/api/progress-objective.test.ts` (update existing)

- PATCH with `current` field
- Auto-complete when `current >= target`
- Validation: negative numbers rejected
- Validation: exceeding target allowed
- Binary objectives still work with checkbox behavior

### E2E Tests

**File:** `__tests__/e2e/numeric-objectives.spec.ts`

**Scenario 1: Increment PMC Kills**
1. Navigate to quest "The Huntsman Path - Controller"
2. Click "+" on "Eliminate PMC operatives" (0/2 → 1/2)
3. Click "+" again (1/2 → 2/2)
4. Verify objective marked complete
5. Verify quest progress bar updates

**Scenario 2: Decrement Progress**
1. Objective at 2/2 (complete)
2. Click "−" (2/2 → 1/2)
3. Verify objective uncompleted
4. Verify quest status changes from COMPLETED → IN_PROGRESS

**Scenario 3: Complete Button**
1. Objective at 0/2
2. Click "Complete" button
3. Verify jumps to 2/2 and marks complete

**Scenario 4: Mixed Objectives**
1. Quest with 1 binary + 1 numeric objective
2. Check binary objective (checkbox)
3. Increment numeric to target
4. Verify quest auto-completes

## Performance Considerations

### Query Optimization

**Current query joins ObjectiveProgress:**
```typescript
const quests = await prisma.quest.findMany({
  include: {
    objectives: {
      include: {
        progress: { where: { userId } }
      }
    }
  }
});
```

**Impact of adding `current` and `target`:**
- Negligible - fields are on same row, no additional joins
- `target` denormalized to avoid join to Objective table

**Index requirements:**
- Existing index `@@index([userId, completed])` sufficient
- No new indexes needed

### Write Performance

**Before:** User completes objective → 1 DB write (update `completed`)

**After:** User increments counter → 1 DB write (update `current`, auto-compute `completed`)

**No performance regression** - same number of writes, slightly larger rows.

### Companion App Sync

**Goal:** Log file parser detects PMC kill → auto-increment objective

**API call:**
```typescript
PATCH /api/progress/objective/[objectiveId]
{ current: currentCount + 1 }
```

**Optimizations:**
- Batch updates (multiple kills in one log parse)
- Rate limiting on companion endpoints (already exists)
- Optimistic UI updates on web client

## Migration & Rollout Plan

### Phase 1: Schema Migration (Non-Breaking)

1. Add `current` and `target` to ObjectiveProgress (nullable)
2. Run migration on staging database
3. Verify no errors, no data loss
4. Deploy to production (zero downtime - new fields unused)

### Phase 2: Data Backfill

1. Run backfill script: `npx tsx prisma/migrate-numeric-progress.ts`
2. For completed objectives: set `current = target`
3. For incomplete objectives: set `current = 0`
4. Verify production user progress preserved
5. Monitor error rates

### Phase 3: API Enhancement

1. Update API to accept `current` field
2. Update status computation logic
3. Deploy API changes (backward compatible - `completed` still works)
4. Integration tests pass

### Phase 4: UI Rollout

1. Deploy ObjectiveCounter component
2. Deploy hybrid rendering logic in QuestDetailModal
3. A/B test with small user group (10%)
4. Monitor user engagement and error rates
5. Roll out to 100% if successful

### Phase 5: Companion App Integration

1. Update companion app to send `current` field
2. Test log parsing → API update flow
3. Deploy companion app update
4. Monitor sync reliability

## Rollback Plan

**If issues occur:**

1. **UI Rollback:** Revert to checkbox-only rendering (keep numeric data)
2. **API Rollback:** Remove `current` field from request schema
3. **Database Rollback:**
   - Keep `current` and `target` columns (data preserved)
   - Or drop columns if data integrity issues

**Rollback criteria:**
- Error rate increase >5%
- User complaints about progress loss
- Performance degradation >50ms
- Companion app sync failures >10%

## Success Metrics

### Week 1 Post-Launch

- [ ] Zero data loss for existing progress
- [ ] Numeric objectives render correctly (100%)
- [ ] Binary objectives unchanged (regression test)
- [ ] API response time <100ms (95th percentile)
- [ ] Error rate <1%

### Month 1 Post-Launch

- [ ] 75%+ users interact with numeric counters
- [ ] Companion app successfully syncs progress
- [ ] No rollback required
- [ ] User feedback positive (surveys, Discord)

## Design Decisions (Finalized)

### 1. **Objective Type Detection** ✅

**Decision:** Use `Objective.count` field to determine binary vs. countable

**Logic:**
- If `count === null` or `count === 0` → Show checkbox (binary)
- If `count > 0` → Show counter with +/- buttons (countable)

**Rationale:** The `count` field is the single source of truth from the API. This approach is self-documenting from the data structure, requires no complex type-to-UI mapping, and is simple to maintain. If API data quality issues emerge, we can add manual overrides as a hotfix.

### 2. **Maximum Value Handling** ✅

**Decision:** Clamp at target (max 2/2)

**Logic:**
- Disable + button when `current === target`
- Server-side validation: `current = Math.min(newCount, target)`

**Rationale:** Matches actual game behavior (you can't "over-complete" objectives). Prevents user confusion from seeing "3/2" state. Provides clear visual feedback via disabled button. If companion app reports excess kills, server clamps automatically.

### 3. **Uncomplete Behavior** ✅

**Decision:** Reset count to 0 when user un-completes

**Logic:**
- User clicks to uncomplete → `current` resets to 0
- Matches checkbox toggle semantics (checked → unchecked is full state change)
- Alternative: Remove uncomplete button entirely, just let user decrement from 2/2 → 1/2 (auto-uncompletes)

**Rationale:** Preserves consistency with binary checkbox behavior. No paradox state ("2/2 but not complete"). If user accidentally marks complete, they reset to 0 and re-increment.

### 4. **Count Extraction Strategy** ✅

**Decision:** Hybrid approach (API + Regex + Manual overrides)

**Implementation:**
1. **Primary:** Update `update-quests.ts` to fetch count from API via GraphQL fragments
   ```graphql
   ... on TaskObjectiveItem {
     count
   }
   ```
2. **Fallback:** Regex parse description: `/(?:kill|eliminate|find|collect)\s+(\d+)/i`
3. **Safety net:** Manual lookup table for edge cases

**Rationale:** API provides structured, validated data (most reliable). Regex handles legacy quests or API gaps (broad coverage). Manual overrides catch edge cases (multilingual, complex descriptions). This layered approach maximizes reliability and coverage.

## Critical Files

### Schema & Migration
- `prisma/schema.prisma` - Add `current` and `target` to ObjectiveProgress
- `apps/web/prisma/migrate-numeric-progress.ts` - NEW backfill script
- `apps/web/prisma/update-quests.ts` - Update to fetch count from API

### API
- `apps/web/src/app/api/progress/objective/[objectiveId]/route.ts` - Accept `current` field
- `apps/web/src/lib/quest-status.ts` - Update auto-completion logic

### UI
- `apps/web/src/components/quest-detail/QuestDetailModal.tsx` - Hybrid rendering
- `apps/web/src/components/quest-detail/ObjectiveCounter.tsx` - NEW counter component
- `apps/web/src/components/quest-tree/QuestNode.tsx` - No changes needed

### Types
- `packages/types/src/quest.ts` - Add `current` and `target` to ObjectiveProgress

### Tests
- `__tests__/unit/objective-counter.test.ts` - NEW component tests
- `__tests__/unit/quest-status.test.ts` - Update for numeric logic
- `__tests__/integration/api/progress-objective.test.ts` - Update for `current` field
- `__tests__/e2e/numeric-objectives.spec.ts` - NEW E2E tests

## Timeline Estimate

**Phase 1 (Schema):** 2-4 hours
- Schema changes
- Migration script
- Backfill testing

**Phase 2 (API):** 3-5 hours
- Request/response schema updates
- Status computation logic
- Integration tests

**Phase 3 (UI):** 6-8 hours
- ObjectiveCounter component
- Hybrid rendering logic
- Styling and accessibility
- Component tests

**Phase 4 (E2E):** 2-3 hours
- E2E test scenarios
- Visual regression testing

**Phase 5 (Deployment):** 1-2 hours
- Staging deployment
- Production deployment
- Monitoring

**Total:** 14-22 hours of development + testing + deployment

## Future Enhancements

### Phase 2: Companion App Auto-Update
- Parse log files for quest events
- Real-time progress updates
- Toast notifications

### Phase 3: Advanced Progress Types
- Percentage-based (75% extraction rate)
- Time-based (survive 10 minutes)
- Multi-step (plant marker AND extract)

### Phase 4: Analytics
- Track which objectives users struggle with
- Average time to complete objectives
- Suggest optimal quest routing
