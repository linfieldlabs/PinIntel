'use strict';

const scraperService      = require('./scraperService');
const scoringEngine       = require('../ai/scoringEngine');
const recommendationEngine = require('../ai/recommendationEngine');
const intelligenceEngine  = require('../ai/intelligenceEngine');
const bedrockService      = require('./amazonBedrockService');

// Hard cap — must match scoringEngine.js MAX_BOARDS
const MAX_BOARDS = 10;

class AnalysisService {
  constructor() {
    this.pinterestRegex = /^https:\/\/(www\.)?pinterest\.[a-z.]+\/([a-zA-Z0-9_-]+)\/?.*$/;
  }

  /**
   * Normalize various Pinterest URL formats to a standard profile URL
   */
  normalizeUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (/pinterest\./.test(u.hostname)) {
        const seg = u.pathname.split('/').filter(Boolean)[0];
        // Skip common non-profile segments
        if (seg && !['pin', 'board', 'search', 'explore', 'ideas', 'business'].includes(seg)) {
          return `https://www.pinterest.com/${seg}/`;
        }
      }
    } catch (_) {}
    // Fallback to original or basic https prep
    return url.startsWith('http') ? url : `https://${url}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Full pipeline: scrape → score → recommend → intelligence → LLM
  // ──────────────────────────────────────────────────────────────────────────
  async runAnalysis(analysisId, analysisData, analysisStore) {
    const analysis = analysisStore.get(analysisId);
    if (!analysis) throw new Error('Analysis not found');

    try {
      analysis.status      = 'running';
      analysis.progress    = 5;
      analysis.updatedAt   = new Date().toISOString();
      analysisStore.set(analysisId, analysis);

      // Step 1 – validate
      await this.validateAnalysisData(analysisData);
      analysis.progress = 10;
      analysisStore.set(analysisId, analysis);

      // Step 2 – scrape brand
      analysis.currentStep = 'Scraping brand profile...';
      const brandProfile = await this.scrapeBrandProfileSafe(analysisData.brandUrl, analysisId, analysisStore);
      analysis.progress = 35;
      analysisStore.set(analysisId, analysis);

      // Step 3 – scrape competitors
      analysis.currentStep = 'Scraping competitors...';
      const competitorProfiles = await this.scrapeCompetitorsSafe(analysisData.competitorUrls, analysisId, analysisStore);
      analysis.progress = 55;
      analysisStore.set(analysisId, analysis);

      // Step 4 – scores
      analysis.currentStep = 'Calculating GEO scores...';
      const scores = scoringEngine.analyzeBoards(brandProfile, competitorProfiles, analysisData.keywords);
      analysis.progress = 70;
      analysisStore.set(analysisId, analysis);

      // Step 5 – recommendations
      analysis.currentStep = 'Generating recommendations...';
      const recommendations = this.generateAllRecommendations(brandProfile, competitorProfiles, analysisData.keywords);
      analysis.progress = 80;
      analysisStore.set(analysisId, analysis);

      // Step 6 – intelligence
      analysis.currentStep = 'Running intelligence engine...';
      const intelligence = intelligenceEngine.computeAll(
        brandProfile, competitorProfiles, analysisData.keywords, scores, recommendations
      );
      analysis.progress = 90;
      analysisStore.set(analysisId, analysis);

      // Step 7 – leaderboard
      analysis.currentStep = 'Calculating competitive rankings...';
      const leaderboard = this.calculateLeaderboard(brandProfile, competitorProfiles, analysisData.keywords, scores);
      analysis.progress = 95;
      analysisStore.set(analysisId, analysis);

      // Step 8 – LLM insights (non-blocking fallback)
      analysis.currentStep = 'Generating AI insights...';
      const llmInsights = await this.generateLLMInsightsSafe(brandProfile, scores, intelligence, analysisData.keywords);
      analysis.progress = 100;

      const results = {
        analyzedAt:      new Date().toISOString(),
        metadata: {
          analysisId,
          analyzedAt:      new Date().toISOString(),
          keywords:        analysisData.keywords,
          boardCount:      brandProfile.boards?.length || 0,
          competitorCount: competitorProfiles.length
        },
        brandProfile:       this.sanitizeProfile(brandProfile),
        competitorProfiles: competitorProfiles.map(cp => this.sanitizeProfile(cp)),
        scores,
        recommendations,
        leaderboard,
        intelligence,
        llmInsights: llmInsights || { note: 'AI insights temporarily unavailable' }
      };

      analysis.status      = 'completed';
      analysis.completedAt = new Date().toISOString();
      analysis.results     = results;
      analysis.currentStep = null;
      analysisStore.set(analysisId, analysis);

      console.log(`✅ Analysis ${analysisId} completed`);
      return results;

    } catch (error) {
      console.error(`❌ Analysis ${analysisId} failed:`, error);
      analysis.status    = 'failed';
      analysis.error     = {
        message:   error.message,
        code:      error.code || 'ANALYSIS_FAILED',
        timestamp: new Date().toISOString(),
        step:      analysis.currentStep || 'unknown'
      };
      analysis.progress  = 0;
      analysis.updatedAt = new Date().toISOString();
      analysisStore.set(analysisId, analysis);
      throw new Error(`Analysis failed at ${analysis.currentStep || 'initialization'}: ${error.message}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Calculations only (pre-scraped data, skip network)
  // ──────────────────────────────────────────────────────────────────────────
  async runCalculationsOnly(brandProfile, competitorProfiles, keywords) {
    try {
      const scores          = scoringEngine.analyzeBoards(brandProfile, competitorProfiles, keywords);
      const recommendations = this.generateAllRecommendations(brandProfile, competitorProfiles, keywords);
      const intelligence    = intelligenceEngine.computeAll(brandProfile, competitorProfiles, keywords, scores, recommendations);
      const leaderboard     = this.calculateLeaderboard(brandProfile, competitorProfiles, keywords, scores);
      const llmInsights     = await this.generateLLMInsightsSafe(brandProfile, scores, intelligence, keywords);

      return {
        analyzedAt:      new Date().toISOString(),
        metadata: {
          analyzedAt:      new Date().toISOString(),
          keywords,
          boardCount:      brandProfile.boards?.length || 0,
          competitorCount: competitorProfiles.length
        },
        brandProfile:       this.sanitizeProfile(brandProfile),
        competitorProfiles: competitorProfiles.map(cp => this.sanitizeProfile(cp)),
        scores,
        recommendations,
        leaderboard,
        intelligence,
        llmInsights: llmInsights || { note: 'AI insights temporarily unavailable' }
      };
    } catch (error) {
      console.error('Calculation failed:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Input validation
  // ──────────────────────────────────────────────────────────────────────────
  async validateAnalysisData(analysisData) {
    // Normalize urls first
    analysisData.brandUrl = this.normalizeUrl(analysisData.brandUrl?.trim());
    if (Array.isArray(analysisData.competitorUrls)) {
      analysisData.competitorUrls = analysisData.competitorUrls.map(url => this.normalizeUrl(url?.trim()));
    }

    if (!analysisData.brandUrl || !this.pinterestRegex.test(analysisData.brandUrl)) {
      throw new Error('Valid Pinterest profile URL is required for brand');
    }

    if (!Array.isArray(analysisData.competitorUrls) || analysisData.competitorUrls.length === 0) {
      throw new Error('At least 1 competitor URL is required (max 5)');
    }
    if (analysisData.competitorUrls.length > 5) {
      throw new Error('Maximum 5 competitors allowed');
    }
    analysisData.competitorUrls.forEach((url, i) => {
      if (!this.pinterestRegex.test(url)) {
        throw new Error(`Invalid competitor URL #${i + 1}: ${url}`);
      }
    });
    if (!Array.isArray(analysisData.keywords) || analysisData.keywords.length === 0 || analysisData.keywords.length > 20) {
      throw new Error('1–20 keywords required');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Brand scraping (retry-safe)
  // ──────────────────────────────────────────────────────────────────────────
  async scrapeBrandProfileSafe(brandUrl, analysisId, analysisStore, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const profile = await scraperService.scrapeProfile(brandUrl, { maxBoards: MAX_BOARDS });

        if (!profile?.boards?.length) {
          if (attempt === maxRetries) {
            throw new Error(`Brand profile "${brandUrl}" has no public boards or is private`);
          }
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        profile.boards = profile.boards
          .filter(b => {
            const isSystem = /(_created|_saved)$/.test(b.url || '') ||
              (['Created', 'Saved'].includes(b.name) && b.pinCount === 0);
            return !isSystem;
          })
          .slice(0, MAX_BOARDS);

        profile.boards.forEach(b => {
          if (b.description && (/^\d[\d,]*\s*Pins?[·•·]/i.test(b.description) || b.description.includes('Pins·'))) {
            b.description = '';
          }
        });

        return profile;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        console.warn(`Brand scrape attempt ${attempt} failed (${analysisId}):`, error.message);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Competitor scraping (sequential to avoid rate limits)
  // ──────────────────────────────────────────────────────────────────────────
  async scrapeCompetitorsSafe(competitorUrls, analysisId, analysisStore) {
    const profiles = [];

    for (let i = 0; i < competitorUrls.length; i++) {
      try {
        const profile = await scraperService.scrapeProfile(competitorUrls[i], { maxBoards: MAX_BOARDS });

        if (!profile?.boards?.length) {
          console.warn(`Skipping competitor ${competitorUrls[i]} — no public boards`);
          continue;
        }

        profile.boards = profile.boards.slice(0, MAX_BOARDS);
        profiles.push(profile);

        const analysis = analysisStore.get(analysisId);
        if (analysis) {
          analysis.progress = 40 + (i + 1) * (15 / competitorUrls.length);
          analysisStore.set(analysisId, analysis);
        }

        if (i < competitorUrls.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      } catch (error) {
        console.warn(`Competitor ${competitorUrls[i]} failed:`, error.message);
      }
    }

    if (profiles.length === 0) {
      console.error('All competitors failed or are private. Using empty competitor pool.');
      // We don't throw; we let the engine handle empty competitors
    }

    return profiles;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Recommendations
  // ──────────────────────────────────────────────────────────────────────────
  generateAllRecommendations(brandProfile, competitorProfiles, keywords) {
    const competitorBoards   = (competitorProfiles || []).flatMap(cp => cp.boards || []);
    const seenKeys           = new Set();
    const allRecs            = [];
    const typeCounts         = { geo: 0, engagement: 0, consistency: 0, competitive: 0, discovery: 0 };

    (brandProfile.boards || []).slice(0, MAX_BOARDS).forEach((board, boardIndex) => {
      const boardRecs = recommendationEngine.generateRecommendations(board, keywords, competitorBoards);

      // Take a few from each board, prioritizing diversity
      boardRecs.forEach(rec => {
        const key = `${rec.type}:${(rec.issue || '').substring(0, 30)}:${(board.name || '').substring(0, 20)}`.toLowerCase();
        if (seenKeys.has(key)) return;
        
        // Soft limit per type to ensure variety in the top 12
        if (typeCounts[rec.type] > 4) return; 

        seenKeys.add(key);
        typeCounts[rec.type]++;

        allRecs.push({
          ...rec,
          boardName:       board.name,
          boardIndex,
          personalizedText: this.personalizeRecommendation(rec, board, keywords),
          impactScore:     rec.impactScore || 70
        });
      });
    });

    return allRecs
      .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
      .slice(0, 12)
      .map((rec, i) => ({ ...rec, priority: i + 1 }));
  }

  personalizeRecommendation(rec, board, keywords) {
    const boardName    = board.name || 'this board';
    const firstKeyword = rec.targetKeyword || keywords[0] || 'your niche';
    const suggested    = rec.suggestedKeywords ? rec.suggestedKeywords.join(', ') : '';

    switch (rec.type) {
      case 'geo':
        if (rec.issue?.includes('title')) {
          return `Target GEO ranking for "${boardName}" by leading with "${firstKeyword.toUpperCase()}".`;
        }
        return `Enhance generative clarity for "${boardName}" with contextual keyword usage.`;

      case 'discovery':
        return `Market Opportunity: Competitors are using "${suggested}" to rank for "${boardName}"-related queries.`;

      case 'engagement':
        return `Authority Alert: "${boardName}" requires more content density to qualify for "Similar Ideas" recommendations.`;

      case 'consistency':
        return `Recency Warning: Re-activate "${boardName}" with fresh pins to stop visibility decay.`;

      case 'competitive':
        return `Competitive Gap: Match the content scale of market leaders on "${boardName}" topics.`;

      default:
        return rec.recommendation || `Optimise the GEO signals for "${boardName}".`;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  /**
   * Leaderboard - Enhanced for 2026 Metrics
   * Syncs competitive ranking with ScoringEngine results
   */
  calculateLeaderboard(brandProfile, competitorProfiles, keywords, engineScores) {
    const brand = engineScores?.brand;
    const competitors = engineScores?.competitors || [];

    const allProfiles = [
      {
        name: brand?.name || 'Unknown',
        isBrand: true,
        url: brand?.url || '',
        followers: brand?.followers || 0,
        boardCount: brand?.boards?.length || 0,
        avgGEO: brand?.avgScores?.geo || 0,
        avgEngagement: brand?.avgScores?.socialTraction || 0,
        avgConsistency: brand?.avgScores?.frequency || 0,
        geoAuthorityScore: brand?.geoAuthorityScore || 0,
        rankingScore: brand?.rankingScore || 0,
        engagementMetric: brand?.avgScores?.socialTraction || 0,
        totalPins: brand?.totalPins || 0
      },
      ...competitors.map(cp => ({
        name: cp?.name || 'Unknown',
        isBrand: false,
        url: cp?.url || '',
        followers: cp?.followers || 0,
        boardCount: cp?.boards?.length || 0,
        avgGEO: cp?.avgScores?.geo || 0,
        avgEngagement: cp?.avgScores?.socialTraction || 0,
        avgConsistency: cp?.avgScores?.frequency || 0,
        geoAuthorityScore: cp?.geoAuthorityScore || 0,
        rankingScore: cp?.rankingScore || 0,
        engagementMetric: cp?.avgScores?.socialTraction || 0,
        totalPins: cp?.totalPins || 0
      }))
    ];

    return allProfiles
      .sort((a, b) => (b.followers || 0) - (a.followers || 0)) // Ranked by followers as requested
      .map((item, i) => ({ ...item, rank: i + 1 }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  LLM insights
  // ──────────────────────────────────────────────────────────────────────────
  async generateLLMInsightsSafe(brandProfile, scores, intelligence, keywords) {
    try {
      const activeService = bedrockService; // Nova only

      const [summaryResult, healthResult, strategyResult] = await Promise.allSettled([
        activeService.generateAdvancedSummary?.(scores, brandProfile, keywords),
        activeService.explainHealthScore?.(
          intelligence.brandScore?.healthScore,
          intelligence.brandScore?.breakdown,
          brandProfile.name
        ),
        activeService.generateContentStrategy?.(brandProfile, keywords)
      ]);

      return {
        executiveSummary:  summaryResult.status  === 'fulfilled' ? summaryResult.value  : null,
        healthExplanation: healthResult.status   === 'fulfilled' ? healthResult.value   : null,
        contentStrategy:   strategyResult.status === 'fulfilled' ? strategyResult.value : null,
        aiProvider: 'Amazon Nova (ap-south-1)'
      };
    } catch (error) {
      console.warn('LLM insights failed:', error.message);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Profile sanitizer
  // ──────────────────────────────────────────────────────────────────────────
  sanitizeProfile(profile) {
    return {
      name:      profile.name      || 'Unknown',
      url:       profile.url       || '',
      followers: profile.followers || 0,
      boards: (profile.boards || []).slice(0, MAX_BOARDS).map(b => ({
        name:        b.name        || 'Untitled',
        description: b.description || '',
        pinCount:    b.pinCount    || 0,
        followers:   b.followers   || 0,
        lastActive:  b.lastActive  || '',
        url:         b.url         || ''
      }))
    };
  }
}

module.exports = new AnalysisService();