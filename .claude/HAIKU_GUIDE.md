# Haiku 4.5 Usage Guide

This guide helps you decide when to use Haiku 4.5 vs Sonnet 4.5 for cost optimization.

**Goal:** Reduce Claude API costs by 35% while maintaining code quality.

## Quick Decision Framework

Use this checklist before starting any task:

```
□ Is it security/auth/database schema? → SONNET
□ Is it >500 LOC or >3 files? → SONNET
□ Is error message clear OR scope well-defined? → HAIKU
□ Otherwise → Default to HAIKU, escalate if needed
```

## Detailed Guidelines

### Use Haiku (75-80% of tasks)

**Bug Fixes:**

- ✅ Clear error message with stack trace
- ✅ Single file change
- ✅ Known root cause
- ❌ Security-related bugs
- ❌ Database query bugs

**Testing:**

- ✅ Unit test writing
- ✅ Integration test writing
- ✅ Test fixture creation
- ❌ E2E test debugging (use Sonnet)

**Documentation:**

- ✅ README updates
- ✅ Code comments
- ✅ API documentation
- ✅ Inline documentation

**Simple Features (<300 LOC):**

- ✅ UI component updates
- ✅ Form validation
- ✅ Data formatting
- ✅ Helper functions
- ❌ Authentication flows
- ❌ Payment processing

**File Operations:**

- ✅ Search (Grep, Glob)
- ✅ Read files
- ✅ Edit files
- ✅ Single-file refactoring

**Git Operations:**

- ✅ Commit message writing
- ✅ PR description writing
- ✅ Branch operations

### Use Sonnet (20-25% of tasks)

**Security-Critical:**

- Authentication logic
- Authorization checks
- Rate limiting
- Input validation at boundaries
- SQL injection prevention
- XSS prevention
- CSRF protection

**Database:**

- Schema changes
- Migration writing
- Complex queries
- Index optimization
- Data integrity constraints

**Complex Features (>500 LOC):**

- Multi-file features
- New API endpoints with auth
- State management systems
- Complex UI interactions

**Architectural Decisions:**

- Technology selection
- Design patterns
- Performance optimization strategies
- Scalability planning

**Debugging Complex Issues:**

- E2E test failures
- Race conditions
- Memory leaks
- Performance bottlenecks
- Unclear error messages

## Token Efficiency Patterns

### For Haiku Tasks

**1. Be Specific:**

```
❌ "Fix the bug in authentication"
✅ "Fix TypeError in src/lib/auth.ts:42 - cannot read property 'id' of undefined"
```

**2. Provide Context:**

```
❌ "Add validation"
✅ "Add Zod validation to email field in src/components/LoginForm.tsx using existing emailSchema"
```

**3. Scope Tightly:**

```
❌ "Update all tests"
✅ "Update unit tests in __tests__/unit/quest-helpers.test.ts to cover edge case"
```

### When to Escalate from Haiku to Sonnet

**Red Flags:**

- Task takes >3 attempts without progress
- Haiku makes incorrect assumptions about architecture
- Solution requires understanding complex interactions
- Security implications emerge mid-task
- Database changes become necessary

**How to Escalate:**
Document what Haiku attempted, then switch to Sonnet with context.

## Quality Gates

Before marking Haiku work as complete:

### Required Checks

- [ ] All tests pass (`npm test`)
- [ ] Lint checks clean (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] No console errors in dev mode
- [ ] Manual testing completed for UI changes

### Code Quality

- [ ] No TODO/FIXME comments added without issues
- [ ] Error handling appropriate for context
- [ ] No security vulnerabilities introduced
- [ ] Follows existing patterns in codebase

### Performance

- [ ] No unnecessary re-renders (React)
- [ ] No N+1 queries (database)
- [ ] No blocking operations on main thread
- [ ] Build size not significantly increased

## Success Metrics

Track these weekly in HAIKU_LOG.md:

**Cost Metrics:**

- Total API spend
- % of tasks using Haiku vs Sonnet
- Cost per task (Haiku vs Sonnet)

**Quality Metrics:**

- Test pass rate
- Bugs introduced per task
- Escalation rate (Haiku → Sonnet)
- Rework rate (had to redo with Sonnet)

**Velocity Metrics:**

- Tasks completed per day
- Average task completion time
- Time saved vs Sonnet baseline

## Example Task Categorization

### Haiku Examples

1. **Bug Fix:**
   - Task: Fix "Cannot read property 'length' of undefined in QuestTree.tsx:156"
   - Why Haiku: Clear error, single file, known pattern
   - Estimated tokens: 5-10k

2. **Unit Test:**
   - Task: Add unit tests for calculateNodeHeight() function
   - Why Haiku: Well-defined scope, pure function
   - Estimated tokens: 8-12k

3. **Documentation:**
   - Task: Update API.md with new /api/companion/sync endpoint
   - Why Haiku: Straightforward documentation task
   - Estimated tokens: 6-10k

### Sonnet Examples

1. **Auth Feature:**
   - Task: Add OAuth provider support to authentication system
   - Why Sonnet: Security-critical, multi-file, complex
   - Estimated tokens: 40-60k

2. **Schema Change:**
   - Task: Add soft delete support to User model with migration
   - Why Sonnet: Database schema, data integrity concerns
   - Estimated tokens: 30-50k

3. **Performance Issue:**
   - Task: Debug why quest tree rendering is slow (>2s)
   - Why Sonnet: Complex debugging, unclear root cause
   - Estimated tokens: 50-80k

## Tips for Working with Haiku

**Do:**

- Provide clear, specific requirements
- Reference exact file paths and line numbers
- Include relevant code snippets in prompt
- Test thoroughly before marking complete

**Don't:**

- Give vague or open-ended tasks
- Expect Haiku to make architectural decisions
- Skip quality gates to save time
- Use for security-critical code

## Feedback Loop

After each Haiku task, ask:

1. Did Haiku complete it successfully on first try?
2. Did you need to escalate to Sonnet?
3. Did the output meet quality standards?
4. Would you use Haiku for this type of task again?

Update HAIKU_LOG.md with findings to improve decision-making.
