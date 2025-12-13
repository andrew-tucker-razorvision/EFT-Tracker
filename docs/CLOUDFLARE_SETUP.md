# Cloudflare CDN and Security Setup

This guide covers configuring Cloudflare's free tier for CDN, DDoS protection, SSL/TLS management, and performance optimization for EFT-Tracker.

## Table of Contents

- [Overview](#overview)
- [Initial Setup](#initial-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Caching Configuration](#caching-configuration)
- [Security Features](#security-features)
- [Performance Optimization](#performance-optimization)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)

## Overview

### Benefits

- **Global CDN**: 275+ locations worldwide
- **Free SSL/TLS**: Automatic certificate management
- **DDoS Protection**: Automatic mitigation
- **Performance**: Caching, compression, HTTP/2, HTTP/3
- **Security**: WAF rules, bot protection
- **Cost**: $0/month (free tier)

### What Cloudflare Does

```
User Request → Cloudflare Edge → Your Server (Hetzner)
           ↑
     (Caching, Security, Performance)
```

## Initial Setup

### Step 1: Create Cloudflare Account

1. Visit [cloudflare.com](https://cloudflare.com)
2. Sign up for free account
3. Verify email address

### Step 2: Add Domain

1. Click "Add a Site"
2. Enter domain: `learntotarkov.com`
3. Select "Free" plan
4. Click "Continue"

### Step 3: DNS Migration

Cloudflare will scan your existing DNS records.

1. **Review Records**: Verify all DNS records are detected

   ```
   Type    Name               Content              Proxy Status
   A       learntotarkov.com  <your-vps-ip>       Proxied ✓
   A       www                <your-vps-ip>       Proxied ✓
   CNAME   staging            staging-domain       DNS only
   ```

2. **Enable Proxy**:
   - Production (A record): ✓ Proxied (orange cloud)
   - WWW (A record): ✓ Proxied (orange cloud)
   - Staging (CNAME): DNS only (gray cloud) - for internal testing

### Step 4: Update Nameservers

1. Copy Cloudflare nameservers:

   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

2. Update at your domain registrar (e.g., Namecheap, GoDaddy):
   - Remove old nameservers
   - Add Cloudflare nameservers
   - Save changes

3. **Wait for propagation** (typically 2-24 hours)

### Step 5: Verify Activation

1. Cloudflare will email when active
2. Check status: Dashboard → learntotarkov.com → Status: "Active"
3. Verify DNS propagation:
   ```bash
   dig learntotarkov.com NS
   # Should show cloudflare.com nameservers
   ```

## SSL/TLS Configuration

Configure SSL/TLS for secure HTTPS connections.

### SSL/TLS Mode

1. Navigate to: SSL/TLS → Overview
2. Select: **Full (strict)**
   - Cloudflare ↔ Origin: Encrypted and verified
   - Requires valid certificate on origin server (Coolify provides this)

**Why Full (strict)?**

- Encrypts entire connection (browser → Cloudflare → server)
- Prevents man-in-the-middle attacks
- Validates origin certificate

### Edge Certificates

1. Navigate to: SSL/TLS → Edge Certificates
2. Configure:
   - **Always Use HTTPS**: ON
     - Automatically redirects HTTP → HTTPS

   - **HTTP Strict Transport Security (HSTS)**: Enable

     ```
     Max Age: 12 months
     Include subdomains: ON
     Preload: OFF (enable after testing)
     ```

   - **Minimum TLS Version**: TLS 1.2
     - Balances security and compatibility

   - **Opportunistic Encryption**: ON
     - Enables HTTP/2 Server Push

   - **TLS 1.3**: ON
     - Faster, more secure protocol

   - **Automatic HTTPS Rewrites**: ON
     - Rewrites insecure links to HTTPS

### Certificate Validity

Universal SSL certificate is automatically managed by Cloudflare:

- Covers: `learntotarkov.com` and `*.learntotarkov.com`
- Renewal: Automatic every 90 days
- No configuration needed

## Caching Configuration

Optimize caching for static assets while ensuring dynamic content stays fresh.

### Caching Rules

Navigate to: Rules → Page Rules (free tier) or Cache Rules (paid tiers)

#### Rule 1: Next.js Static Assets

```
URL Pattern: *learntotarkov.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
```

**Why**: Next.js static assets have content hashes, safe to cache forever.

#### Rule 2: API Routes

```
URL Pattern: *learntotarkov.com/api/*
Settings:
  - Cache Level: Bypass
```

**Why**: API responses are dynamic and personalized.

#### Rule 3: Public Images

```
URL Pattern: *learntotarkov.com/images/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 day
  - Browser Cache TTL: 1 day
```

**Why**: Quest icons, trader images cache well but may update occasionally.

### Browser Cache TTL

Navigate to: Caching → Configuration

- **Browser Cache TTL**: 4 hours
  - Default for resources without explicit cache headers
  - Balances freshness and performance

### Tiered Caching

Navigate to: Caching → Tiered Cache

- **Enable**: ON (free tier)
  - Uses multiple Cloudflare data centers for caching
  - Reduces origin load

## Security Features

### DDoS Protection

**Automatic on free tier** - no configuration needed.

- Protection against Layer 3/4 attacks
- Rate limiting built-in
- Automatic challenge pages for suspicious traffic

### Firewall Rules

Navigate to: Security → WAF

#### Managed Rules (Free Tier)

- **Cloudflare Managed Ruleset**: ON
  - Protects against OWASP Top 10
  - Automatic updates

#### Custom Rules

Create rules for additional protection:

**Rule: Block Known Bad Bots**

```
Field: User Agent
Operator: contains
Value: "curl" OR "wget" OR "python-requests"
Action: Challenge (CAPTCHA)
```

**Rule: Rate Limit API**

```
Field: URI Path
Operator: starts with
Value: /api/
Rate: 100 requests per 10 seconds
Action: Block
```

### Bot Fight Mode

Navigate to: Security → Bots

- **Bot Fight Mode**: ON (free tier)
  - Challenges automated bots
  - Allows good bots (Google, Bing)
  - Uses JavaScript and CAPTCHA challenges

### Security Level

Navigate to: Security → Settings

- **Security Level**: Medium
  - Challenges visitors with threat score >14
  - Balances security and user experience

### Additional Security

- **Email Obfuscation**: ON
  - Hides email addresses from scrapers

- **Server Side Excludes**: ON
  - Removes sensitive comments from HTML

- **Hotlink Protection**: OFF
  - Not needed for this use case

## Performance Optimization

### Auto Minify

Navigate to: Speed → Optimization → Content Optimization

- **Auto Minify**:
  - JavaScript: ON
  - CSS: ON
  - HTML: ON

**Why**: Reduces file size by removing whitespace and comments.

### Brotli Compression

Navigate to: Speed → Optimization → Content Optimization

- **Brotli**: ON

**Why**: Better compression than gzip (15-20% smaller).

### Rocket Loader

Navigate to: Speed → Optimization → Content Optimization

- **Rocket Loader**: OFF for Next.js
  - Can interfere with Next.js hydration
  - Next.js already optimizes JavaScript loading

### HTTP/2 and HTTP/3

Navigate to: Network

- **HTTP/2**: ON (automatic)
  - Multiplexing, header compression
  - Enabled by default

- **HTTP/3 (QUIC)**: ON
  - Faster connection establishment
  - Better mobile performance

### 0-RTT Connection Resumption

Navigate to: Network

- **0-RTT**: ON
  - Faster subsequent connections
  - Reduces latency by ~100ms

### Early Hints

Navigate to: Speed → Optimization → Protocol Optimization

- **Early Hints**: ON
  - Browser starts loading resources sooner
  - Improves perceived performance

### WebSockets

Navigate to: Network

- **WebSockets**: ON
  - Required if using WebSockets in future
  - No performance impact

## Testing and Verification

### Verify HTTPS

1. Visit https://learntotarkov.com
2. Check browser address bar for lock icon
3. Click lock → Certificate → Should show Cloudflare certificate

### Verify Caching

Check cache headers:

```bash
# Static asset should be cached
curl -I https://learntotarkov.com/_next/static/chunks/main.js
# Look for: cf-cache-status: HIT

# API should not be cached
curl -I https://learntotarkov.com/api/health
# Look for: cf-cache-status: DYNAMIC
```

### Verify Security Headers

```bash
curl -I https://learntotarkov.com | grep -E "strict-transport|x-frame"
# Should see HSTS and other security headers
```

### Performance Testing

**PageSpeed Insights:**

1. Visit [pagespeed.web.dev](https://pagespeed.web.dev)
2. Enter: https://learntotarkov.com
3. Target scores:
   - Performance: 90+
   - Best Practices: 100
   - SEO: 90+

**WebPageTest:**

1. Visit [webpagetest.org](https://webpagetest.org)
2. Enter URL and select location near your users
3. Check:
   - First Byte Time: <500ms
   - Start Render: <1.5s
   - Fully Loaded: <3s

### Security Testing

**Security Headers:**

1. Visit [securityheaders.com](https://securityheaders.com)
2. Enter: https://learntotarkov.com
3. Target: A rating

**SSL Labs:**

1. Visit [ssllabs.com/ssltest](https://ssllabs.com/ssltest)
2. Enter: learntotarkov.com
3. Target: A+ rating

## Troubleshooting

### Issue: DNS Not Propagating

**Symptoms**: Old nameservers still showing after 24 hours

**Resolution**:

1. Verify nameservers updated at registrar
2. Force flush DNS cache:

   ```bash
   # Windows
   ipconfig /flushdns

   # Mac
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```

3. Check with multiple DNS checkers:
   - [whatsmydns.net](https://whatsmydns.net)

### Issue: SSL Certificate Errors

**Symptoms**: "NET::ERR_CERT_AUTHORITY_INVALID"

**Resolution**:

1. Check SSL/TLS mode is "Full (strict)"
2. Verify origin server (Coolify) has valid certificate
3. Check Cloudflare SSL status: SSL/TLS → Edge Certificates
4. Wait 5-10 minutes for certificate issuance

### Issue: Site Not Caching

**Symptoms**: cf-cache-status always shows MISS

**Resolution**:

1. Check cache rules are active
2. Verify proxy status (orange cloud) is enabled
3. Check response headers don't have `Cache-Control: no-cache`
4. Purge cache: Caching → Configuration → Purge Everything

### Issue: Site Slower Through Cloudflare

**Symptoms**: Site loads slower with Cloudflare enabled

**Resolution**:

1. Check Cloudflare data center location (should be geographically close)
2. Disable Rocket Loader if enabled
3. Check origin server response time (should be <500ms)
4. Review caching rules - may need more aggressive caching

### Issue: API Requests Blocked

**Symptoms**: API returns 403 or challenge page

**Resolution**:

1. Check firewall rules aren't too aggressive
2. Whitelist your IP: Security → WAF → Tools → IP Access Rules
3. Lower security level temporarily: Security → Settings → Security Level → Low
4. Check Bot Fight Mode isn't blocking legitimate requests

### Issue: Real Visitor IP Lost

**Symptoms**: Server logs show Cloudflare IPs, not visitor IPs

**Resolution**:
Visitor IP is in `CF-Connecting-IP` header.

In Next.js, get real IP:

```typescript
// In API route or middleware
const realIp =
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("X-Forwarded-For")?.split(",")[0] ||
  "unknown";
```

## Best Practices

### Do's ✅

- ✅ Use "Full (strict)" SSL mode
- ✅ Enable HSTS after testing
- ✅ Cache static assets aggressively
- ✅ Monitor cache hit rate (aim for >80%)
- ✅ Use Page Rules efficiently (free tier limit: 3 rules)
- ✅ Test thoroughly before enabling HSTS preload
- ✅ Keep Cloudflare dashboard bookmarked

### Don'ts ❌

- ❌ Use "Flexible" SSL mode (insecure)
- ❌ Cache dynamic content (/api/\*)
- ❌ Enable Rocket Loader with Next.js
- ❌ Set browser cache TTL too high for HTML
- ❌ Ignore cache purge when deploying
- ❌ Enable development mode in production

## Cloudflare Analytics

Navigate to: Analytics & Logs

Monitor:

- **Requests**: Total requests served
- **Bandwidth**: Data transferred
- **Cache Ratio**: % of requests served from cache (target: >80%)
- **SSL**: % of requests over HTTPS (target: 100%)
- **Threats**: Blocked requests

## Cost Optimization

**Free Tier Limits:**

- Page Rules: 3
- Firewall Rules: 5
- Rate Limiting Rules: 1

**Upgrade Triggers:**

- Need more Page Rules → Pro ($20/month)
- Need advanced WAF → Pro ($20/month)
- Need image optimization → Pro + Image Optimization ($10/month)

**Current Setup Cost:** $0/month (free tier sufficient)

## Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Security Hardening](./security/SECURITY.md)
- [Performance Monitoring](./MONITORING.md)

## External Resources

- [Cloudflare Documentation](https://developers.cloudflare.com)
- [Cloudflare Community](https://community.cloudflare.com)
- [Cloudflare Status](https://www.cloudflarestatus.com)

## Revision History

| Date       | Version | Changes             |
| ---------- | ------- | ------------------- |
| 2025-01-13 | 1.0     | Initial setup guide |
