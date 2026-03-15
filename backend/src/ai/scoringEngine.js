/**
 * Scoring Engine  ─  v3 (Pinterest Analytics Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements SEO and GEO (Generative Engine Optimization) metrics.
 * Calculations are based on only the latest 10 boards.
 * Clamped 0-100 logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use strict';

const MathUtils = require('../utils/mathUtils');

class ScoringEngine {

  // ──────────────────────────────────────────────────────────────────────────
  //  1. DERIVED VALUES
  // ──────────────────────────────────────────────────────────────────────────

  _getMonthsAgo(lastActive) {
    if (!lastActive) return 13; // default to inactive
    const d = new Date(lastActive);
    if (isNaN(d)) return 13;
    const now  = new Date();
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return Math.max(0, diff);
  }

  _calculateDerivedValues(profile, keywords = []) {
    const boards = (profile.boards || []).slice(0, 10);
    const totalBoards = boards.length || 1; // avoid / 0
    const pins_per_board = boards.map(b => b.pinCount || 0);
    const totalPins = pins_per_board.reduce((s, p) => s + p, 0);
    
    const boardsWithDescriptions = boards.filter(b => (b.description || '').trim().length > 0);
    const descriptionsCount = boardsWithDescriptions.length;
    
    const allDescriptions = boards.map(b => (b.description || '').toLowerCase()).join(' ');
    const totalWords = allDescriptions.split(/[\s,.\-!?()]+/).filter(w => w.length > 0).length || 1;
    
    let keywordMatches = 0;
    const uniqueKeywordsFound = new Set();
    const boardsContainingKeywords = new Set();

    keywords.forEach(kw => {
      const lowerKw = kw.toLowerCase();
      const regex = new RegExp(lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = allDescriptions.match(regex);
      if (matches) {
        keywordMatches += matches.length;
        uniqueKeywordsFound.add(lowerKw);
      }
      
      boards.forEach((board, idx) => {
        const boardText = `${board.name} ${board.description || ''}`.toLowerCase();
        if (boardText.includes(lowerKw)) {
          boardsContainingKeywords.add(idx);
        }
      });
    });

    const meanPins = MathUtils.calculateMean(pins_per_board);
    const stdPins = MathUtils.calculateStandardDeviation(pins_per_board);

    // Semantic Similarity Proxy
    let totalSimilarity = 0;
    boards.forEach(board => {
      const boardText = `${board.name} ${board.description || ''}`;
      const bestSim = keywords.length > 0 
        ? Math.max(...keywords.map(kw => MathUtils.calculateJaccardSimilarity(kw, boardText)))
        : 0.5; // Neutral fallback
      totalSimilarity += bestSim;
    });
    const avgSemanticSimilarity = totalSimilarity / totalBoards;

    return {
      totalBoards,
      totalPins,
      pins_per_board,
      descriptionsCount,
      totalWords,
      keywordMatches,
      uniqueKeywordsFoundCount: uniqueKeywordsFound.size,
      boardsContainingKeywordsCount: boardsContainingKeywords.size,
      meanPins,
      stdPins,
      avgSemanticSimilarity
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  2. MASTER ANALYZER
  // ──────────────────────────────────────────────────────────────────────────

  analyzeBoards(brandProfile, competitorProfiles, keywords = []) {
    const allProfiles = [brandProfile, ...(competitorProfiles || [])];
    
    // First pass: find MaxFollowers and MaxPins in the dataset
    let maxFollowers = 0;
    let maxPins = 0;
    let maxPinsPerBoard = 0;
    let maxEngagementProxy = 0;

    const profileData = allProfiles.map(p => {
      const derived = this._calculateDerivedValues(p, keywords);
      const ep = p.followers > 0 ? (derived.totalPins / p.followers) : 0;
      
      maxFollowers = Math.max(maxFollowers, p.followers || 0);
      maxPins = Math.max(maxPins, derived.totalPins);
      maxPinsPerBoard = Math.max(maxPinsPerBoard, derived.totalPins / derived.totalBoards);
      maxEngagementProxy = Math.max(maxEngagementProxy, ep);

      return { profile: p, derived, ep };
    });

    // Second pass: Calculate individual scores
    const scoredProfiles = profileData.map(pd => {
      const { profile, derived, ep } = pd;
      const totalKws = keywords.length || 1;

      // GEO STRENGTH
      const kwCoverage = derived.uniqueKeywordsFoundCount / totalKws;
      const kwDensity = derived.keywordMatches / derived.totalWords;
      const boardKwCoverage = derived.boardsContainingKeywordsCount / derived.totalBoards;
      const geoStrength = (0.5 * kwCoverage + 0.3 * Math.min(1, kwDensity * 10) + 0.2 * boardKwCoverage) * 100;

      // GEO AUTHORITY
      const followerScore = Math.log((profile.followers || 0) + 1) / Math.log(maxFollowers + 1 || 2);
      const contentScore = maxPins > 0 ? (derived.totalPins / maxPins) : 0;
      const descriptionScore = derived.descriptionsCount / derived.totalBoards;
      const geoAuthority = (0.5 * followerScore + 0.3 * contentScore + 0.2 * descriptionScore) * 100;

      // SOCIAL TRACTION
      const ppb = derived.totalPins / derived.totalBoards;
      const ppbNormalized = maxPinsPerBoard > 0 ? (ppb / maxPinsPerBoard) : 0;
      const spreadScore = 1 - (derived.stdPins / (derived.meanPins || 1));
      const epNormalized = maxEngagementProxy > 0 ? (ep / maxEngagementProxy) : 0;
      const socialTraction = (0.4 * ppbNormalized + 0.3 * Math.max(0, spreadScore) + 0.3 * epNormalized) * 100;

      // FREQUENCY
      let totalActivityScore = 0;
      (profile.boards || []).slice(0, 10).forEach(b => {
        const m = this._getMonthsAgo(b.lastActive);
        if (m <= 1) totalActivityScore += 100;
        else if (m <= 3) totalActivityScore += 80;
        else if (m <= 6) totalActivityScore += 60;
        else if (m <= 12) totalActivityScore += 40;
        else totalActivityScore += 20;
      });
      const frequency = totalActivityScore / derived.totalBoards;

      // AI REACH
      const aiReach = (0.4 * kwCoverage + 0.4 * derived.avgSemanticSimilarity + 0.2 * descriptionScore) * 100;

      // OVERALL HEALTH
      const overallHealth = 0.25 * geoStrength + 0.20 * geoAuthority + 0.20 * socialTraction + 0.20 * frequency + 0.15 * aiReach;

      return {
        name: profile.name,
        url: profile.url,
        followers: profile.followers,
        totalPins: derived.totalPins,
        avgScores: {
          geo: Math.round(geoStrength),
          geoAuthority: Math.round(geoAuthority),
          socialTraction: Math.round(socialTraction),
          frequency: Math.round(frequency),
          aiReach: Math.round(aiReach)
        },
        geoAuthorityScore: Math.round(geoAuthority),
        rankingScore: Math.round(overallHealth),
        boards: (profile.boards || []).slice(0, 10).map(b => {
          const m = this._getMonthsAgo(b.lastActive);
          let vel = 100;
          if (m > 1) vel = 80;
          if (m > 3) vel = 60;
          if (m > 6) vel = 40;
          if (m > 12) vel = 20;

          const text = `${b.name} ${b.description || ''}`.toLowerCase();
          let maxSim = 0;
          keywords.forEach(kw => {
            const sim = MathUtils.calculateJaccardSimilarity(kw.toLowerCase(), text);
            if (sim > maxSim) maxSim = sim;
          });
          const hasExact = keywords.some(k => text.includes(k.toLowerCase()));
          const alignment = hasExact ? 100 : Math.min(100, Math.round(maxSim * 100) + 10);
          const richness = Math.min(100, Math.round((b.description || '').length / 1.5));

          return {
            ...b,
            metrics: {
              strategicAlignment: alignment,
              metadataRichness: richness,
              aiDiscoveryScore: Math.round((alignment * 0.7) + (richness * 0.3)),
              activeVelocity: vel
            }
          };
        })
      };
    });

    const brand = scoredProfiles[0];
    const competitors = scoredProfiles.slice(1);

    return {
      brand,
      competitors,
      summary: {
        avgGEOScore: brand.avgScores.geo,
        avgEngagementScore: brand.avgScores.socialTraction,
        avgConsistencyScore: brand.avgScores.frequency,
        healthStatus: 
          brand.rankingScore >= 85 ? 'Excellent' :
          brand.rankingScore >= 70 ? 'Strong' :
          brand.rankingScore >= 50 ? 'Moderate' :
          brand.rankingScore >= 25 ? 'Weak' : 'Very Weak'
      }
    };
  }
}

module.exports = new ScoringEngine();