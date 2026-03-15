'use strict';

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

/**
 * Amazon Bedrock Service  ─  Integration with Amazon Nova Models
 * -----------------------------------------------------------------------------
 * Provides access to Nova Pro, Nova Lite, and Nova Micro via AWS SDK.
 * Used for deep semantic analysis and multimodal insights (vision).
 * -----------------------------------------------------------------------------
 */
class AmazonBedrockService {
  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    this.enabled = !!(this.accessKeyId && this.secretAccessKey);
    
    if (this.enabled) {
      this.client = new BedrockRuntimeClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey
        }
      });
    }

    // Default to Nova Lite as requested
    this.modelId = process.env.AWS_NOVA_LITE_ID || 'amazon.nova-lite-v1:0'; 
    this.proModelId = process.env.AWS_NOVA_PRO_ID || 'amazon.nova-pro-v1:0';
    this.microModelId = process.env.AWS_NOVA_MICRO_ID || 'amazon.nova-micro-v1:0';
  }

  /**
   * Complete a prompt using Nova
   */
  async complete(systemPrompt, userPrompt, maxTokens = 512, options = {}) {
    if (!this.enabled) {
      return this._fallback(systemPrompt, userPrompt);
    }

    const modelId = options.modelId || this.modelId;
    
    // Nova expects messages format similar to Anthropic/OpenAI but in the Bedrock InvokeModel spec
    const payload = {
      inferenceConfig: {
        max_new_tokens: maxTokens,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
      },
      messages: [
        {
          role: 'user',
          content: [
            { text: `System context: ${systemPrompt}\n\nUser request: ${userPrompt}` }
          ]
        }
      ]
    };

    try {
      const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Extract content based on Nova's response format
      if (responseBody.output && responseBody.output.message && responseBody.output.message.content) {
        return responseBody.output.message.content[0].text.trim();
      }
      
      return this._fallback(systemPrompt, userPrompt);
    } catch (error) {
      console.error('Amazon Bedrock Invoke error:', error.message);
      return this._fallback(systemPrompt, userPrompt);
    }
  }

  /**
   * Multimodal Analysis (Image + Text)
   * This is where Nova Pro shines
   */
  async analyzeProfileScreenshot(screenshotBase64, profileContext) {
    if (!this.enabled) return null;

    const payload = {
      inferenceConfig: { max_new_tokens: 300 },
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format: 'png',
                source: { bytes: screenshotBase64 }
              }
            },
            {
              text: `Analyze this Pinterest profile screenshot for "${profileContext}". 
                     Identify visual branding consistency, top performing board themes, and overall GEO layout quality. 
                     Return 3 bullet points of strategic advice.`
            }
          ]
        }
      ]
    };

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (responseBody.output?.message?.content) {
        return responseBody.output.message.content[0].text;
      }
    } catch (error) {
      console.error('Nova Multimodal analysis error:', error.message);
    }
    return null;
  }

  /**
   * Health score explanation
   */
  async explainHealthScore(healthScore, breakdown, profileName) {
    if (healthScore == null) return null;
    const system = `You are a Pinterest GEO consultant. Write exactly 2 sentences: one on overall status, one on the weakest component. Use simple language.`;
    const user = `Profile: "${profileName}". Score: ${healthScore}/100.
GEO Content: ${breakdown?.geo?.score || 0}, Authority: ${breakdown?.authority?.score || 0}, Engagement: ${breakdown?.engagement?.score || 0}. 
Summarize in 2 sentences.`;
    return this.complete(system, user, 200);
  }

  /**
   * Content strategy methodology
   */
  async generateContentStrategy(brandData, topKeywords) {
    const brandName = brandData?.name || 'Your Brand';
    const system = `You are a Pinterest strategist. Give exactly 3 numbered, specific GEO content tips. Each tip is 1 sentence.`;
    const user = `Brand: "${brandName}". Keywords: ${(topKeywords || []).slice(0, 3).join(', ')}. 3 numbered tips.`;
    return this.complete(system, user, 300);
  }

  /**
   * Executive summary
   */
  async generateAdvancedSummary(scores, brandProfile, keywords) {
    const summary = scores?.summary || {};
    const system = `You are a Pinterest GEO consultant. Write a 3-sentence executive summary: (1) status, (2) strength, (3) priority fix.`;
    const user = `Brand: "${brandProfile?.name || 'Your Brand'}". GEO: ${summary.avgGEOScore}, Eng: ${summary.avgEngagementScore}, Consist: ${summary.avgConsistencyScore}. Keywords: ${(keywords || []).slice(0, 5).join(', ')}.`;
    return this.complete(system, user, 400);
  }

  _fallback(system, user) {
    // Simple logic-based fallback if AWS is not configured
    const text = (system + ' ' + user).toLowerCase();
    if (text.includes('strategy')) return 'Focus on high-frequency niche keywords and consistent branding.';
    return 'Analysis pending AWS configuration.';
  }

  getStatus() {
    return {
      enabled: this.enabled,
      region: this.region,
      modelId: this.modelId,
      hasCredentials: !!this.accessKeyId
    };
  }
}

module.exports = new AmazonBedrockService();
