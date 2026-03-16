require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const analysisRoutes = require('./routes/analysis');
const bedrockService = require('./services/amazonBedrockService');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Security
app.use(helmet());
app.use(cors({
  origin: isProd
    ? process.env.FRONTEND_URL   // e.g. https://d1234.cloudfront.net
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/analysis', analysisRoutes);

// Health check
app.get('/health', (req, res) => {
  const bedrock = bedrockService.getStatus();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    bedrock,
    version: '2.0.0',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
  const bedrock = bedrockService.getStatus();
  console.log(`\n=================================================`);
  console.log(`🚀 PinIntel Pro backend on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Bedrock: ${bedrock.enabled ? `✅ ${bedrock.modelId} (${bedrock.region})` : '❌ No credentials'}`);
  console.log(`=================================================\n`);
});

module.exports = app;
