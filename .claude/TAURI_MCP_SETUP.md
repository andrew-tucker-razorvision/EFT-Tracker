# Tauri MCP Setup Guide

## Status

❌ **Installation Failed** - The `tauri-mcp` crate has unresolved dependency issues that prevent compilation on Windows

### Summary of Issues

1. **Memory Constraints** - Initial compilation attempts hit system memory limits during LTO
2. **Dependency Conflicts** - The project has incompatible versions of `windows_core` pulled in by different dependencies (sysinfo vs screenshots)
3. **Unmaintained** - The GitHub project hasn't been updated to fix these issues with newer Rust/Windows crate versions
4. **No Pre-built Binaries** - No Windows binary releases available

## What is Tauri MCP?

The `tauri-mcp` crate implements the Model Context Protocol (MCP) to provide AI assistants with capabilities to test, debug, and interact with Tauri v2 applications.

### Capabilities

- **Process Management**: Launch/stop apps, capture logs, monitor resources
- **Window Control**: Take screenshots, get window properties
- **Input Simulation**: Keyboard, mouse, scrolling commands
- **Debugging**: Execute JavaScript in webviews, access DevTools, invoke IPC commands

## Attempted Solutions

We tried multiple approaches:

1. ✅ **Cargo install with defaults** - Failed (memory + LTO)
2. ✅ **Cargo install without LTO** - Failed (memory, stack overflow)
3. ✅ **Single-job compilation** - Got further but hit Windows API incompatibilities
4. ✅ **GitHub source (latest)** - Same Windows API issues
5. ✅ **No optimizations** - Same dependency conflicts

The core issue is in `src/utils/platform.rs` - the code expects older `windows` crate APIs that don't match the current versions of `windows_core` being pulled in by dependencies.

## Recommendation

Unfortunately, **tauri-mcp is not suitable for immediate use** on Windows due to project maintenance issues. The crate hasn't been updated to work with current Rust/Windows API versions.

### Alternatives for Tauri Testing

1. **Tauri CLI Testing** - Use built-in Tauri testing features:

   ```bash
   cargo tauri dev --debug  # For debugging
   tauri build --debug      # For testing builds
   ```

2. **Playwright Integration** - Your project already has Playwright MCP configured, which can:
   - Control the dev server window
   - Take screenshots
   - Simulate user interactions
   - Run E2E tests

   This is actually more useful than tauri-mcp for most testing scenarios.

3. **Custom Testing Scripts** - Write Rust integration tests in `src-tauri/tests/`

4. **Wait for Updates** - The tauri-mcp project may get fixes in the future
   - Watch: https://github.com/dirvine/tauri-mcp
   - Check releases for Windows binary support

## What We Learned

The `tauri-mcp` project is an interesting concept but has critical issues:

- **Dependency Management** - Multiple versions of `windows_core` create conflicts
- **API Changes** - Windows crate APIs have evolved; old code no longer works
- **Maintenance** - No recent updates to fix compatibility issues
- **Windows Priority** - Linux/Mac get attention; Windows support is secondary

## Workaround: Use Playwright Instead

Since you already have Playwright MCP configured, you can achieve similar testing:

```
# For interactive testing of your Tauri app:
1. Run: npm run dev (starts Next.js)
2. Use Playwright MCP to interact with the window
3. Capture screenshots and test user flows
4. Run E2E tests: npx playwright test
```

Playwright is actually **better than tauri-mcp** for your use case because:

- It's actively maintained
- Works across platforms
- Integrates with your existing E2E test suite
- No additional dependencies to manage

## Resources

- **Crate**: https://lib.rs/crates/tauri-mcp
- **Repository**: https://github.com/dirvine/tauri-mcp
- **Tauri Docs**: https://tauri.app
- **Your Playwright Setup**: [**tests**/e2e/](../../__tests__/e2e/)
