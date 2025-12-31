# Model Selection (Quality-First Approach)

**Goal:** Prioritize code quality and correctness. Use Sonnet by default; only use Haiku for truly straightforward tasks.

**Rationale:** Haiku was causing frequent bugs. Sonnet's improved reasoning catches edge cases and produces more reliable code. Cost is secondary to shipping quality.

## Quick Decision Framework

Before starting any task:

```
□ Is it simple/mechanical (file ops, git, clear-scope fixes)? → HAIKU
□ Otherwise → Default to SONNET
```

## Use Sonnet (Target: 80%+ of tasks) — DEFAULT

- Bug fixes (all types, even with clear messages)
- Complex or ambiguous features
- Security-critical code (auth, rate limiting, validation)
- Database schema changes
- Features >300 LOC
- Architectural decisions
- E2E test debugging
- Performance optimization
- Multi-file changes
- Code requiring careful reasoning
- Test writing (unit, integration)

## Use Haiku (Target: 20%- of tasks) — EXCEPTIONS ONLY

**Only use Haiku for:**

- File operations (search, read, edit single files)
- Git operations (commit, branch, push)
- Running specific tests/validation commands
- Simple documentation updates
- Mechanical refactoring (rename, extract, move)

## Quality Gates

Before shipping any Haiku work:

- ✅ All tests pass (unit, integration)
- ✅ Lint/format checks clean
- ✅ Type checking passes
- ✅ No console errors in dev

**Detailed guidelines:** See `.claude/HAIKU_GUIDE.md`

**Tracking log:** See `.claude/HAIKU_LOG.md`
