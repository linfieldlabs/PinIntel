export const SAMPLE_DATA = {
  analyzedAt: new Date().toISOString(),
  brandProfile: {
    username: 'sample_brand',
    name: 'Sample Fashion Brand',
    followers: 12500,
  },
  leaderboard: [
    { rank: 1, name: 'Vogue Magazine', followers: 5200000, boardCount: 85, engagementMetric: 450000 },
    { rank: 2, name: 'Harper\'s Bazaar', followers: 2100000, boardCount: 62, engagementMetric: 280000 },
    { rank: 3, name: 'Sample Fashion Brand', followers: 12500, boardCount: 12, engagementMetric: 15600, isBrand: true },
    { rank: 4, name: 'Style Co', followers: 98000, boardCount: 24, engagementMetric: 12000 },
  ],
  intelligence: {
    brandScore: 68,
    weaknessSummary: [
      { score: 42, label: 'Content Type Mix', status: 'Needs Improvement', color: 'red' },
      { score: 55, label: 'SEO Metadata', status: 'Moderate', color: 'yellow' },
      { score: 82, label: 'Board Authority', status: 'Strong', color: 'green' }
    ],
    priorityFixes: [
      { rank: 1, fix: 'Increase Video Pin frequency', impact: 'High', effort: 'Medium', rationale: 'Competitors use 2x more video content.', example: 'Upload at least 3 video pins per week to high-authority boards.', boardName: 'Summer Collections' },
      { rank: 2, fix: 'Optimize board descriptions with high-volume keywords', impact: 'High', effort: 'Low', rationale: 'Several boards lack search-optimized descriptions.', example: 'Add "minimalist fashion trends" and "capsule wardrobe" to metadata.', boardName: 'Everyday Style' },
      { rank: 3, fix: 'Standardize board titles', impact: 'Medium', effort: 'Low', rationale: 'Consistency helps algorithmic categorization.', example: 'Use "Style | [Name]" format for all boards.', boardName: 'Global' }
    ],
    engagementBenchmark: {
      chartData: [
        { name: 'Your Brand', avgSaves: 12, fill: '#1152d4' },
        { name: 'Vogue', avgSaves: 48, fill: '#64748b' },
        { name: 'Harper\'s', avgSaves: 35, fill: '#64748b' },
        { name: 'Style Co', avgSaves: 15, fill: '#64748b' },
      ],
      brandAvgSaves: 12,
      competitorAvgSaves: 32,
      gap: 20,
      gapPercentage: 62,
      insight: 'Your engagement is lagging behind niche leaders by 62%. Increasing video content is the fastest path to bridge this gap.'
    },
    keywordGap: {
      brandKeywordCount: 12,
      totalTargetKeywords: 45,
      missingKeywords: [
        { keyword: 'sustainable fabrics', recommendation: 'Include this in your Eco-Fashion board metadata.', competitorUsage: 8 },
        { keyword: 'capsule wardrobe 2026', recommendation: 'Create a new board targeting this specific trend.', competitorUsage: 5 },
        { keyword: 'street style inspiration', recommendation: 'Add this to 4 of your top-performing boards.', competitorUsage: 12 }
      ]
    },
    contentFormatGap: {
      brand: { imagePins: 85, ideaPins: 5, videoPins: 10 },
      competitors: { imagePins: 60, ideaPins: 15, videoPins: 25 },
      recommendations: [
        'Competitors are utilizing more Video content. Focus on short-form video to regain reach.',
        'Boost your Idea Pin frequency to match the discovery rate of top-tier creators.'
      ]
    },
    postingConsistency: {
      consistencyScore: 58,
      status: 'Moderate',
      estimatedWeeklyPins: 5,
      recommendedWeeklyPins: 15,
      totalPins: 450,
      recommendation: 'Increase posting frequency to at least 15 pins per week to stay relevant in the algorithm.',
      schedule: ['Mon', 'Wed', 'Fri']
    },
    boardQuality: [
      { name: 'Summer Outfits', qualityScore: 82, pinCount: 124, issues: [], suggestions: ['Keep up the great metadata!'] },
      { name: 'Shoe Trends', qualityScore: 45, pinCount: 56, issues: ['Thin metadata', 'Lower keyword density'], suggestions: ['Expand description to 300+ characters'] },
      { name: 'Style Gems', qualityScore: 32, pinCount: 89, issues: ['Poor keyword alignment', 'Dated content'], suggestions: ['Rename to "Minimalist Style 2026"'] }
    ],
    metadataQuality: {
      avgMetadataScore: 61,
      boardAudits: [
        { name: 'Everyday Style', metadataScore: 78, issues: [], improvedTitle: 'Everyday Style | Minimalist Outfits', improvedDesc: 'Discover the latest in everyday minimalist style and capsule wardrobe essentials.' },
        { name: 'Evening Wear', metadataScore: 42, issues: [{ severity: 'high', issue: 'Missing description', fix: 'Add a search-optimized description.' }], improvedTitle: 'Evening Wear Trends 2026', improvedDesc: 'Curated collection of formal evening wear, dresses, and high-fashion gala inspiration.' }
      ]
    },
    opportunityTopics: [
      { topic: 'Retro Futurnism', saturation: 'Low', growth: '45%', recommendation: 'High potential for new board creation.' },
      { topic: 'Office Minimalist', saturation: 'Medium', growth: '12%', recommendation: 'Optimize existing "Workwear" board.' }
    ]
  },
  scores: {
    brand: { avgScores: { frequency: 58, geoAuthority: 65 } },
    competitors: [
      { avgScores: { frequency: 82, geoAuthority: 78 } }
    ]
  },
  keywords: [],
  competitorProfiles: []
};
