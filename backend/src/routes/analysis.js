const express = require('express');
const router = express.Router();
const { v4: uuidv4, validate } = require('uuid');
const AnalysisService = require('../services/analysisService');
const ExportService = require('../services/exportService');

// In-memory storage with TTL
const analysisStore = new Map();
const TTL_SECONDS = 24 * 60 * 60;

// Cleanup expired analyses
const cleanupExpired = () => {
  const now = Date.now();
  for (const [id, analysis] of analysisStore.entries()) {
    const age = (now - new Date(analysis.createdAt).getTime()) / 1000;
    if (age > TTL_SECONDS) analysisStore.delete(id);
  }
};

// Start new analysis
router.post('/start', async (req, res, next) => {
  try {
    const { brandUrl, competitorUrls, keywords } = req.body;

    if (!brandUrl?.trim()) {
      const error = new Error('Brand URL is required');
      error.status = 400;
      return next(error);
    }
    
    if (!Array.isArray(competitorUrls) || competitorUrls.length === 0) {
      const error = new Error('At least one competitor URL required');
      error.status = 400;
      return next(error);
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      const error = new Error('Keywords required');
      error.status = 400;
      return next(error);
    }

    cleanupExpired();
    const analysisId = uuidv4();
    const analysis = {
      id: analysisId,
      brandUrl: brandUrl.trim(),
      competitorUrls: competitorUrls.map(url => url.trim()).slice(0, 5),
      keywords: keywords.map(kw => kw.trim()).slice(0, 20),
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    analysisStore.set(analysisId, analysis);

    AnalysisService.runAnalysis(analysisId, analysis, analysisStore)
      .catch(err => {
        console.error(`Analysis ${analysisId} failed:`, err);
        const failedAnalysis = analysisStore.get(analysisId);
        if (failedAnalysis) {
          failedAnalysis.status = 'failed';
          failedAnalysis.error = err.message;
          failedAnalysis.updatedAt = new Date().toISOString();
        }
      });

    res.status(202).json({ analysisId, status: 'started' });

  } catch (error) {
    error.status = error.status || 500;
    next(error);
  }
});

// Status endpoint
router.get('/:id/status', (req, res, next) => {
  try {
    cleanupExpired();
    const analysisId = req.params.id;
    
    // Proper UUID validation
    if (!validate(analysisId)) {
      const error = new Error('Invalid analysis ID');
      error.status = 400;
      return next(error);
    }

    const analysis = analysisStore.get(analysisId);
    if (!analysis) {
      const error = new Error('Analysis not found or expired');
      error.status = 404;
      return next(error);
    }

    res.json({
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      currentStep: analysis.currentStep,
      createdAt: analysis.createdAt,
      completedAt: analysis.completedAt
    });

  } catch (error) {
    next(error);
  }
});

// Results endpoint
router.get('/:id/results', (req, res, next) => {
  try {
    cleanupExpired();
    const analysisId = req.params.id;
    
    if (!validate(analysisId)) {
      const error = new Error('Invalid analysis ID');
      error.status = 400;
      return next(error);
    }

    const analysis = analysisStore.get(analysisId);
    if (!analysis) {
      const error = new Error('Analysis not found');
      error.status = 404;
      return next(error);
    }

    if (analysis.status !== 'completed') {
      const error = new Error('Analysis not ready');
      error.status = 400;
      return next(error);
    }

    res.json(analysis.results);

  } catch (error) {
    next(error);
  }
});

/**
 * Calculate scores for pre-scraped data
 * POST /api/analysis/calculate
 */
router.post('/calculate', async (req, res, next) => {
  try {
    const { brandProfile, competitorProfiles, keywords } = req.body;

    if (!brandProfile || !brandProfile.boards) {
      const error = new Error('Brand profile with boards is required');
      error.status = 400;
      return next(error);
    }

    if (!Array.isArray(competitorProfiles)) {
      const error = new Error('Competitor profiles array is required');
      error.status = 400;
      return next(error);
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      const error = new Error('Keywords required for calculation');
      error.status = 400;
      return next(error);
    }

    const results = await AnalysisService.runCalculationsOnly(brandProfile, competitorProfiles, keywords);
    
    res.json(results);

  } catch (error) {
    error.status = 400;
    next(error);
  }
});

// Export endpoints
router.get('/:id/export/csv', (req, res, next) => {
  try {
    cleanupExpired();
    const analysisId = req.params.id;
    
    if (!validate(analysisId)) {
      const error = new Error('Invalid analysis ID');
      error.status = 400;
      return next(error);
    }

    const analysis = analysisStore.get(analysisId);
    if (!analysis?.results) {
      const error = new Error('Analysis not found');
      error.status = 404;
      return next(error);
    }

    const csv = ExportService.generateCSV(analysis.results);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pinterest-analysis-${analysisId}.csv"`
    });
    res.send(csv);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
