'use strict';

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

/**
 * Amazon Bedrock Service — Nova Lite / Pro / Micro
 *
 * Auth priority:
 *   1. IAM role attached to ECS task (production — no keys needed)
 *   2. AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars (local dev)
 *
 * Model IDs use cross-region inference profile prefix ("us.") so on-demand
 * throughput is routed across US regions automatically.
 */
class AmazonBedrockService {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';

    // SDK resolves credentials automatically:
    //   ECS task role → env vars → ~/.aws/credentials
    this.client = new BedrockRuntimeClient({ region: this.region });

    this.modelId      = process.env.AWS_NOVA_LITE_ID  || 'us.amazon.nova-lite-v1:0';
    this.proModelId   = process.env.AWS_NOVA_PRO_ID   || 'us.amazon.nova-pro-v1:0';
    this.microModelId = process.env.AWS_NOVA_MICRO_ID || 'us.amazon.nova-micro-v1:0';

    // Probe credentials once at startup
    this.enabled = !!(
      process.env.AWS_ACCESS_KEY_ID ||   // local dev
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI || // ECS task role
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE               // IRSA / WebIdentity
    );
  }

  // ── Core invoke ────────────────────────────────────────────────────────────
  async complete(systemPrompt, userPrompt, maxTokens = 512, options = {}) {
    if (!this.enabled) return this._fallback(systemPrompt, userPrompt);

    const payload = {
      inferenceConfig: {
        max_new_tokens: maxTokens,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.9,
      },
      system: [{ text: systemPrompt }],
      messages: [{ role: 'user', content: [{ text: userPrompt }] }],
    };

    try {
      const command = new InvokeModelCommand({
        modelId: options.modelId || this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);
      const body = JSON.parse(new TextDecoder().decode(response.body));
      return body?.output?.message?.content?.[0]?.text?.trim() ?? this._fallback(systemPrompt, userPrompt);
    } catch (error) {
      console.error('Bedrock invoke error:', error.message);
      return this._fallback(systemPrompt, userPrompt);
    }
  }

  // ── Multimodal: Pinterest profile screenshot → Nova vision ────────────────
  async analyzeProfileScreenshot(screenshotBase64, profileContext) {
    if (!this.enabled) return null;

    const payload = {
      inferenceConfig: { max_new_tokens: 300 },
      messages: [{
        role: 'user',
        content: [
          { image: { format: 'png', source: { bytes: screenshotBase64 } } },
          { text: `Analyze this Pinterest profile screenshot for "${profileContext}". Identify visual branding consistency, top performing board themes, and overall GEO layout quality. Return 3 bullet points of strategic advice.` },
        ],
      }],
    };

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });
      const response = await this.client.send(command);
      const body = JSON.parse(new TextDecoder().decode(response.body));
      return body?.output?.message?.content?.[0]?.text ?? null;
    } catch (error) {
      console.error('Nova multimodal error:', error.message);
      return null;
    }
  }

  // ── Higher-level helpers ───────────────────────────────────────────────────
  async explainHealthScore(healthScore, breakdown, profileName) {
    if (healthScore == null) return null;
    return this.complete(
      'You are a Pinterest GEO consultant. Write exactly 2 sentences: one on overall status, one on the weakest component. Use simple language.',
      `Profile: "${profileName}". Score: ${healthScore}/100. GEO Content: ${breakdown?.geo?.score || 0}, Authority: ${breakdown?.authority?.score || 0}, Engagement: ${breakdown?.engagement?.score || 0}.`,
      200
    );
  }

  async generateContentStrategy(brandData, topKeywords) {
    return this.complete(
      'You are a Pinterest strategist. Give exactly 3 numbered, specific GEO content tips. Each tip is 1 sentence.',
      `Brand: "${brandData?.name || 'Your Brand'}". Keywords: ${(topKeywords || []).slice(0, 3).join(', ')}.`,
      300
    );
  }

  async generateAdvancedSummary(scores, brandProfile, keywords) {
    const s = scores?.summary || {};
    return this.complete(
      'You are a Pinterest GEO consultant. Write a 3-sentence executive summary: (1) status, (2) strength, (3) priority fix.',
      `Brand: "${brandProfile?.name || 'Your Brand'}". GEO: ${s.avgGEOScore}, Eng: ${s.avgEngagementScore}, Consist: ${s.avgConsistencyScore}. Keywords: ${(keywords || []).slice(0, 5).join(', ')}.`,
      400
    );
  }

  // ── Fallback (no AWS creds) ────────────────────────────────────────────────
  _fallback(system, user) {
    const text = (system + ' ' + user).toLowerCase();
    if (text.includes('strategy')) return 'Focus on high-frequency niche keywords and consistent branding.';
    return 'Analysis pending AWS configuration.';
  }

  getStatus() {
    return {
      enabled: this.enabled,
      region: this.region,
      modelId: this.modelId,
    };
  }
}

module.exports = new AmazonBedrockService();
