'use strict';

const axios = require('axios');

/**
 * Groq LLM Service  ─  v2 (accuracy + bugfix rewrite)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes:
 *   • generateContentStrategy: `boardData` → `brandData` (was ReferenceError)
 *   • explainKeywordOpportunity: now calls this.complete() instead of always
 *     returning a hardcoded string
 *   • All prompts reference GEO (Generative Engine Optimisation) terminology
 *   • Fallback responses are informative and consistent with scoring engine output
 * ─────────────────────────────────────────────────────────────────────────────
 */
class GroqService {
  constructor() {
    this.apiKey         = process.env.GROQ_API_KEY?.trim();
    this.apiUrl         = 'https://api.groq.com/openai/v1/chat/completions';
    this.baseModels     = ['llama-3.1-8b-instant', 'llama3-8b-8192', 'mixtral-8x7b-32768'];
    this.model          = this.baseModels[0];
    this.enabled        = !!(this.apiKey && this.apiKey !== 'undefined');
    this.maxRetries     = 2;
    this.requestTimeout = 20_000;
    this.rateLimitDelay = 1_000;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Core API call — retries + model rotation + graceful fallback
  // ──────────────────────────────────────────────────────────────────────────
  async complete(systemPrompt, userPrompt, maxTokens = 300, options = {}) {
    if (!this.enabled) {
      return this._fallback(systemPrompt, userPrompt);
    }

    const retries     = options.maxRetries   ?? this.maxRetries;
    const temperature = options.temperature  ?? 0.2;

    for (let attempt = 1; attempt <= retries; attempt++) {
      if (attempt > 1) {
        await new Promise(r => setTimeout(r, this.rateLimitDelay * attempt));
      }

      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model:      this.model,
            messages: [
              { role: 'system', content: systemPrompt.trim() },
              { role: 'user',   content: userPrompt.trim()   }
            ],
            max_tokens:  Math.min(maxTokens, 500),
            temperature,
            top_p:       0.9,
            stream:      false
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type':  'application/json',
              'User-Agent':    'Pinterest-GEO-Analyzer/2.0'
            },
            timeout:        this.requestTimeout,
            validateStatus: s => s < 500
          }
        );

        if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
          const content = response.data.choices[0].message.content.trim();
          return content.length > 10 ? content : this._fallback(systemPrompt, userPrompt);
        }

        // 4xx — client error, no point retrying
        if (response.status >= 400) {
          console.warn(`Groq API ${response.status}:`, response.data?.error?.message);
          return this._fallback(systemPrompt, userPrompt);
        }

      } catch (error) {
        console.warn(`Groq attempt ${attempt} failed:`, error.code || error.message);

        // Rotate model on retry
        if (attempt < this.baseModels.length) {
          this.model = this.baseModels[attempt % this.baseModels.length];
        }

        // No recovery for these errors
        if (['ENOTFOUND', 'ECONNREFUSED'].includes(error.code) || error.response?.status === 401) {
          return this._fallback(systemPrompt, userPrompt);
        }
      }
    }

    return this._fallback(systemPrompt, userPrompt);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Intelligent fallback  (topic-aware, never null)
  // ──────────────────────────────────────────────────────────────────────────
  _fallback(systemPrompt = '', userPrompt = '') {
    const combined = (systemPrompt + userPrompt).toLowerCase();

    if (combined.includes('health') || combined.includes('score')) {
      return 'Your profile has improvement potential. Prioritise adding target keywords to board titles and expanding descriptions to 120+ characters to lift your GEO score.';
    }
    if (combined.includes('keyword') || combined.includes('competitor')) {
      return 'Keyword gap detected. Add the missing high-frequency terms to 3-5 board titles and descriptions for immediate GEO visibility gains.';
    }
    if (combined.includes('strategy') || combined.includes('content')) {
      return '1. Rename boards to include primary keywords.\n2. Write 120-280 char descriptions with keywords and hashtags.\n3. Pin 10+ items per week to maintain recency ranking.';
    }
    if (combined.includes('weakness') || combined.includes('issue')) {
      return 'Main opportunity: boards with no keyword in the title are invisible to generative search. Rename them using your top keyword as the first word.';
    }
    return 'GEO optimisation tip: keyword-rich titles + detailed descriptions + consistent pinning (10+/week) are the three levers that drive Pinterest discovery.';
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Board weakness explanation
  // ──────────────────────────────────────────────────────────────────────────
  async explainBoardWeakness(boardName, issues, keywords) {
    if (!issues?.length || !keywords?.length) {
      return `"${boardName}": add "${keywords?.[0] || 'your keyword'}" to the title to improve GEO discoverability.`;
    }

    const system = `You are a Pinterest GEO expert. Explain ONE main board issue in 1 clear, actionable sentence using the board name. No jargon.`;
    const user   = `Board: "${boardName}". Issues: ${issues.slice(0, 3).join('; ')}. Keywords: ${keywords.slice(0, 3).join(', ')}. Give 1-sentence fix.`;

    return this.complete(system, user, 120);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Health score explanation
  //  Receives: healthScore (0-100 integer), breakdown (object), profileName (string)
  // ──────────────────────────────────────────────────────────────────────────
  async explainHealthScore(healthScore, breakdown, profileName) {
    if (healthScore == null) {
      return `"${profileName || 'Your brand'}" needs optimisation. Start with keyword-rich board titles and 120+ char descriptions.`;
    }

    const system = `You are a Pinterest GEO consultant. Write exactly 2 sentences: one on overall status, one on the weakest component. Use simple language. No bullet points.`;
    const user   = `Profile: "${profileName || 'Your Brand'}". Health score: ${healthScore}/100.
GEO Content: ${breakdown?.geo?.score        || 0}/100
GEO Authority: ${breakdown?.authority?.score   || 0}/100
Engagement: ${breakdown?.engagement?.score  || 0}/100
Consistency: ${breakdown?.consistency?.score || 0}/100
Richness: ${breakdown?.metadata?.score     || 0}/100
Write 2-sentence summary with the main improvement focus.`;

    return this.complete(system, user, 200);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Keyword opportunity explanation
  //  FIX: now actually calls this.complete() instead of always returning static text
  // ──────────────────────────────────────────────────────────────────────────
  async explainKeywordOpportunity(keyword, competitorUsage) {
    const usageStr = competitorUsage != null
      ? `used by ${competitorUsage} competitor board(s)`
      : 'used frequently by competitors';

    const system = `You are a Pinterest GEO expert. Give 1 sentence explaining why adding a keyword to Pinterest boards matters. Be specific and actionable.`;
    const user   = `Keyword: "${keyword}" (${usageStr}) is absent from this brand's boards. Explain the opportunity and the fix in 1 sentence.`;

    return this.complete(system, user, 120);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Content strategy  ─  3 numbered tips
  //  FIX: was referencing undefined `boardData` — now correctly uses `brandData`
  // ──────────────────────────────────────────────────────────────────────────
  async generateContentStrategy(brandData, topKeywords) {
    const boardCount    = brandData?.boards?.length || 0;
    const followers     = brandData?.followers     || 0;
    const brandName     = brandData?.name          || 'Your Brand';   // FIX: was boardData.name
    const firstKeywords = (topKeywords || []).slice(0, 3);

    const system = `You are a Pinterest strategist. Give exactly 3 numbered, specific GEO content tips. Each tip is 1 sentence. Use exact numbers and keyword examples.`;
    const user   = `Brand: "${brandName}", ${boardCount} boards, ${followers.toLocaleString()} followers. Target keywords: ${firstKeywords.join(', ')}. 3 numbered tips.`;

    const response = await this.complete(system, user, 240);

    return response || (
      `1. Create or rename boards so "${firstKeywords[0] || 'your keyword'}" appears in the title.\n` +
      `2. Write 120-280 char descriptions for every board mentioning ${firstKeywords.slice(0, 2).join(' and ')}.\n` +
      `3. Pin 10+ quality items per week across your top 5 boards to maintain recency ranking.`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Executive summary  (3 sentences)
  //  Receives the full scores object (not just scores.summary)
  // ──────────────────────────────────────────────────────────────────────────
  async generateAdvancedSummary(scores, brandProfile, keywords) {
    const summary = scores?.summary || {};

    const system = `You are a Pinterest GEO consultant. Write a 3-sentence executive summary: (1) overall status, (2) main strength, (3) top priority fix. Plain English only.`;
    const user   = `Brand: "${brandProfile?.name || 'Your Brand'}".
GEO Score: ${summary.avgGEOScore        || 0}/100
Engagement: ${summary.avgEngagementScore  || 0}/100
Consistency: ${summary.avgConsistencyScore || 0}/100
Competitors analysed: ${brandProfile?.competitorCount || 0}
Keywords: ${(keywords || []).slice(0, 5).join(', ')}
Write 3-sentence executive summary.`;

    return this.complete(system, user, 300);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Batch insights  (rate-limited parallel)
  // ──────────────────────────────────────────────────────────────────────────
  async batchInsights(insightsConfig) {
    const results  = {};
    const entries  = Object.entries(insightsConfig);

    for (const [key, config] of entries) {
      try {
        results[key] = await this.complete(config.system, config.user, config.maxTokens || 200);
      } catch {
        results[key] = this._fallback(config.system, config.user);
      }
      await new Promise(r => setTimeout(r, 500)); // rate limit between calls
    }

    return results;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Service status
  // ──────────────────────────────────────────────────────────────────────────
  getStatus() {
    return {
      enabled:   this.enabled,
      model:     this.model,
      apiKeySet: !!this.apiKey
    };
  }
}

module.exports = new GroqService();