# DentCharts Mobile - Docker Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Git repository set up
- Coolify instance running

## Local Testing

1. **Build and run locally:**
```bash
docker-compose up --build
```

2. **Access the app:**
```
http://localhost:3000
```

3. **Stop the containers:**
```bash
docker-compose down
```

## Environment Variables

Update `.env.production` with your production API URL:
```
REACT_APP_API_URL=https://your-frappe-backend.com
```

Or set it when running:
```bash
REACT_APP_API_URL=https://api.example.com docker-compose up -d
```

## Deploy to Coolify

### Option 1: Using Docker Compose (Recommended)

1. **Push code to Git repository:**
```bash
git add .
git commit -m "Add Docker configuration"
git push origin main
```

2. **In Coolify Dashboard:**
   - Go to "Resources" → "New Application"
   - Select "Docker Compose"
   - Connect your Git repository
   - Select branch (main/master)
   - Coolify will detect `docker-compose.yml`
   
3. **Set Environment Variables in Coolify:**
   ```
   REACT_APP_API_URL=https://your-backend-domain.com
   ```

4. **Configure Domain:**
   - Add your domain (e.g., `app.dentcharts.com`)
   - Enable SSL (automatic with Let's Encrypt)

5. **Deploy:**
   - Click "Deploy"
   - Coolify will build and start your container

### Option 2: Using Dockerfile Only

1. In Coolify, select "Application" instead of "Docker Compose"
2. Build Pack: "Dockerfile"
3. Rest of the steps are the same

## Coolify Configuration

### Ports
- Internal: 80 (nginx)
- External: Will be assigned by Coolify (usually 80/443 with reverse proxy)

### Health Check
Add in Coolify:
- Path: `/`
- Port: 80
- Interval: 30s

### Auto Deploy
Enable "Deploy on Git Push" in Coolify for automatic deployments

## Production Checklist

- [ ] Update `REACT_APP_API_URL` in `.env.production`
- [ ] Ensure backend API has CORS configured for your domain
- [ ] Set up domain in Coolify
- [ ] Enable SSL certificate
- [ ] Test the deployment
- [ ] Set up monitoring (optional)

## Updating the App

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main
```

If auto-deploy is enabled, Coolify will automatically rebuild and redeploy.

## Troubleshooting

### Container won't start
```bash
# Check logs in Coolify or locally
docker-compose logs web
```

### Build fails
```bash
# Build locally to debug
docker build -t dentcharts-mob .
```

### API connection issues
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is accessible from container

## Manual Commands

```bash
# Build image
docker-compose build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```
