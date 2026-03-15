require('dotenv').config();
const express = require('express');
const cors = require('cors');
const analysisRoutes = require('./routes/analysis');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/analysis', analysisRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    bedrockEnabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    region: process.env.AWS_REGION || 'ap-south-1',
    version: '2.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const bedrockService = require('./services/amazonBedrockService');

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 PinIntel Pro backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  const bedrockStatus = bedrockService.getStatus();
  if (bedrockStatus.enabled) {
    console.log(`✅ AWS Status: KEYS DETECTED`);
    console.log(`📍 Region: ${bedrockStatus.region}`);
    const isPro = bedrockStatus.modelId.includes('pro');
    console.log(`🤖 Model: Amazon Nova ${isPro ? 'Pro' : 'Lite'} (Ready)`);
  } else {
    console.log(`❌ AWS Status: KEYS MISSING`);
    console.log(`⚠️  Note: Amazon Nova will NOT work without AWS_ACCESS_KEY_ID`);
  }
  console.log(`=================================================\n`);
});

module.exports = app;
