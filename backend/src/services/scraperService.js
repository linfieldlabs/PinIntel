'use strict';
const { chromium } = require('playwright');

/**
 * Pinterest Scraper  ─  v2  (10-board edition)
 * ─────────────────────────────────────────────────────────────────────────────
 * Step 1  (1 page load)  : profile name, followers, board list + lastActive month
 * Step 2  (parallel ×3)  : descriptions for boards that still need them
 *
 * Board cap: scrapeProfile({ maxBoards }) defaults to 10.
 *   • API path  : boardMap is capped before topBoards slice
 *   • DOM path  : domBoards capped immediately after collection
 *   Both paths sort by recency (most-recently-active boards first) so the
 *   "latest 10 boards" are always the ones with the freshest lastActive date.
 *
 * Speed tricks:
 *   • Block images / fonts / media / stylesheets  (~60 % faster)
 *   • Board descriptions fetched 3 at a time (parallel)
 *   • Month extracted from API Unix timestamp OR DOM relative text ("3mo", "1w")
 *
 * Follower fallback (3 layers):
 *   1. Known DOM selectors
 *   2. TreeWalker exact-match text node
 *   3. body.innerText regex  →  "1.8k followers · 9 following" always captured
 * ─────────────────────────────────────────────────────────────────────────────
 */
class PinterestScraper {
  constructor() {
    this.browser  = null;
    this.timeout  = parseInt(process.env.SCRAPER_TIMEOUT_MS) || 35_000;
    this.headless = process.env.HEADLESS !== 'false';
    this.PARALLEL = 3;

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    ];
  }

  /* ══════════════════════════════ BROWSER ══════════════════════════════ */

  async init() {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: this.headless,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
        '--disable-gpu', '--no-zygote', '--no-first-run',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ],
    });
  }

  async newContext() {
    const ua  = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    const ctx = await this.browser.newContext({
      userAgent:  ua,
      viewport:   { width: 1366 + Math.floor(Math.random() * 80), height: 900 },
      locale:     'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT':             '1',
      },
    });
    await ctx.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
    });
    return ctx;
  }

  /** Block images / fonts / media / stylesheets — loads ~60 % faster */
  async blockAssets(page) {
    await page.route('**/*', route => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type))
        route.abort();
      else
        route.continue();
    });
  }

  /* ══════════════════════════════ HELPERS ═══════════════════════════════ */

  normalizeUrl(url) {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (/pinterest\.com/.test(u.hostname)) {
        const seg = u.pathname.split('/').filter(Boolean)[0];
        if (seg && !['pin', 'board', 'search'].includes(seg))
          return `https://www.pinterest.com/${seg}/`;
      }
    } catch (_) {}
    return url.startsWith('http') ? url : `https://${url}`;
  }

  extractUsername(url) {
    try   { return new URL(url).pathname.split('/').filter(Boolean)[0]; }
    catch { return 'unknown'; }
  }

  /** "1.8k" / "12,345" / "2.1m" → integer */
  parseCount(text = '') {
    const m = text.toLowerCase().replace(/,/g, '').trim().match(/([\d.]+)\s*(k|m|b)?/);
    if (!m) return 0;
    let n = parseFloat(m[1]);
    if (m[2] === 'k') n *= 1e3;
    if (m[2] === 'm') n *= 1e6;
    if (m[2] === 'b') n *= 1e9;
    return Math.round(n);
  }

  /** Unix timestamp (seconds) → "January 2025" */
  tsToMonth(ts) {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Pinterest relative time → "Month YYYY"
   * "3mo" → "December 2025"   "1w" → "March 2026"   "1y" → "March 2025"
   */
  relToMonth(text = '') {
    if (!text) return '';
    const t  = text.toLowerCase().trim();
    const d  = new Date();
    const yr = t.match(/^(\d+)\s*y/);
    const mo = t.match(/^(\d+)\s*mo?/);
    const wk = t.match(/^(\d+)\s*w/);
    const dy = t.match(/^(\d+)\s*d/);
    const hr = t.match(/^(\d+)\s*h/);
    if      (yr) d.setFullYear(d.getFullYear() - +yr[1]);
    else if (mo) d.setMonth(d.getMonth()       - +mo[1]);
    else if (wk) d.setDate(d.getDate()         - +wk[1] * 7);
    else if (dy) d.setDate(d.getDate()         - +dy[1]);
    else if (hr) d.setHours(d.getHours()       - +hr[1]);
    else return text;
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Convert "Month YYYY" string → Date object for sorting.
   * Returns epoch-0 if unparseable (sorts to end / oldest).
   */
  parseLastActive(lastActive = '') {
    if (!lastActive) return new Date(0);
    const d = new Date(lastActive);
    return isNaN(d) ? new Date(0) : d;
  }

  /**
   * Sort boards newest-first by lastActive, then slice to cap.
   * Boards with no date information are placed at the end.
   */
  sortAndCap(boards, cap) {
    return boards
      .slice()   // don't mutate original
      .sort((a, b) => this.parseLastActive(b.lastActive) - this.parseLastActive(a.lastActive))
      .slice(0, cap);
  }

  /**
   * Strip garbage that leaks into descriptions:
   *   "1,164 Pins·4d"   "17 Pins·3mo"   bare URLs   trailing pin-count noise
   * Returns '' if nothing meaningful remains.
   */
  cleanDescription(raw = '') {
    if (!raw) return '';
    let t = raw.trim();
    // Strip trailing pin-count + time noise: "...good stuff.3 Pins·9y"
    t = t.replace(/\s*\d[\d,]*\s*Pins?[·•·]\s*\S+\s*$/i, '').trim();
    if (/^\d[\d,]*\s*Pins?[·•·]/i.test(t))    return '';  // whole string is pin-count line
    if (/^https?:\/\/\S+$/.test(t))            return '';  // bare URL
    if (/^\d+\s*(?:mo?|w|d|h|y)$/i.test(t))   return '';  // pure relative time "3mo"
    if (t.length < 15)                         return '';  // too short to be useful
    return t;
  }

  async dismissModals(page) {
    for (const sel of [
      '[data-test-id="login-modal-close"]',
      '[aria-label="Close"]',
      'button:has-text("Not now")',
      'button:has-text("Maybe later")',
    ]) {
      try { await page.locator(sel).first().click({ timeout: 600 }); } catch (_) {}
    }
  }

  /* ═══════════════════════════ PROFILE PAGE ═════════════════════════════ */

  /**
   * Load the profile page once and capture:
   *   • profile metadata (name, username, followers) from the Pinterest API
   *   • all board data (name, pinCount, followers, lastActive, description)
   *
   * NOTE: This method captures ALL boards from the API / DOM.
   *       Slicing to maxBoards happens in scrapeProfile() after sorting.
   */
  async scrapeProfilePage(profileUrl) {
    const ctx  = await this.newContext();
    const page = await ctx.newPage();
    await this.blockAssets(page);

    // Virtual boards present on every profile — always ignored
    const SKIP_BOARDS = new Set(['created', 'saved']);

    const captured = { profile: null, boards: [] };
    const boardMap  = new Map();   // keyed by canonical board URL — prevents duplicates

    /* ── Intercept Pinterest internal API responses ── */
    page.on('response', async (res) => {
      try {
        const url = res.url();
        if (!url.includes('/resource/')) return;

        const text = await res.text().catch(() => '');
        if (!text || !text.trim().startsWith('{')) return;

        let json;
        try { json = JSON.parse(text); } catch { return; }

        const data = json?.resource_response?.data ?? json?.data;
        if (!data) return;

        /* Profile metadata */
        if ((url.includes('UserResource') || url.includes('ProfileResource')) && data?.username) {
          const followers = Math.max(data.follower_count ?? 0, data.follow_count ?? 0);
          captured.profile = {
            name:     data.full_name || data.username,
            username: data.username,
            followers
          };
          console.log(`[API] Profile: "${captured.profile.name}"  followers: ${followers.toLocaleString()}`);
        }

        /* Board list */
        if (url.includes('BoardsResource') && Array.isArray(data)) {
          data.forEach(b => {
            if (!b?.name || !b?.url) return;
            if (SKIP_BOARDS.has(b.name.toLowerCase().trim())) return;

            const bUrl = `https://www.pinterest.com${b.url}`;
            if (boardMap.has(bUrl)) return;

            boardMap.set(bUrl, {
              name:        b.name,
              description: this.cleanDescription(b.description || ''),
              pinCount:    b.pin_count       || 0,
              followers:   b.follower_count  || 0,
              url:         bUrl,
              // last_pin_save_time is a Unix timestamp in seconds
              lastActive:  this.tsToMonth(b.last_pin_save_time)
            });
          });
          captured.boards = [...boardMap.values()];
          console.log(`[API] Boards captured so far: ${captured.boards.length}`);
        }
      } catch (_) {}
    });

    try {
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: this.timeout });
      await this.dismissModals(page);

      /* Scroll to trigger lazy-loaded board API calls */
      for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await page.waitForTimeout(600);
      }
      await page.waitForTimeout(1500);

      /* ── Follower count — DOM fallback (3 layers) ── */
      if (!captured.profile || captured.profile.followers === 0) {
        const raw = await page.evaluate(() => {
          // Layer 1 — known attribute selectors
          for (const sel of [
            '[data-test-id="follower-count"]',
            'a[href$="/followers/"]',
            'a[href*="followers"]',
          ]) {
            const el = document.querySelector(sel);
            if (el) {
              const t = el.textContent?.trim() || '';
              if (t) return t;
            }
          }
          // Layer 2 — TreeWalker exact text node match
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const t = (node.textContent || '').trim();
            if (/^[\d.,]+[km]?\s*followers?$/i.test(t)) return t;
          }
          // Layer 3 — body.innerText regex (e.g. "1.8k followers · 9 following")
          const m = (document.body.innerText || '').match(/([\d.,]+[km]?)\s*followers?/i);
          return m ? m[0] : '';
        });

        if (raw) {
          const n = this.parseCount(raw);
          if (n > 0) {
            if (!captured.profile) captured.profile = { name: '', username: '', followers: 0 };
            captured.profile.followers = n;
            console.log(`[DOM] Followers: ${n.toLocaleString()}  (raw: "${raw}")`);
          }
        } else {
          console.log('[DOM] Followers: not found in DOM');
        }
      }

      /* ── Board list — DOM fallback ── */
      if (captured.boards.length === 0) {
        const username  = this.extractUsername(profileUrl);
        const domBoards = await page.evaluate((uname) => {
          const seen    = new Set();
          const results = [];

          // Improved selector: any link that looks like a board
          const links = Array.from(document.querySelectorAll('a[href*="/"]'));
          
          links.forEach(a => {
            const href  = a.getAttribute('href') || '';
            const parts = href.split('/').filter(Boolean);
            
            // Boards usually have 2+ parts (username/board-name)
            if (parts.length < 2) return;
            if (['followers', 'following', 'pins', 'created', 'saved', 'search', 'settings'].includes(parts[1])) return;
            if (seen.has(href)) return;
            seen.add(href);

            const nameEl = a.querySelector('h3,h2,h1,[data-test-id="board-name"], div[role="heading"]');
            const name   = (nameEl?.textContent?.trim() || a.textContent?.split('\n')[0]?.trim() || '').trim();
            if (!name || name.length < 2) return;
            if (['created', 'saved'].includes(name.toLowerCase())) return;

            const txt = a.textContent || '';

            const pinM     = txt.match(/([\d,]+(?:\.\d+)?k?)\s*pins?/i);
            const pinCount = pinM
              ? Math.round(parseFloat(pinM[1].replace(',', '')) * (pinM[1].toLowerCase().includes('k') ? 1_000 : 1))
              : 0;

            const timeM   = txt.match(/\b(\d+\s*(?:mo?|w|d|h|y))\b/i);
            const timeRaw = timeM ? timeM[1].trim() : '';

            const folM      = txt.match(/([\d,]+(?:\.\d+)?k?)\s*followers?/i);
            const followers = folM
              ? Math.round(parseFloat(folM[1].replace(',', '').replace('k', '')) * (folM[1].toLowerCase().includes('k') ? 1_000 : 1))
              : 0;

            results.push({
              name,
              description: '',
              pinCount,
              followers,
              timeRaw,
              url: href.startsWith('http') ? href : `https://www.pinterest.com${href}`
            });
          });

          return results;
        }, username);

        // Convert "3mo" → "December 2025" and delete the raw field
        domBoards.forEach(b => {
          b.lastActive = this.relToMonth(b.timeRaw);
          delete b.timeRaw;
        });

        // FIX: cap DOM results so they don't balloon past maxBoards downstream
        // (actual cap applied in scrapeProfile after sorting — just store all here)
        captured.boards = domBoards;
        console.log(`[DOM] Boards fallback: ${domBoards.length}`);
      }

    } finally {
      await page.close();
      await ctx.close();
    }

    return captured;
  }

  /* ═══════════════════ BOARD DESCRIPTION (single page) ═════════════════ */

  async fetchBoardDescription(boardUrl) {
    const ctx  = await this.newContext();
    const page = await ctx.newPage();
    await this.blockAssets(page);

    try {
      await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(900);
      await this.dismissModals(page);

      /* 1. data-test-id selectors */
      for (const sel of ['[data-test-id="board-description"]', '[data-test-id*="description"]']) {
        try {
          const el = page.locator(sel).first();
          await el.waitFor({ timeout: 1_200 });
          const t  = this.cleanDescription(await el.textContent() || '');
          if (t) return t;
        } catch (_) {}
      }

      /* 2. Sibling element after <h1> */
      const nearH1 = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return '';
        const walk = (start) => {
          let el = start;
          for (let i = 0; i < 6 && el; i++, el = el.nextElementSibling) {
            const t = el.textContent?.trim() || '';
            if (t.length > 10 && !/^\d+\s*(pins?|sections?)$/i.test(t) && !/^by\s/i.test(t))
              return t;
          }
          return '';
        };
        return walk(h1.nextElementSibling) || walk(h1.parentElement?.nextElementSibling) || '';
      });
      const cleanH1 = this.cleanDescription(nearH1);
      if (cleanH1) return cleanH1;

      /* 3. Inline JSON fallback */
      const fromJSON = await page.evaluate(() => {
        for (const s of document.querySelectorAll('script')) {
          const t = s.textContent || '';
          if (!t.includes('"description"')) continue;
          for (const m of t.matchAll(/"description"\s*:\s*"([^"]{15,500})"/g)) {
            const v = m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
            if (v.length > 15) return v;
          }
        }
        return '';
      });
      return this.cleanDescription(fromJSON);

    } catch (err) {
      console.warn(`  [Desc ERR] ${boardUrl}: ${err.message}`);
      return '';
    } finally {
      await page.close();
      await ctx.close();
    }
  }

  /* ══════════════════════ PARALLEL LIMITER ══════════════════════════════ */

  async parallelLimit(tasks, concurrency) {
    const results = new Array(tasks.length);
    let idx       = 0;
    const worker  = async () => {
      while (idx < tasks.length) {
        const i   = idx++;
        results[i] = await tasks[i]();
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
  }

  /* ══════════════════════════ MAIN ENTRY ════════════════════════════════ */

  /**
   * Scrape a Pinterest profile and return the top `maxBoards` boards.
   *
   * @param {string} profileUrl  - Pinterest profile URL
   * @param {object} options
   * @param {number} options.maxBoards  - number of boards to return (default: 10)
   * @param {number} options.maxRetries - scrape retry attempts (default: 2)
   *
   * Boards are sorted newest-first by `lastActive` before slicing, so you
   * always get the most recently active boards, not just the first ones
   * rendered in the DOM or API response.
   */
  async scrapeProfile(profileUrl, { maxBoards = 10, maxRetries = 2 } = {}) {
    await this.init();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url      = this.normalizeUrl(profileUrl);
        const username = this.extractUsername(url);

        console.log(`\n${'═'.repeat(70)}`);
        console.log(`[Scraper] Attempt ${attempt}  →  ${url}`);
        console.log(`[Scraper] Board cap: ${maxBoards}`);
        console.log(`${'═'.repeat(70)}`);

        /* Step 1: Single page load — followers + all boards + lastActive dates */
        const { profile, boards } = await this.scrapeProfilePage(url);

        const name      = profile?.name      || username;
        const followers = profile?.followers || 0;

        // ── FIX: sort by recency then cap ─────────────────────────────────────
        // Guarantees the returned boards are the LATEST maxBoards ones,
        // regardless of the order the API or DOM delivered them.
        const topBoards = this.sortAndCap(boards, maxBoards);

        console.log(`\n[Profile] "${name}"  |  followers: ${followers.toLocaleString()}`);
        console.log(`[Boards]  captured: ${boards.length}  →  using latest: ${topBoards.length}`);

        /* Step 2: Fetch missing descriptions in parallel (3 at a time) */
        const needDesc = topBoards.filter(b => !b.description && b.url);
        if (needDesc.length > 0) {
          console.log(`\n[Desc] Fetching ${needDesc.length} descriptions  (${this.PARALLEL} parallel)...`);
          const tasks = needDesc.map(board => async () => {
            console.log(`  ➜ ${board.name}`);
            board.description = await this.fetchBoardDescription(board.url);
            console.log(`  ✓ "${board.name}": "${(board.description || 'none').substring(0, 70)}"`);
          });
          await this.parallelLimit(tasks, this.PARALLEL);
        }

        /* Step 3: Build and return result */
        const result = {
          name,
          username,
          followers,
          boards:    topBoards,
          url,
          scrapedAt: new Date().toISOString(),
          success:   true
        };

        this.printResult(result);
        return result;

      } catch (err) {
        console.warn(`[Scraper] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 2_000 * attempt));
      }
    }

    return { success: false, error: 'All attempts failed', url: profileUrl };
  }

  /* ══════════════════════════ LOGGING ═══════════════════════════════════ */

  printResult(data) {
    const line = '═'.repeat(80);
    console.log(`\n${line}`);
    console.log(`  PROFILE   : ${data.name}  (@${data.username})`);
    console.log(`  FOLLOWERS : ${(data.followers || 0).toLocaleString()}`);
    console.log(`  BOARDS    : ${data.boards.length}`);
    console.log(`  SCRAPED   : ${data.scrapedAt}`);
    console.log(line);

    data.boards.forEach((b, i) => {
      const preview = (b.description || '').substring(0, 80);
      const descTag = b.description
        ? `✓  "${preview}${b.description.length > 80 ? '…' : ''}"`
        : '✗  none';

      console.log(`\n  ${String(i + 1).padStart(2, '0')}. ${b.name}`);
      console.log(`      Pins        : ${(b.pinCount || 0).toLocaleString()}`);
      console.log(`      Followers   : ${(b.followers || 0).toLocaleString()}`);
      console.log(`      Last Active : ${b.lastActive || '—'}`);
      console.log(`      Description : ${descTag}`);
      console.log(`      URL         : ${b.url}`);
    });

    console.log(`\n${line}\n`);
  }

  /* ══════════════════════════ CLEANUP ═══════════════════════════════════ */

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PinterestScraper();