# Plan and Execute

A comprehensive workflow for tackling features, bugs, or improvements with deep research, planning, implementation, and iteration.

## Arguments

- `$TASK` - Description of the feature, bug, or improvement to work on

## Workflow Overview

This command follows a structured approach:

1. **Research** - Deep dive into the codebase
2. **Plan** - Create a detailed write-up
3. **Review** - Get user approval before implementing
4. **Implement** - Execute the plan
5. **Test** - Verify the implementation
6. **Iterate** - Fix any issues found

---

## Phase 1: Deep Research

Before planning, thoroughly understand the problem space.

### Codebase Exploration

1. **Find related code**
   - Search for files related to the task
   - Identify existing patterns and conventions
   - Map dependencies and data flow

2. **Understand existing architecture**
   - How is similar functionality implemented?
   - What state management patterns are used?
   - What API patterns exist?

3. **Identify touchpoints**
   - Which files will need changes?
   - What components consume/produce the affected data?
   - Are there tests that will need updating?

4. **Check for edge cases**
   - What could go wrong?
   - Are there existing bugs or limitations?
   - What assumptions are being made?

### Research Output

Create a mental model of:

- The current state of the system
- How the task fits into existing architecture
- Potential challenges or blockers

---

## Phase 2: Planning & Write-Up

Create a comprehensive write-up document.

### Write-Up Structure

```markdown
# [Task Title]

## Summary

[1-2 sentence overview of what we're doing and why]

## Current State Analysis

[What exists today, how it works, any limitations]

## Proposed Solution

### Approach

[High-level description of the solution]

### Implementation Details

#### Files to Modify

- `path/to/file.ts` - [what changes]
- `path/to/other.ts` - [what changes]

#### New Files (if any)

- `path/to/new.ts` - [purpose]

#### API Changes (if any)

- [Endpoint/method changes]

#### Database Changes (if any)

- [Schema changes]

### Step-by-Step Plan

1. [First step with specific details]
2. [Second step]
3. [Continue...]

## Edge Cases & Error Handling

- [Edge case 1] - [how handled]
- [Edge case 2] - [how handled]

## Testing Strategy

- [ ] Unit tests for [specific functionality]
- [ ] Integration tests for [specific flows]
- [ ] Manual testing: [specific scenarios]

## Risks & Mitigations

- [Risk 1] - [mitigation]
- [Risk 2] - [mitigation]
```

### Save the Write-Up

Save to: `docs/plans/[date]-[task-slug].md` (create if needed)

---

## Phase 3: Review & Approval

**STOP and present the write-up to the user.**

Ask:

1. Does this approach make sense?
2. Are there any concerns or questions?
3. Should we proceed with implementation?

**Do NOT proceed until user explicitly approves.**

---

## Phase 4: Implementation

Execute the plan systematically.

### Implementation Rules

1. **Follow the plan** - Don't deviate without discussing first
2. **Small commits** - Make logical, atomic changes
3. **Test as you go** - Verify each step before moving on
4. **Track progress** - Use TodoWrite to track completion

### Implementation Process

For each step in the plan:

1. Mark the step as in_progress
2. Implement the change
3. Verify it works (lint, type-check, basic functionality)
4. Mark the step as completed
5. Move to next step

---

## Phase 5: Testing

Verify the implementation meets requirements.

### Test Checklist

1. **Lint & Type Check**

   ```bash
   npm run lint
   npx tsc --noEmit
   ```

2. **Unit Tests**

   ```bash
   npm test
   ```

3. **Manual Testing**
   - Start dev server: `npm run dev`
   - Test the happy path
   - Test edge cases from the write-up
   - Test error scenarios

4. **Visual Verification** (for UI changes)
   - Take screenshots
   - Self-evaluate: Does it look right?
   - Check responsive behavior

### Test Output

Document:

- What was tested
- What passed
- What failed or needs attention

---

## Phase 6: Iteration

Fix any issues discovered during testing.

### For Each Issue Found

1. **Identify** - What exactly is wrong?
2. **Diagnose** - Why did it happen?
3. **Fix** - Make the correction
4. **Verify** - Confirm the fix works
5. **Regression** - Ensure nothing else broke

### Iteration Loop

Repeat testing and iteration until:

- All tests pass
- Manual testing confirms functionality
- Code is clean (no lint errors)
- Implementation matches the write-up

---

## Final Output

When complete, provide a summary:

```markdown
## Implementation Complete

### What Was Done

[Brief summary of changes]

### Files Changed

- [List of modified files with brief description]

### Testing Results

- Lint: ✅
- Type Check: ✅
- Unit Tests: ✅ (X passed)
- Manual Testing: ✅

### Ready for PR

[Branch name and suggested PR title]
```

---

## Start

Begin by researching: **$TASK**

Use the Task tool with subagent_type='Explore' for initial codebase exploration, then proceed through each phase systematically.
