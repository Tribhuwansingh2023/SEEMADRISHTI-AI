# SEEMADRISHTI AI — Production Deployment Guide
**Smart India Hackathon (SIH26187) | Team: IQ100**

---

## 1. System Requirements

- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / Windows Server 2022
- **CPU**: Intel Xeon / Core i7+ or AMD Ryzen 7+ (8+ cores recommended)
- **RAM**: 16 GB minimum (32 GB recommended for 9 concurrent 4K feeds)
- **GPU (Optional)**: NVIDIA RTX 3060+ with CUDA 12.1+ for 60 FPS multi-stream acceleration
- **Storage**: Fast NVMe SSD for evidence snapshots and recorded archives

---

## 2. Docker Compose Deployment (Recommended)

To deploy the complete tactical system with one command:

```bash
# 1. Clone repository
git clone https://github.com/Tribhuwansingh2023/SEEMADRISHTI-AI.git
cd SEEMADRISHTI-AI

# 2. Build and launch containers
docker compose up -d --build

# 3. Check container logs
docker compose logs -f seemadrishti-app
```

The application will be live at `http://localhost:3000`.

---

## 3. Bare-Metal Linux / PM2 Deployment

```bash
# Install Node.js 22 & Python 3.10
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs python3-pip ffmpeg libsm6 libxext6

# Install Node dependencies and build frontend
npm ci
npm run build

# Install Python CV dependencies
pip3 install -r cv_service/requirements.txt

# Start with PM2 Process Manager
sudo npm install -g pm2
pm2 start dist/server.cjs --name "seemadrishti-api"
pm2 save
```
