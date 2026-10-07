# =============================================================================
# SEEMADRISHTI AI — Multi-Stage Production Deployment Dockerfile
# Team: IQ100 | SIH Problem Statement: SIH26187
# =============================================================================

# --- Stage 1: Build Frontend Client ---
FROM node:22-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Runtime Production Image ---
FROM node:22-slim AS runner
WORKDIR /app

# Install Python 3, OpenCV & system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    libsm6 \
    libxext6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Setup virtual environment for Python CV service
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy \
    opencv-python-headless \
    torch \
    torchvision \
    ultralytics

# Copy application files
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=client-builder /app/dist ./dist
COPY --from=client-builder /app/public ./public
COPY config ./config
COPY cv_service ./cv_service
COPY server ./server
COPY server.ts ./
COPY yolov8n.pt ./

# Create data directories
RUN mkdir -p /app/data /app/evidence /app/data/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV CV_PORT=8088

EXPOSE 3000 8088

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/ready || exit 1

CMD ["npm", "run", "serve"]
