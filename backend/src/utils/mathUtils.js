'use strict';

/**
 * MathUtils - Statistical and Normalization Utilities for PinIntel Pro
 */
class MathUtils {
  /**
   * Calculate the mean (average) of an array of numbers
   */
  static calculateMean(values) {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate the median of an array of numbers
   */
  static calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate the standard deviation of an array of numbers
   */
  static calculateStandardDeviation(values) {
    if (!values || values.length < 2) return 0; // StdDev requires at least 2 points
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Jaccard Similarity proxy for Semantic Similarity
   * Measures intersection over union of word sets
   */
  static calculateJaccardSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = new Set(str1.toLowerCase().split(/[\s,.\-!?()]+/).filter(w => w.length > 2));
    const s2 = new Set(str2.toLowerCase().split(/[\s,.\-!?()]+/).filter(w => w.length > 2));
    if (s1.size === 0 || s2.size === 0) return 0;
    
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / union.size;
  }

  /**
   * Normalize a value within a range [min, max] to a scale [0, 1]
   */
  static normalize(value, min, max) {
    if (max === min) return 0.5; // Avoid division by zero
    const clamped = Math.min(Math.max(value, min), max);
    return (clamped - min) / (max - min);
  }

  /**
   * Scale a value logarithmically (base 10) for audience/reach metrics
   */
  static scaleLogarithmic(value, base = 10, maxScale = 100) {
    if (value <= 0) return 0;
    // log10(value) calibrated so 100k followers -> high score
    const logVal = Math.log10(value);
    const score = (logVal / 5) * maxScale; // 10^5 = 100,000
    return Math.min(maxScale, Math.round(score));
  }
  
  /**
   * Calculate Z-Score for a value relative to a distribution
   */
  static calculateZScore(value, mean, stdDev) {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }
}

module.exports = MathUtils;
