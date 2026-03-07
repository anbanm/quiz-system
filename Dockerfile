FROM node:20-alpine

LABEL maintainer="Anban Mestry <anbanm@gmail.com>"
LABEL description="Quiz System - Privacy-first, offline-capable quiz platform"
LABEL version="2.0.0"

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy application files
COPY src/ ./src/
COPY server/ ./server/

# Create non-root user for security
RUN addgroup -g 1001 -S quizuser && \
    adduser -S quizuser -u 1001 -G quizuser

# Create data directory for persistence
RUN mkdir -p /app/data && chown -R quizuser:quizuser /app

USER quizuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "server/index.js"]
