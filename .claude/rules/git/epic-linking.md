# Epic and Sub-Issue Linking in PRs

## The Problem

When working with epics (parent issues with multiple sub-issues), PRs must link to the **specific sub-issue**, not the epic itself. Otherwise, GitHub's auto-close doesn't work.

## Correct Pattern

```markdown
## Related Issues

Closes #404         ← Links to the specific sub-issue (auto-closes on merge)
Part of #400        ← References the epic (does NOT auto-close)
```

## Why This Matters

- **Auto-close works:** When PR merges, the sub-issue (#404) closes automatically
- **Epic visibility:** The epic stays open until ALL sub-issues are closed
- **Progress tracking:** Clear visibility into which phases are complete
- **Issue hygiene:** No manual cleanup needed

## Common Mistake

❌ **Wrong:**
```markdown
Closes #400  ← Links to epic directly
```

This doesn't close the epic (epics need all sub-issues closed first), and the sub-issue stays open forever.

✅ **Correct:**
```markdown
Closes #404  ← Links to Phase 4 sub-issue
Part of #400  ← References epic for context
```

## When Creating PRs for Epics

1. **Find the specific sub-issue** - e.g., "Phase 4: Testing & Validation" (#404)
2. **Use `Closes #404`** - This auto-closes the sub-issue
3. **Use `Part of #400`** - This references the epic without closing it
4. **One sub-issue per PR** - Don't try to close multiple phases in one PR

## Closing the Epic

Once all sub-issues (#401-405) are closed, manually close the epic (#400) with a summary comment:

```bash
gh issue close 400 --comment "Epic complete. All phases implemented and deployed."
```

## PR Template

The PR template has been updated with comments to guide this pattern. Follow the guidance in the "Related Issues" section.
