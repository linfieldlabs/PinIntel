/**
 * Recommendation Engine  ─  v3 (Pinterest Intelligence)
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates actionable, board-specific GEO recommendations from real scraped data.
 * Features: Niche discovery, keyword expansion, and context-aware suggestions.
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use strict';

const MathUtils = require('../utils/mathUtils');

class RecommendationEngine {

  // ──────────────────────────────────────────────────────────────────────────
  //  ENTRY: Generate recommendations for a single board
  // ──────────────────────────────────────────────────────────────────────────
  generateRecommendations(board, keywords, competitorBoards = []) {
    const recs = [
      ...this.generateGEORecommendations(board, keywords, competitorBoards),
      ...this.generateEngagementRecommendations(board),
      ...this.generateConsistencyRecommendations(board),
      ...(competitorBoards.length > 0
        ? this.generateCompetitiveRecommendations(board, competitorBoards, keywords)
        : []),
      ...(competitorBoards.length > 0
        ? this.generateDiscoveryRecommendations(board, competitorBoards, keywords)
        : [])
    ];

    // Sort by impactScore desc
    recs.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));

    return recs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GEO Recommendations  (title, description, keyword coverage)
  // ──────────────────────────────────────────────────────────────────────────
  generateGEORecommendations(board, keywords, competitorBoards) {
    const recs    = [];
    const name    = (board.name        || '').toLowerCase();
    const desc    = (board.description || '');
    const descLC  = desc.toLowerCase();
    const kws     = keywords.map(k => k.toLowerCase().trim()).filter(Boolean);

    // Find the best keyword from the input list for this board
    const bestKw = this._findBestMatchingKeyword(board, keywords);

    // 1. Keyword in title
    if (!kws.some(kw => name.includes(kw))) {
      recs.push({
        type:       'geo',
        issue:      'Missing GEO keyword in board title',
        recommendation: `Optimise "${board.name}" for search by adding a primary topic keyword.`,
        example:    `Suggested: "${bestKw.toUpperCase()} | ${board.name}"  or  "Top ${bestKw} Ideas — ${board.name}"`,
        impact:     'High',
        impactScore: 92,
        effort:     'Low',
        effortScore: 10,
        rationale:  'Generative engines prioritise the first 3 words of a board title for topical categorisation.',
        targetKeyword: bestKw
      });
    }

    // 2. Description missing / thin
    if (!desc || desc.length < 80) {
      recs.push({
        type:       'geo',
        issue:      `Thin board metadata (${desc.length} chars)`,
        recommendation: `Expand your description to 150+ characters to help AI engines understand board context.`,
        example:    `"This board features the latest ${bestKw} trends, curated for ${board.name}. Explore unique ${keywords[1] || 'styles'} and get inspired!"`,
        impact:     'High',
        impactScore: 88,
        effort:     'Low',
        effortScore: 10,
        rationale:  'Rich descriptions provide the semantic depth needed for LLMs to recommend your content.',
        targetKeyword: bestKw
      });
    }

    // 3. Keyword absent from description
    if (desc && !kws.some(kw => descLC.includes(kw))) {
      recs.push({
        type:       'geo',
        issue:      'Keyword alignment gap in description',
        recommendation: `Naturalise your description by incorporating "${bestKw}" and related secondary terms.`,
        example:    `Mention how this board covers "${bestKw}" specifically in relation to "${board.name}".`,
        impact:     'Medium',
        impactScore: 75,
        effort:     'Low',
        effortScore: 10,
        rationale:  'Keyword-description alignment builds domain authority in Pinterest\'s GEO index.',
        targetKeyword: bestKw
      });
    }

    return recs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Discovery Recommendations  (finding NEW keywords from competitors)
  // ──────────────────────────────────────────────────────────────────────────
  generateDiscoveryRecommendations(board, competitorBoards, inputKeywords) {
    const recs = [];
    const boardText = `${board.name} ${board.description || ''}`.toLowerCase();
    
    // Find competitor boards that are similar to this one
    const similarCompBoards = competitorBoards.filter(cb => 
      MathUtils.calculateJaccardSimilarity(board.name, cb.name) > 0.2
    ).slice(0, 5);

    if (similarCompBoards.length === 0) return [];

    // Extract niche keywords from these specific similar boards
    const nicheKeywords = this.extractKeywordsFromBoards(similarCompBoards)
      .filter(kw => !inputKeywords.some(ikw => ikw.toLowerCase().includes(kw)) && !boardText.includes(kw))
      .slice(0, 3);

    if (nicheKeywords.length > 0) {
      recs.push({
        type:       'discovery',
        issue:      'Niche keyword opportunity detected',
        recommendation: `Tap into high-performing competitor topics: "${nicheKeywords.join(', ')}"`,
        example:    `Add these terms to your description to capture "Generative Discovery" traffic.`,
        impact:     'High',
        impactScore: 85,
        effort:     'Low',
        effortScore: 15,
        rationale:  'Competitors are ranking for these specific terms in your niche. Using them unlocks "Similar Ideas" discovery.',
        suggestedKeywords: nicheKeywords
      });
    }

    return recs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Engagement Recommendations
  // ──────────────────────────────────────────────────────────────────────────
  generateEngagementRecommendations(board) {
    const recs  = [];
    const pins  = board.pinCount || 0;

    if (pins < 25) {
      const gap = 50 - pins;
      recs.push({
        type:       'engagement',
        issue:      `Content volume shortfall (${pins} pins)`,
        recommendation: `Increase board density by adding ${gap} more curated pins to signal topical depth.`,
        example:    `Daily target: 3-5 quality pins until you reach the 50-pin authority threshold.`,
        impact:     'High',
        impactScore: 82,
        effort:     'Medium',
        effortScore: 40,
        rationale:  'Higher pin counts increase the "surface area" for AI recommendation engines to index your board.'
      });
    }

    return recs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Consistency Recommendations
  // ──────────────────────────────────────────────────────────────────────────
  generateConsistencyRecommendations(board) {
    const recs = [];
    const lastActive = board.lastActive || '';
    
    if (lastActive) {
      const d = new Date(lastActive);
      if (!isNaN(d)) {
        const now = new Date();
        const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        
        if (months > 4) {
          recs.push({
            type:       'consistency',
            issue:      `Recency signal decay (Inactive for ${months} months)`,
            recommendation: `Refresh "${board.name}" with daily pins to restore recency status in the Smart Feed.`,
            example:    'Schedule 1-2 pins per day using a social media dashboard to maintain steady activity.',
            impact:     'High',
            impactScore: 80,
            effort:     'Low',
            effortScore: 20,
            rationale:  'Aging content is deprioritised by Pinterest\'s "Freshness" algorithm in 2026.'
          });
        }
      }
    }

    return recs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Competitive Recommendations
  // ──────────────────────────────────────────────────────────────────────────
  generateCompetitiveRecommendations(board, competitorBoards, keywords) {
    const recs = [];
    const pins = board.pinCount || 0;

    // Pin count gap vs competitors
    const similarComps = competitorBoards.filter(cb => 
      MathUtils.calculateJaccardSimilarity(board.name, cb.name) > 0.3
    );

    if (similarComps.length > 0) {
      const maxCompPins = Math.max(...similarComps.map(cb => cb.pinCount || 0));
      if (maxCompPins > pins * 2) {
        recs.push({
          type:       'competitive',
          issue:      `Competitive scale gap vs market leaders`,
          recommendation: `Aggressively scale content volume to match the authority of "${similarComps[0].name}" (${maxCompPins} pins).`,
          example:    `Competitors have ~${Math.round(maxCompPins/pins)}x more pins on this specific topic.`,
          impact:     'Medium',
          impactScore: 70,
          effort:     'High',
          effortScore: 75,
          rationale:  'Scale is a proxy for niche authority in Generative SEO models.'
        });
      }
    }

    return recs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  _findBestMatchingKeyword(board, keywords) {
    if (!keywords || keywords.length === 0) return 'Ideas';
    let best = keywords[0];
    let maxSim = -1;
    
    const boardText = `${board.name} ${board.description || ''}`.toLowerCase();
    keywords.forEach(kw => {
      const sim = MathUtils.calculateJaccardSimilarity(kw.toLowerCase(), boardText);
      if (sim > maxSim) {
        maxSim = sim;
        best = kw;
      }
    });

    return best;
  }

  extractKeywordsFromBoards(boards) {
    const stopWords = new Set(['the','and','for','with','this','that','from','your','our','are','has','ideas','best','latest','more','tips','inspiration','trends','styling']);
    const freq      = {};
    boards.forEach(b => {
      const text  = `${b.name} ${b.description || ''}`.toLowerCase();
      text.split(/[\s,.\-!?()]+/).forEach(w => {
        const clean = w.replace(/[^a-z0-9]/g, '');
        if (clean.length > 3 && !stopWords.has(clean)) {
          freq[clean] = (freq[clean] || 0) + 1;
        }
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([kw]) => kw);
  }
}

module.exports = new RecommendationEngine();