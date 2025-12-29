# Objective-Level Quest Tracking - Implementation Plan

## Overview

Add granular objective-level progress tracking to quests, enabling users to:
- Track individual objectives (e.g., "Kill 5 PMCs on Customs" separate from "Kill 5 PMCs on Woods")
- See which map-specific objectives are complete/incomplete
- Have quest nodes appear only on maps with incomplete objectives
- Support future numeric progress tracking (e.g., "15/25 PMC kills") when companion app integration is ready

## Key Design Decisions

### 1. Status Model: Computed IN_PROGRESS
- **Store only:** LOCKED, AVAILABLE, COMPLETED in database (maintains PR #341 simplification)
- **Compute:** `IN_PROGRESS` status when any objectives have progress but quest not complete
- **Rationale:** Keeps schema simple, status always reflects objective reality

### 2. Multi-Map Objective Storage
- Store ALL maps per objective as PostgreSQL array: `maps: String[]`
- tarkov.dev API already provides this data (`objectives[].maps[]`)
- Enables accurate filtering: "Show quest if ANY objective on selected map is incomplete"

### 3. Map Node Visibility
- Quest node appears on a map ONLY if that map has incomplete objectives
- Once all Customs objectives done → quest disappears from Customs map
- Quest may appear on multiple maps simultaneously (e.g., Shooter Born in Heaven on 5 maps)

### 4. Quest Completion Logic
- Optional objectives: Don't block quest completion
- Quest auto-completes when all required objectives are marked complete
- "Complete Quest" button marks all objectives complete (shortcut preserved)

### 5. Migration Strategy
- Backfill: For existing completed quests, create ObjectiveProgress records with `completed: true`
- Production user `tuckerandrew21@gmail.com` progress must be preserved
- Graceful degradation: If no objective progress exists, fall back to quest-level status

## Database Schema Changes

### New Model: ObjectiveProgress

```prisma
model ObjectiveProgress {
  id          String    @id @default(cuid())
  userId      String
  objectiveId String
  completed   Boolean   @default(false)
  current     Int       @default(0)        // For future: "15/25 PMC kills"
  target      Int?                         // For future: Target count
  syncSource  SyncSource @default(WEB)
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  objective   Objective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)

  @@unique([userId, objectiveId])
  @@index([userId, completed])
}
```

### Updated Model: Objective

```prisma
model Objective {
  id          String              @id @default(cuid())
  description String
  maps        String[]            // NEW: Array of map names (was single `map` field)
  optional    Boolean             @default(false)  // NEW: Track optional objectives
  type        String?             // NEW: "mark", "kill", "collect", etc.
  count       Int?                // NEW: Target count for numeric objectives
  questId     String
  quest       Quest               @relation(fields: [questId], references: [id], onDelete: Cascade)
  progress    ObjectiveProgress[] // NEW: User progress records

  @@index([questId])
}
```

### Migration Steps

1. **Schema migration:**
   - Add `ObjectiveProgress` table with indexes
   - Add `maps`, `optional`, `type`, `count` to `Objective`
   - Migrate existing `Objective.map` → `Objective.maps` (array)
   - Drop old `map` column after verification

2. **Data backfill:**
   ```typescript
   // For each user with COMPLETED quests:
   //   For each objective in completed quest:
   //     Create ObjectiveProgress { completed: true, current: count ?? 1 }
   ```

3. **Update `update-quests.ts` script:**
   - Store ALL maps from API: `maps: obj.maps.map(m => m.name)`
   - Store `type`, `optional`, `count` fields

## API Changes

### New Endpoint: Update Objective Progress

```
PATCH /api/progress/objective/[objectiveId]
```

**Request:**
```json
{
  "completed": true,
  "current": 15  // Optional: for numeric objectives
}
```

**Response:**
```json
{
  "objectiveProgress": { "id": "...", "completed": true },
  "quest": {
    "id": "...",
    "computedStatus": "completed",
    "unlockedQuests": ["quest-id-1", "quest-id-2"]
  }
}
```

**Logic:**
1. Upsert ObjectiveProgress record
2. Check if all required objectives complete → auto-update QuestProgress to COMPLETED
3. If quest completed → run existing auto-unlock dependency logic
4. Return updated state + unlocked quests for toast notification

### Enhanced Endpoint: Get Quests with Objective Progress

```
GET /api/quests
```

**Changes:**
- Include `objectives.progress` in Prisma query
- Compute `computedStatus` for each quest (based on objective completion)
- Add `objectiveProgress` summary: `{ completed: 2, total: 5 }`

**Response additions:**
```typescript
{
  id: string,
  // ... existing fields
  computedStatus: "locked" | "available" | "in_progress" | "completed",
  objectiveProgress: {
    completed: number,
    total: number
  },
  objectives: Array<{
    id: string,
    description: string,
    maps: string[],
    optional: boolean,
    progress: {
      completed: boolean,
      current: number,
      target: number | null
    } | null
  }>
}
```

### Updated Endpoint: Complete Whole Quest

```
PATCH /api/progress/[questId]
```

**Enhancement:** When marking quest COMPLETED, also mark all objectives complete:
```typescript
// Mark all required objectives complete
for (const obj of quest.objectives.filter(o => !o.optional)) {
  await prisma.objectiveProgress.upsert({
    where: { userId_objectiveId: { userId, objectiveId: obj.id } },
    create: { userId, objectiveId: obj.id, completed: true },
    update: { completed: true }
  });
}
```

## UI Changes

### 1. QuestDetailModal - Interactive Objectives

**Current:** Read-only objective list grouped by map

**New:** Interactive checkboxes for each objective

**Implementation:**
- 44px × 44px touch-friendly checkbox buttons (accessibility minimum)
- Green checkmark + strikethrough for completed objectives
- Progress counter in header: "Objectives (2/5)"
- Optional objectives labeled with badge
- Disabled state when quest is LOCKED

**File:** `apps/web/src/components/quest-detail/QuestDetailModal.tsx`

### 2. QuestNode - Progress Indicator

**New:** 1px progress bar at bottom of quest card

**Visual:**
- Gray background (#424242)
- Blue-to-green gradient foreground
- Width: % of completed objectives
- Only shows if quest has objective progress (not locked, not complete)

**File:** `apps/web/src/components/quest-tree/QuestNode.tsx`

### 3. MapGroupsView - Objective-Based Filtering

**Current:** Groups by `quest.location` (single map per quest)

**New:** Show quest on ALL maps with incomplete objectives

**Algorithm:**
```typescript
for (const quest of quests) {
  const mapsWithIncompleteObjectives = new Set<string>();

  for (const obj of quest.objectives) {
    if (obj.progress?.completed) continue;  // Skip completed
    if (obj.optional) continue;             // Skip optional

    for (const map of obj.maps) {
      mapsWithIncompleteObjectives.add(map);
    }
  }

  // Add quest to each map column with incomplete objectives
  for (const map of mapsWithIncompleteObjectives) {
    groups.get(map)?.push(quest);
  }
}
```

**File:** `apps/web/src/components/quest-views/MapGroupsView.tsx`

## Status Computation Logic

```typescript
function computeQuestStatus(
  storedStatus: QuestStatus,
  objectives: Array<{ completed: boolean, optional: boolean }>
): QuestStatus {
  if (storedStatus === "LOCKED") return "LOCKED";

  const requiredObjectives = objectives.filter(obj => !obj.optional);
  const completedRequired = requiredObjectives.filter(obj => obj.completed);

  // All required objectives complete
  if (completedRequired.length === requiredObjectives.length) {
    return "COMPLETED";
  }

  // Some objectives complete
  if (completedRequired.length > 0) {
    return "IN_PROGRESS";
  }

  // No objectives complete
  return storedStatus === "COMPLETED" ? "AVAILABLE" : storedStatus;
}
```

**Integration points:**
- `GET /api/quests`: Compute for all quests
- Quest tree/list views: Use `computedStatus` instead of `progress.status`
- Filters: "In Progress" filter now works based on objective progress

## Testing Strategy

### Unit Tests
- `computeQuestStatus()` with various objective combinations
- Map filtering logic with partial objective completion
- Auto-completion trigger when last required objective marked done

### Integration Tests
- `PATCH /api/progress/objective/[id]` endpoint
- Quest status recomputation after objective update
- Auto-unlock logic when quest auto-completes via objectives
- Backfill migration script (verify progress preserved)

### E2E Tests (Playwright)
- Complete individual objectives in quest detail modal
- Verify quest status updates to "in_progress" → "completed"
- Check map filtering updates as objectives complete
- Test "Complete Quest" shortcut still works
- Verify unlocked quest notifications appear

## Performance Considerations

### Query Optimization
```typescript
// GOOD: Single query with includes (avoid N+1)
const quests = await prisma.quest.findMany({
  include: {
    objectives: {
      include: {
        progress: { where: { userId } }
      }
    },
    progress: { where: { userId } },
  }
});
```

### Indexes Required
```sql
-- ObjectiveProgress lookups
CREATE INDEX "ObjectiveProgress_userId_completed_idx" ON "ObjectiveProgress"("userId", "completed");

-- Objective maps array (GIN index for PostgreSQL array contains)
CREATE INDEX "Objective_maps_idx" ON "Objective" USING GIN ("maps");
```

### Caching Strategy
- Client-side: React Query with 30s stale time for quest lists
- Server-side: Consider Redis cache for computed quest status (if performance issues arise)

## Implementation Phases

### Phase 1: Schema & Migration
1. Create Prisma migration for ObjectiveProgress table
2. Update Objective model (add maps[], optional, type, count)
3. Migrate existing `map` → `maps` data
4. Write backfill script for production user progress
5. Update `update-quests.ts` to store all maps from API

### Phase 2: API Implementation
1. Create `PATCH /api/progress/objective/[id]` endpoint
2. Enhance `GET /api/quests` to include objective progress
3. Update `PATCH /api/progress/[questId]` to cascade to objectives
4. Add status computation utility function
5. Write API integration tests

### Phase 3: UI Implementation
1. Update TypeScript types in `packages/types/src/quest.ts`
2. Add objective checkboxes to QuestDetailModal
3. Add progress indicator to QuestNode
4. Update MapGroupsView filtering logic
5. Add optimistic UI updates for objective toggles

### Phase 4: Testing & Validation
1. Write unit tests for status computation
2. Write integration tests for API endpoints
3. Add E2E tests for user flows
4. Manual testing on staging database
5. Verify production user migration (dry run first)

### Phase 5: Deployment & Monitoring
1. Deploy schema migration to staging
2. Run backfill script on staging
3. Deploy code to staging, verify functionality
4. Deploy to production with migration
5. Monitor error rates and query performance

## Critical Files

### Schema & Types
- `prisma/schema.prisma` - Add ObjectiveProgress, update Objective
- `packages/types/src/quest.ts` - Add ObjectiveProgress types
- `apps/web/prisma/update-quests.ts` - Store all maps from API

### API Routes
- `apps/web/src/app/api/progress/objective/[objectiveId]/route.ts` - NEW endpoint
- `apps/web/src/app/api/progress/[questId]/route.ts` - Update to cascade to objectives
- `apps/web/src/app/api/quests/route.ts` - Include objective progress, compute status

### UI Components
- `apps/web/src/components/quest-detail/QuestDetailModal.tsx` - Add objective checkboxes
- `apps/web/src/components/quest-tree/QuestNode.tsx` - Add progress indicator
- `apps/web/src/components/quest-views/MapGroupsView.tsx` - Update filtering logic
- `apps/web/src/components/level/LevelQuestCard.tsx` - Add progress indicator

### Utilities
- `apps/web/src/lib/quest-status.ts` - NEW: Status computation logic
- `apps/web/prisma/migrate-objective-progress.ts` - NEW: Backfill script

## Future Enhancements

### Phase 2: Numeric Progress Tracking
- UI: Show "15/25 PMC kills" instead of binary checkbox
- Input field for manual updates (until companion app integration)
- Companion app integration to auto-update from log files

### Phase 3: Advanced Filtering
- "Show completed objectives" toggle in maps view
- Filter by "In Progress" quests only
- Group by "Maps with most incomplete objectives"

### Phase 4: Analytics
- Track which objectives users complete first
- Identify problematic objectives (rarely completed)
- Suggest efficient quest routing based on map overlap

## Risk Mitigation

### Data Loss Prevention
- Dry run migration on staging database first
- Backup production database before migration
- Rollback plan: Drop ObjectiveProgress table, restore from backup

### Performance Degradation
- Load test with 500+ quests, 2000+ objectives
- Monitor query times (target: <100ms for quest list)
- If slow: Add materialized views or denormalized fields

### User Confusion
- Add help text explaining objective tracking
- Preserve "Complete Quest" shortcut for quick completion
- Show clear progress indicators (X/Y completed)

## Success Metrics

- [ ] Migration completes without data loss for production user
- [ ] Quest list API query time remains <100ms (95th percentile)
- [ ] Map filtering correctly shows/hides quests based on objectives
- [ ] Auto-completion works when last objective marked done
- [ ] No increase in error rates after deployment
- [ ] All E2E tests pass in CI

## Open Questions

1. **Optional objectives:** Should they count toward quest completion? (Current plan: No, only required objectives)
2. **Progress indicator style:** Progress bar (subtle) or badge with numbers (explicit)? (Current plan: Progress bar)
3. **Numeric objectives:** Binary checkboxes first, or full numeric input? (Current plan: Binary first, numeric Phase 2)
4. **Recently completed quests:** Show in maps view with filter toggle? (Current plan: Add "Show Completed" toggle)
