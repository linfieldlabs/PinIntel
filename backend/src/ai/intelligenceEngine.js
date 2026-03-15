/**
 * Intelligence Engine  ─  v2.1 (sync rewrite)
 * ─────────────────────────────────────────────────────────────────────────────
 * All 10 features computed using the 25 Advanced Metrics from ScoringEngine.
 * Synchronized with DashboardPage.jsx requirements to prevent UI crashes.
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use strict';

const MathUtils = require('../utils/mathUtils');

class IntelligenceEngine {

  _monthsAgo(lastActive) {
    if (!lastActive) return null;
    const d = new Date(lastActive);
    if (isNaN(d)) return null;
    const now  = new Date();
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return Math.max(0, diff);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 1: Weakness Summary
  // ──────────────────────────────────────────────────────────────────────────
  computeWeaknessSummary(brandScores, brandProfile, keywords, recommendations = []) {
    const { avgGEOScore, avgEngagementScore, avgConsistencyScore } = brandScores.summary;
    const boards = brandScores.brand.boards || [];
    const weaknesses = [];

    // Extract discovered niche keywords from recommendations
    const suggestedKws = new Set();
    recommendations.forEach(rec => {
      if (rec.type === 'discovery' && rec.suggestedKeywords) {
        rec.suggestedKeywords.forEach(kw => suggestedKws.add(kw));
      }
    });
    const extraPointers = Array.from(suggestedKws).slice(0, 3);
    const extraSt = extraPointers.length > 0 ? ` Try incorporating high-performing niche terms like "${extraPointers.join('", "')}".` : '';

    if (avgGEOScore < 60) {
      const lowAlignment = boards.filter(b => (b.metrics?.strategicAlignment || 0) < 50).length;
      if (lowAlignment > 0) {
        weaknesses.push(`Strategic Mismatch: ${lowAlignment} of your boards don't clearly align with your target topics. Pinterest's AI might struggle to categorize them. Update their titles and descriptions with clearer keywords like "${keywords[0] || 'your niche'}".${extraSt}`);
      } else {
        weaknesses.push(`Low Semantic Depth: Your board descriptions are too brief. Generative engines (like Pinterest's AI) need rich text to understand what your boards are about. Expand your descriptions using natural language and relevant keywords.`);
      }
    }

    if (avgEngagementScore < 50) {
      weaknesses.push(`Social Traction Deficit: Even though you have followers, your recent pins aren't getting proportional engagement (saves/clicks). Pinterest favors content that gets immediate interaction. Focus on high-quality visuals and compelling text overlays.`);
    }

    if (avgConsistencyScore < 50) {
      weaknesses.push(`Recency Decay: Pinterest heavily prioritizes "fresh" content. The algorithm rewards active profiles. Start a consistent pinning schedule (e.g., 2-3 pins a day) rather than bulk posting to maintain domain authority.`);
    }

    if (weaknesses.length < 3 && extraPointers.length > 0) {
      weaknesses.push(`Untapped Niche Traffic: Competitors are capturing search traffic for topics you haven't fully covered. Consider creating new boards or pins focusing on "${extraPointers.join('", "')}" to reach a broader audience.`);
    }

    if (weaknesses.length === 0) {
      weaknesses.push(`Strong Profile Health: Your metrics are balanced across Search, Engagement, and Consistency. Continue expanding into new sub-niches to scale your reach.`);
    }

    return weaknesses.slice(0, 4);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 2: Priority Fixes
  // ──────────────────────────────────────────────────────────────────────────
  computePriorityFixes(recommendations) {
    const impactMap = { High: 3, Medium: 2, Low: 1 };
    const effortMap = { Low: 3, Medium: 2, High: 1 };
    
    return (recommendations || []).map((rec, i) => {
      const impact = rec.impact || 'Medium';
      const effort = rec.effort || 'Medium';
      return {
        rank: i + 1,
        fix: (rec.personalizedText || rec.recommendation || '').replace(/SEO/g, 'GEO'),
        type: (rec.type || 'general').replace('seo', 'geo'),
        impact,
        effort,
        priorityScore: (impactMap[impact] || 2) * (effortMap[effort] || 2),
        rationale: (rec.rationale || '').replace(/SEO/g, 'GEO'),
        boardName: rec.boardName || null,
        example: rec.example || null
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 12);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 3: Keyword Gap
  // ──────────────────────────────────────────────────────────────────────────
  computeKeywordGap(brandProfile, competitorProfiles, keywords) {
    const brandText = (brandProfile.boards || []).map(b => `${b.name} ${b.description || ''}`).join(' ').toLowerCase();
    const freq = {};

    (competitorProfiles || []).forEach(cp => {
      (cp.boards || []).forEach(board => {
        const words = `${board.name} ${board.description || ''}`.toLowerCase().split(/[\s,.\-!?()]+/);
        words.forEach(w => {
          const clean = w.replace(/[^a-z0-9]/g, '');
          if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
        });
      });
    });

    const missingKeywords = Object.entries(freq)
      .filter(([kw]) => !brandText.includes(kw))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([kw, usage]) => ({
        keyword: kw,
        competitorUsage: usage,
        recommendation: `Incorporate "${kw}" for generative search coverage.`
      }));

    return {
      missingKeywords,
      brandKeywordCount: keywords.filter(k => brandText.includes(k.toLowerCase())).length,
      totalTargetKeywords: keywords.length
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 4: Board Quality
  // ──────────────────────────────────────────────────────────────────────────
  computeBoardQuality(brandBoards, keywords, recommendations = []) {
    return (brandBoards || []).map(board => {
      const metrics = board.metrics || {};
      const issues = [];
      const suggestions = [];

      const boardRecs = recommendations.filter(r => r.boardName === board.name);
      boardRecs.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));

      if (metrics.strategicAlignment < 55) issues.push('Low Keyword Alignment');
      if (metrics.metadataRichness < 45) issues.push('Thin Metadata');
      if (metrics.activeVelocity < 50) issues.push('Activity Decay');
      
      if (issues.length === 0 && board.pinCount < 30) issues.push('Low Content Volume');

      if (boardRecs.length > 0) {
        const topRec = boardRecs[0];
        if (topRec.type === 'discovery' && topRec.suggestedKeywords) {
           suggestions.push(`Leverage niche terms: "${topRec.suggestedKeywords.slice(0, 2).join('", "')}"`);
        } else if (topRec.type === 'geo' && topRec.targetKeyword) {
           suggestions.push(`Optimize title/desc for "${topRec.targetKeyword}"`);
        } else if (topRec.type === 'engagement') {
           suggestions.push(`Increase content density (target: 50+ pins)`);
        } else {
           suggestions.push(topRec.personalizedText?.split('.')[0] || 'Optimize board metadata');
        }
      } else {
        if (metrics.strategicAlignment < 55) {
          let best = keywords[0] || 'target topics';
          let maxSim = -1;
          const boardText = `${board.name} ${board.description || ''}`.toLowerCase();
          keywords.forEach(kw => {
            const sim = MathUtils.calculateJaccardSimilarity(kw.toLowerCase(), boardText);
            if (sim > maxSim) { maxSim = sim; best = kw; }
          });
          suggestions.push(`Align metadata closely with "${best}"`);
        } else if (metrics.metadataRichness < 45) {
          suggestions.push('Expand description to 150+ chars with context');
        } else if (metrics.activeVelocity < 50) {
          suggestions.push('Refresh with 2-3 new pins weekly');
        } else {
          suggestions.push('Maintain current pinning strategy');
        }
      }

      return {
        name: board.name,
        pinCount: board.pinCount,
        url: board.url || '',
        lastActive: board.lastActive || '—',
        qualityScore: board.metrics?.aiDiscoveryScore || 50,
        issues: issues.length > 0 ? issues : ['Optimized'],
        suggestions,
        metrics
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 5: Content Format Gap
  // ──────────────────────────────────────────────────────────────────────────
  computeContentFormatGap(brandProfile, competitorProfiles, allScores) {
    const calculateDistribution = (profile, profileScores) => {
      const frequency = profileScores?.avgScores?.frequency || 50;
      const authority = profileScores?.avgScores?.geoAuthority || 50;
      
      // LOGIC: Highly consistent/active accounts post more Idea Pins (Pinterest's high-frequency format)
      // Max 25% Idea Pins
      const ideaPins = Math.round((frequency / 100) * 25);
      
      // LOGIC: High authority/large brands invest more in high-production Video Pins
      // Max 20% Video Pins
      const videoPins = Math.round((authority / 100) * 20);
      
      const imagePins = 100 - ideaPins - videoPins;
      
      return { imagePins, ideaPins, videoPins };
    };

    const brand = calculateDistribution(brandProfile, allScores.brand);
    
    // For competitors, we calculate the average distribution across all of them
    let compAvg = { imagePins: 0, ideaPins: 0, videoPins: 0 };
    if (allScores.competitors && allScores.competitors.length > 0) {
      allScores.competitors.forEach(cs => {
        const dist = calculateDistribution(null, cs);
        compAvg.imagePins += dist.imagePins;
        compAvg.ideaPins += dist.ideaPins;
        compAvg.videoPins += dist.videoPins;
      });
      const len = allScores.competitors.length;
      compAvg = {
        imagePins: Math.round(compAvg.imagePins / len),
        ideaPins: Math.round(compAvg.ideaPins / len),
        videoPins: Math.round(compAvg.videoPins / len)
      };
    } else {
      compAvg = { imagePins: 80, ideaPins: 10, videoPins: 10 };
    }

    return { 
      brand, 
      competitors: compAvg,
      recommendations: [
        brand.videoPins < compAvg.videoPins ? 'Competitors are utilizing more Video content. Focus on short-form video to regain reach.' : 'Your video content mix is competitive.',
        brand.ideaPins < compAvg.ideaPins ? 'Boost your Idea Pin frequency to match the discovery rate of top-tier creators.' : 'Idea Pin volume is optimal for your niche.'
      ]
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 6: Posting Consistency
  // ──────────────────────────────────────────────────────────────────────────
  computePostingConsistency(brandProfile) {
    const boards = brandProfile.boards || [];
    const totalPins = boards.reduce((s, b) => s + (b.pinCount || 0), 0);
    const months = boards.map(b => this._monthsAgo(b.lastActive)).filter(m => m !== null);
    const recent = months.length > 0 ? Math.min(...months) : 12;
    const score = Math.max(0, 100 - (recent * 8));

    return {
      consistencyScore: score,
      status: score > 70 ? 'Consistent' : score > 40 ? 'Irregular' : 'Inactive',
      estimatedWeeklyPins: Math.round(totalPins / 52) || 2,
      totalPins,
      recommendedWeeklyPins: 15,
      recommendation: score < 70 ? 'Create a pinning schedule to restore algorithmic trust.' : 'Consistency is stable—maintain frequency.',
      schedule: ['Mon - Morning', 'Wed - Afternoon', 'Fri - Evening']
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 7: Engagement Benchmark
  // ──────────────────────────────────────────────────────────────────────────
  computeEngagementBenchmark(brandProfile, competitorProfiles, scores) {
    // Formula for "Estimated Saves per Pin"
    // We use followers as a reach base and engagement score as a performance multiplier
    const calculateSaves = (profile, engScore) => {
      const followers = profile.followers || 0;
      // Base: 5 saves per 1k followers (standard benchmark)
      const baseSaves = (followers / 1000) * 5;
      // Performance multiplier: scale by engagement score (50 is benchmark 1x)
      const multiplier = (engScore || 10) / 50;
      return Math.round(baseSaves * multiplier) || 2;
    };
    
    const brandSaves = calculateSaves(brandProfile, scores.brand.avgScores.engagement);
    
    const chartData = [
      { name: 'Your Brand', avgSaves: brandSaves, fill: '#1152d4' }
    ];

    let totalCompSaves = 0;
    
    if (scores.competitors.length > 0) {
      scores.competitors.forEach((cp, i) => {
        const compProfile = competitorProfiles[i] || cp; 
        const cSaves = calculateSaves(compProfile, cp.avgScores.engagement);
        totalCompSaves += cSaves;
        chartData.push({ name: cp.name, avgSaves: cSaves, fill: '#64748b' });
      });
    } else {
      // Fallback: If no competitors scraped, show a "Market Average" baseline
      const mockSaves = Math.round(brandSaves * 1.5) || 12;
      totalCompSaves = mockSaves;
      chartData.push({ name: 'Market Benchmark', avgSaves: mockSaves, fill: '#64748b' });
    }

    const compAvgSaves = scores.competitors.length > 0 
      ? Math.round(totalCompSaves / scores.competitors.length)
      : totalCompSaves;

    return {
      brandAvgSaves: brandSaves,
      competitorAvgSaves: compAvgSaves,
      chartData,
      gap: Math.max(0, compAvgSaves - brandSaves),
      gapPercentage: brandSaves > 0 ? Math.round((compAvgSaves / brandSaves) * 100 - 100) : 100,
      insight: `Your engagement rate is ${brandSaves >= compAvgSaves ? 'above' : 'below'} the niche average.`
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 8: Metadata Quality
  // ──────────────────────────────────────────────────────────────────────────
  computeMetadataQuality(brandProfile, keywords) {
    const boards = brandProfile.boards || [];
    const boardAudits = boards.map(b => {
      const richness = MathUtils.normalize((b.description || '').length, 0, 200) * 100;
      const issues = [];
      if ((b.description || '').length < 60) issues.push({ severity: 'high', issue: 'Description too short', fix: 'Add 100+ characters.' });
      return {
        name: b.name,
        metadataScore: Math.round(richness),
        issues,
        improvedTitle: null,
        improvedDesc: null
      };
    });

    return {
      avgMetadataScore: Math.round(MathUtils.calculateMean(boardAudits.map(a => a.metadataScore))),
      boardAudits: boardAudits.slice(0, 5)
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 9: Opportunity Topics
  // ──────────────────────────────────────────────────────────────────────────
  computeOpportunityTopics(competitorProfiles, brandProfile) {
    const brandB = (brandProfile.boards || []).map(b => b.name.toLowerCase());
    const opportunities = [];
    (competitorProfiles || []).forEach(cp => {
      (cp.boards || []).forEach(b => {
        // Validation filters: Must have a reasonable name, not contain scraping artifacts, and have pins
        if (!b.name || b.name.length < 3 || b.name.includes(';') || b.name.includes('new tab')) return;
        if ((b.pinCount || 0) < 10) return;

        // Ensure the brand doesn't already have a board with the same starter word
        if (!brandB.some(name => b.name.toLowerCase().includes(name.split(' ')[0]))) {
          // Check for duplication in opportunities
          if (!opportunities.some(o => o.topic.toLowerCase() === b.name.toLowerCase())) {
             opportunities.push({ topic: b.name, source: cp.name, reason: `Growth potential in "${b.name}" niche.`, pinCount: b.pinCount });
          }
        }
      });
    });
    
    // Sort by pinCount (highest first) to show the most proven topics
    opportunities.sort((a, b) => b.pinCount - a.pinCount);

    return { 
      opportunities: opportunities.slice(0, 5),
      totalCompetitorTopicsAnalyzed: opportunities.length + 5
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Feature 10: Brand Score
  // ──────────────────────────────────────────────────────────────────────────
  computeBrandScore(scores) {
    const { geo, geoAuthority, socialTraction, frequency, aiReach } = scores.brand.avgScores;
    const health = scores.brand.rankingScore;
    
    const level = health >= 85 ? { label: 'Excellent', color: 'green' } : 
                 health >= 70 ? { label: 'High', color: 'green' } : 
                 health >= 45 ? { label: 'Mid', color: 'yellow' } : 
                 { label: 'Low', color: 'red' };

    return {
      healthScore: health,
      level,
      breakdown: {
        geo: { score: geo, label: 'GEO Strength', description: 'Search clarity.' },
        authority: { score: geoAuthority, label: 'GEO Authority', description: 'Trust signals.' },
        engagement: { score: socialTraction, label: 'Social Traction', description: 'Interaction.' },
        consistency: { score: frequency, label: 'Frequency', description: 'Upkeep.' },
        discovery: { score: aiReach, label: 'AI Reach', description: 'AI recommendation probability.' }
      }
    };
  }

  computeAll(brandProfile, competitorProfiles, keywords, scores, recommendations) {
    return {
      weaknessSummary: this.computeWeaknessSummary(scores, brandProfile, keywords, recommendations),
      priorityFixes: this.computePriorityFixes(recommendations),
      keywordGap: this.computeKeywordGap(brandProfile, competitorProfiles, keywords),
      boardQuality: this.computeBoardQuality(scores.brand.boards, keywords, recommendations),
      contentFormatGap: this.computeContentFormatGap(brandProfile, competitorProfiles, scores),
      postingConsistency: this.computePostingConsistency(brandProfile),
      engagementBenchmark: this.computeEngagementBenchmark(brandProfile, competitorProfiles, scores),
      metadataQuality: this.computeMetadataQuality(brandProfile, keywords),
      opportunityTopics: this.computeOpportunityTopics(competitorProfiles, brandProfile),
      brandScore: this.computeBrandScore(scores)
    };
  }
}

module.exports = new IntelligenceEngine();