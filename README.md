# PinIntel Pro

PinIntel Pro is a specialized analytics and intelligence platform designed for Pinterest board management and competitive strategy. The system automates the process of gathering market data, calculating performance metrics, and generating strategic recommendations for organic growth.

## Project Description

The platform provides a comprehensive audit of Pinterest profiles and boards. It is designed for agencies and brands that need to move beyond basic native analytics into "Generative Engine Optimization" (GEO). By analyzing profile authority, keyword alignment, and posting consistency, the tool helps users understand how their content is positioned within the Pinterest algorithm relative to their competitors.

## Core Methodology

The system operates through three primary layers:

1. Data Acquisition (Scraping):
   The backend utilizes a Playwright-based scraper to collect real-time data from Pinterest. It employs a multi-tiered approach to ensure reliability:

- API Interception: Captures data directly from internal Pinterest responses.
- DOM Parsing: Extracts information from the page structure as a fallback.
- OCR (Optical Character Recognition): Uses Tesseract.js to interpret data from screenshots when high-level anti-scraping measures are encountered.

2. Scoring Engine:
   The raw data is processed through a proprietary scoring engine that evaluates 25 distinct metrics. These metrics measure engagement velocity, semantic depth, and account authority.

3. Intelligence Engine:
   The intelligence layer translates scores into actionable strategy. It predicts posting frequency, identifies content format gaps, and benchmarks engagement averages against market standards to provide personalized growth playbooks.

## System Requirements

Technical prerequisites for running PinIntel Pro:

- Node.js: Version 18.x or higher (LTS recommended).
- npm: Standard package manager included with Node.js.
- Operating System: Compatible with Windows, macOS, and Linux.
- Web Browser: Playwright requires Chromium installation for backend operations.

## Installation and Setup

### 1. Repository Initialization

Clone the repository and enter the project directory:

```bash
git clone https://github.com/linfieldlabs/PinIntel.git
cd pinterest-board-intelligence
```

### 2. Backend Installation

Navigate to the backend directory and install the necessary dependencies:

```bash
cd backend
npm install
npx playwright install chromium
```

Create a .env file in the backend root and define the following:

- PORT=5000
- GROQ_API_KEY=your_optional_api_key (for AI-driven insights)

### 3. Frontend Installation

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

## Running the Application

Both servers must be running simultaneously for the application to function correctly.

### Start the Backend Server

```bash
cd backend
npm start
```

The backend API initializes on http://localhost:5000.

### Start the Frontend Interface

```bash
cd frontend
npm start
```

The frontend interface will open on http://localhost:3000 (standard React/Vite port).

## Project Structure

- /backend: Express.js server and data processing logic.
- /backend/src/services: Playwright scraper and external API integrations.
- /backend/src/ai: Scoring and intelligence algorithms.
- /frontend: React/Vite application.
- /frontend/src/pages: Component-based dashboard and landing views.

---

Technical documentation for PinIntel Pro Intelligence Platform.
