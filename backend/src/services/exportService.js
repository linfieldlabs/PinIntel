'use strict';

/**
 * Export Service  ─  v2 (accuracy + bugfix rewrite)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes:
 *   • results.keywords → results.metadata.keywords  (correct storage path)
 *   • generateJSON: same keywords path fix
 *   • Board cap aligned to MAX_BOARDS = 10
 *   • generateTSV: brand score found by isBrand flag, not rank-1 assumption
 *   • All GEO field names match the updated scoringEngine / intelligenceEngine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MAX_BOARDS = 10;

class ExportService {

  // ──────────────────────────────────────────────────────────────────────────
  //  CSV  (RFC 4180 compliant)
  // ──────────────────────────────────────────────────────────────────────────
  generateCSV(results) {
    // FIX: keywords live at results.metadata.keywords
    const keywords = (results.metadata?.keywords || []).join(', ') || 'N/A';
    const lines    = [];

    // ── Header ───────────────────────────────────────────────────────────────
    lines.push('Pinterest GEO Intelligence Report');
    lines.push(`Analysis ID: ${results.metadata?.analysisId || 'N/A'}`);
    lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
    lines.push(`Keywords: ${keywords}`);
    lines.push('='.repeat(60));
    lines.push('');

    // ── Performance Summary ───────────────────────────────────────────────────
    const summary = results.scores?.summary || {};
    const brand   = results.scores?.brand   || {};

    lines.push('=== PERFORMANCE SUMMARY ===');
    lines.push('Metric,Value,Status');
    lines.push(`Brand,${this.e(results.brandProfile?.name || 'N/A')},`);
    lines.push(`Total Boards,${Math.min(results.brandProfile?.boards?.length || 0, MAX_BOARDS)},`);
    lines.push(`Followers,${(results.brandProfile?.followers || 0).toLocaleString()},`);
    lines.push(`Overall Health,${results.intelligence?.brandScore?.healthScore || 0},${this.scoreStatus(results.intelligence?.brandScore?.healthScore)}`);
    lines.push(`GEO Strength,${results.scores?.summary?.avgGEOScore || 0},${this.scoreStatus(results.scores?.summary?.avgGEOScore)}`);
    lines.push(`AI Discovery,${results.intelligence?.brandScore?.breakdown?.discovery?.score || 0},${this.scoreStatus(results.intelligence?.brandScore?.breakdown?.discovery?.score)}`);
    lines.push(`Social Traction,${results.scores?.summary?.avgEngagementScore || 0},${this.scoreStatus(results.scores?.summary?.avgEngagementScore)}`);
    lines.push(`Consistency Index,${results.scores?.summary?.avgConsistencyScore || 0},${this.scoreStatus(results.scores?.summary?.avgConsistencyScore)}`);
    lines.push('');

    // ── Competitive Ranking ───────────────────────────────────────────────────
    lines.push('=== COMPETITIVE RANKING ===');
    lines.push('Rank,Brand,GEO Avg,Engagement Avg,Consistency Avg,GEO Authority,Total Pins,Followers,Ranking Score');
    (results.leaderboard || []).forEach(item => {
      lines.push([
        item.rank,
        item.name,
        item.avgGEO           || 0,
        item.avgEngagement    || 0,
        item.avgConsistency   || 0,
        item.geoAuthorityScore || 0,
        item.totalPins        || 0,
        item.followers        || 0,
        item.rankingScore     || 0
      ].map(v => this.e(v)).join(','));
    });
    lines.push('');

    // ── Brand Boards  (capped at MAX_BOARDS) ─────────────────────────────────
    lines.push('=== BRAND BOARDS ===');
    lines.push('Board Name,GEO Score,Engagement,Consistency,Overall,GEO Alignment,AI Discovery,Pin Count,Last Active');
    const brandBoards = (results.scores?.brand?.boards || []).slice(0, MAX_BOARDS);
    brandBoards
      .sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))
      .forEach(board => {
        lines.push([
          board.name,
          board.scores?.geo         || 0,
          board.scores?.engagement  || 0,
          board.scores?.consistency || 0,
          board.scores?.overall     || 0,
          board.metrics?.strategicAlignment || 0,
          board.metrics?.aiDiscoveryScore   || 0,
          board.pinCount            || 0,
          board.lastActive          || '—'
        ].map(v => this.e(v)).join(','));
      });
    lines.push('');

    // ── Recommendations ───────────────────────────────────────────────────────
    lines.push('=== ACTIONABLE RECOMMENDATIONS ===');
    lines.push('Priority,Board Name,Type,Impact,Effort,Recommendation');
    (results.recommendations || []).slice(0, 12).forEach(rec => {
      lines.push([
        rec.priority || '-',
        rec.boardName || 'General',
        rec.type      || 'general',
        rec.impact    || 'Medium',
        rec.effort    || 'Medium',
        rec.personalizedText || rec.recommendation || 'Optimise board'
      ].map(v => this.e(v)).join(','));
    });
    lines.push('');

    // ── Keyword Gap ───────────────────────────────────────────────────────────
    lines.push('=== KEYWORD OPPORTUNITIES ===');
    lines.push('Missing Keyword,Competitor Usage,Recommendation');
    const keywordGap = results.intelligence?.keywordGap || {};
    (keywordGap.missingKeywords || []).slice(0, 10).forEach(kw => {
      lines.push([
        kw.keyword,
        kw.competitorUsage ?? 'N/A',
        kw.recommendation  || ''
      ].map(v => this.e(v)).join(','));
    });
    lines.push('');

    // ── Metadata Quality ──────────────────────────────────────────────────────
    lines.push('=== METADATA QUALITY BY BOARD ===');
    lines.push('Board Name,Metadata Score,Description Length,Issues Count');
    (results.intelligence?.metadataQuality?.boardAudits || []).forEach(audit => {
      lines.push([
        audit.name,
        audit.metadataScore       || 0,
        audit.currentDescLength   || 0,
        (audit.issues || []).length
      ].map(v => this.e(v)).join(','));
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('Generated by Pinterest GEO Intelligence Engine v2');
    lines.push(`Report completed: ${new Date().toISOString()}`);

    return lines.join('\r\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  JSON export
  //  FIX: results.metadata.keywords (not results.keywords)
  // ──────────────────────────────────────────────────────────────────────────
  generateJSON(results) {
    return JSON.stringify({
      metadata: {
        analysisId:  results.metadata?.analysisId,
        generatedAt: new Date().toISOString(),
        keywords:    results.metadata?.keywords || [],   // FIX
        version:     '2.0'
      },
      summary: {
        brand:              results.brandProfile?.name || 'Unknown',
        totalBoards:        Math.min(results.brandProfile?.boards?.length || 0, MAX_BOARDS),
        followers:          results.brandProfile?.followers || 0,
        healthStatus:       results.scores?.summary?.healthStatus || 'Unknown',
        avgGEOScore:        results.scores?.summary?.avgGEOScore         || 0,
        avgEngagementScore: results.scores?.summary?.avgEngagementScore  || 0,
        avgConsistencyScore:results.scores?.summary?.avgConsistencyScore || 0,
        geoAuthorityScore:  results.scores?.brand?.geoAuthorityScore     || 0
      },
      competitiveRanking:   (results.leaderboard || []),
      topBoards:            (results.scores?.brand?.boards || [])
                              .slice(0, MAX_BOARDS)
                              .sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0)),
      recommendations:      (results.recommendations || []).slice(0, 12),
      keywordOpportunities: results.intelligence?.keywordGap?.missingKeywords || [],
      intelligence:         results.intelligence || {}
    }, null, 2);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  TSV  (tab-separated, Excel-compatible)
  //  FIX: brand score found via isBrand flag, not by assuming rank-1 = brand
  // ──────────────────────────────────────────────────────────────────────────
  generateTSV(results) {
    const lines = [];

    // Find brand entry regardless of rank position
    const brandEntry = (results.leaderboard || []).find(item => item.isBrand);

    lines.push([
      'Pinterest GEO Analysis Summary',
      results.brandProfile?.name || 'Unknown',
      `GEO: ${results.scores?.summary?.avgGEOScore || 0}`,
      `Engagement: ${results.scores?.summary?.avgEngagementScore || 0}`,
      `Brand Rank Score: ${brandEntry?.rankingScore || 0}`   // FIX: correct brand score
    ].map(v => this.e(v)).join('\t'));

    lines.push('');
    lines.push('Rank\tBrand\tIs Brand\tGEO Score\tEngagement\tConsistency\tGEO Authority\tTotal Pins\tFollowers\tRanking Score');

    (results.leaderboard || []).forEach(item => {
      lines.push([
        item.rank,
        item.name,
        item.isBrand ? 'Yes' : 'No',
        item.avgGEO            || 0,
        item.avgEngagement     || 0,
        item.avgConsistency    || 0,
        item.geoAuthorityScore || 0,
        item.totalPins         || 0,
        item.followers         || 0,
        item.rankingScore      || 0
      ].map(v => this.e(v)).join('\t'));
    });

    // Board detail tab
    lines.push('');
    lines.push('Board Name\tGEO Score\tEngagement\tConsistency\tOverall\tPin Count\tLast Active');
    (results.scores?.brand?.boards || []).slice(0, MAX_BOARDS).forEach(b => {
      lines.push([
        b.name,
        b.scores?.geo         || 0,
        b.scores?.engagement  || 0,
        b.scores?.consistency || 0,
        b.scores?.overall     || 0,
        b.pinCount            || 0,
        b.lastActive          || '—'
      ].map(v => this.e(v)).join('\t'));
    });

    return lines.join('\r\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Validate before export
  // ──────────────────────────────────────────────────────────────────────────
  validateResults(results) {
    const required = ['brandProfile', 'scores', 'recommendations', 'leaderboard'];
    const missing  = required.filter(k => !results[k]);
    if (missing.length > 0) {
      throw new Error(`Missing required data for export: ${missing.join(', ')}`);
    }
    return true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** RFC 4180 CSV escape */
  e(value) {
    if (value == null) return '';
    const str = String(value);
    return /["\r\n,\t]|^\s|\s$/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  /** Human-readable score band */
  scoreStatus(score) {
    const s = parseInt(score) || 0;
    if (s >= 80) return 'Excellent';
    if (s >= 65) return 'Good';
    if (s >= 45) return 'Fair';
    return 'Needs Work';
  }
}

module.exports = new ExportService();