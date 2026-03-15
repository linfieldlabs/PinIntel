# PinIntel Pro 🚀

**PinIntel Pro** is an advanced Pinterest Board Intelligence and Competitive Analysis tool. It helps brands and creators optimize their Pinterest presence for "Generative Engine Optimization" (GEO) and AI-driven discovery.

![PinIntel Pro](https://raw.githubusercontent.com/your-repo/pinintel-pro/main/preview.png) *(Note: Add actual screenshot if available)*

## ✨ Features

- **GEO Health Score**: A comprehensive 0-100 score measuring your profile's performance across 5 advanced metrics:
  - GEO Strength (Search clarity)
  - GEO Authority (Trust signals)
  - Social Traction (Interaction)
  - Frequency (Upkeep)
  - AI Reach (Recommendation probability)
- **Board Quality Analyzer**: Automated audit of individual boards identifying technical issues and providing actionable optimization suggestions.
- **Priority Fix Ranking**: A smart list of optimizations sorted by **Impact vs. Effort**, helping you tackle the most important tasks first.
- **Competitive Leaderboard**: Real-time ranking against up to 5 competitors based on engagement and follower growth.
- **Keyword & Topic Gap Analysis**: Discover which keywords and content topics your competitors are winning on that you haven't tapped yet.
- **Content Format Audit**: Analyze the distribution of Image, Idea, and Video pins to match market leaders.
- **AI-Powered Insights**: Executive summaries and strategy recommendations powered by Groq LLM (Llama 3).

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, Playwright (Scraping engine).
- **AI**: Groq API (Llama 3 70B), Custom Scoring & Intelligence Engines.
- **Data**: In-memory storage with TTL (24-hour analysis lifespan).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Groq API Key](https://wow.groq.com/) (Optional, for AI insights)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/pinterest-board-intelligence.git
   cd pinterest-board-intelligence
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   npx playwright install chromium
   ```
   - Create a `.env` file in the `backend` directory based on `.env.example`.
   - Add your `GROQ_API_KEY`.

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```
   The backend will run on [http://localhost:5000](http://localhost:5000).

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on [http://localhost:5173](http://localhost:5173).

## 📂 Project Structure

```text
├── backend
│   ├── src
│   │   ├── ai            # Scoring & Intelligence logic
│   │   ├── routes        # API endpoints
│   │   ├── services      # Scraper, Groq, and Analysis services
│   │   └── server.js     # Express App entry
│   └── .env              # Backend configuration
├── frontend
│   ├── src
│   │   ├── components    # Shared UI components
│   │   ├── pages         # Landing, Setup, and Dashboard views
│   │   └── App.jsx       # Routing logic
│   └── vite.config.js    # Frontend build config
└── README.md             # Project documentation
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with ❤️ for AI Undergraduates and Pinterest Strategists.
