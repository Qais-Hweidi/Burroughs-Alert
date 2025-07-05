# Deployment Guide for Burroughs-Alert

## Overview

Burroughs-Alert requires:

- SQLite database with persistent storage
- Continuous background jobs (scraper, matcher, notifier)
- Puppeteer/Chrome for web scraping
- SMTP email service

## Option 1: Deployment (Render.com + Keep-Alive)

### How It Works

- Render.com provides hosting but sleeps after 15 minutes
- Cron-job.org sends a ping every 10 minutes to keep it awake
- Your app stays responsive 24/7!

### Step-by-Step Deployment

#### Step 1: Deploy to Render.com

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Create Render account** at https://render.com

3. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` file

4. **Configure Environment Variables**

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   GOOGLE_MAPS_API_KEY=your-key-if-you-have-one
   ```

5. **Deploy** - Click "Create Web Service"

6. **Get your URL** - It will be: `https://your-app-name.onrender.com`

#### Step 2: Set Up Keep-Alive Cron Job

1. **Go to** https://cron-job.org/en/

2. **Sign up** for an account

3. **Create a new cron job:**
   - Title: "Keep Burroughs-Alert Awake"
   - URL: `https://your-app-name.onrender.com/api/ping`
   - Schedule: Every 10 minutes
   - Request method: GET
   - Save

4. **Enable the cron job**

#### Step 3: Verify Everything Works

1. **Check your app**: `https://your-app-name.onrender.com`
2. **Check health**: `https://your-app-name.onrender.com/api/health`
3. **Check ping endpoint**: `https://your-app-name.onrender.com/api/ping`
4. **Monitor cron job** in cron-job.org dashboard

## Option 2: Docker Deployment

### Local Testing

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or manually with Docker
docker build -t burroughs-alert .
docker run -p 3000:3000 -v $(pwd)/data:/app/data burroughs-alert
```

### Deploy to Any VPS

1. Install Docker on your server
2. Clone repository
3. Create `.env` file with your credentials
4. Run: `docker-compose up -d`

## Option 3: Self-Hosted VPS

### Ubuntu Server Setup

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install Chrome for Puppeteer
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# 3. Clone and setup
git clone https://github.com/yourusername/burroughs-alert.git
cd burroughs-alert
npm install
npm run build

# 4. Install PM2 for process management
sudo npm install -g pm2

# 5. Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### VPS Providers

- **DigitalOcean**: ~$6-12/month
- **Linode**: ~$5-10/month

## Environment Variables

### Required

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Database (auto-configured on Render)
DATABASE_URL=file:/app/data/app.db
```

### Optional

```bash
# Google Maps for commute time
GOOGLE_MAPS_API_KEY=your-api-key

# Job Configuration
JOBS_ENABLED=true
JOBS_SCRAPER_INTERVAL=45
JOBS_SCRAPER_INITIAL_DELAY=5
JOBS_HEALTH_CHECK_INTERVAL=5
JOBS_CLEANUP_CRON=0 2 * * *
```

## Monitoring

### Health Endpoints

- `/api/health` - Application health
- `/api/jobs` - Job system status
- `/api/ping` - Keep-alive endpoint

### Logs

- **Render**: View in dashboard
- **Docker**: `docker logs container-name`
- **PM2**: `pm2 logs`

## Troubleshooting

### SQLite Issues

- Ensure persistent disk is mounted at `/app/data`
- Check file permissions: `chmod 755 /app/data`

### Puppeteer Issues

- Verify Chrome is installed: `google-chrome --version`
- Check PUPPETEER_EXECUTABLE_PATH environment variable

### Email Issues

- Verify SMTP credentials
- Use Gmail App Password (not regular password)
- Check spam folder for test emails

### Job System Issues

- Check `/api/jobs` endpoint for status
- Verify JOBS_ENABLED=true
- Review logs for error messages

## Security Considerations

1. Use environment variables for all secrets
2. Enable HTTPS (automatic on Render)
3. Regularly update dependencies
4. Monitor for unusual scraping patterns
5. Implement rate limiting if needed

## Summary

1. Deploy to Render.com
2. Set up cron-job.org to ping every 10 minutes
3. Enjoy your 24/7 apartment hunting service!

Your background jobs (scraper, matcher, notifier) will run continuously, SQLite database will persist, and users can access your app anytime at your custom Render URL.
