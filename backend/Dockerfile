FROM node:22-slim

# Playwright/Chromium system deps
RUN apt-get update && apt-get install -y \
    chromium libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Tell Playwright to use the system Chromium (avoids ~300MB download)
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY eng.traineddata ./eng.traineddata

EXPOSE 5000
CMD ["node", "src/server.js"]
