# Railway Deployment Guide for NestJS Backend

## 🚀 Quick Deployment Steps

### 1. **Prepare Your Repository**
- Ensure all files are committed to your repository
- Make sure `package.json` has the correct scripts
- Verify `Procfile` exists with `web: npm run start:prod`

### 2. **Deploy to Railway**

#### Option A: Deploy from GitHub Repository
1. Go to [railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect it's a Node.js project

#### Option B: Deploy with Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. **Add Database Service**
1. In Railway dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`

### 4. **Set Environment Variables**
Go to your project → Variables and add:

#### Required Variables:
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

#### Optional Variables:
```
REDIS_URL=redis://username:password@host:port
FRONTEND_URL=https://your-frontend-domain.vercel.app
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
```

### 5. **Run Database Migrations**
After deployment, run:
```bash
railway run npx prisma migrate deploy
```

### 6. **Verify Deployment**
- Check Railway logs for any errors
- Test health endpoint: `https://your-app.railway.app/api/health`
- Test API documentation: `https://your-app.railway.app/api/docs`

## 📁 **Project Structure for Railway**

```
backend_exte/
├── Procfile                 # Railway process file
├── railway.json            # Railway configuration
├── nixpacks.toml          # Build configuration
├── package.json            # Dependencies and scripts
├── dist/                   # Built application
├── src/
│   ├── main.ts            # Application entry point
│   ├── app.module.ts      # Main module
│   └── health/            # Health check endpoints
└── prisma/
    ├── schema.prisma      # Database schema
    └── migrations/        # Database migrations
```

## 🔧 **Configuration Files**

### Procfile
```
web: npm run start:prod
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-9_x']

[phases.install]
cmds = ['npm ci --only=production']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run start:prod'
```

## 🗄️ **Database Setup**

### 1. **Add PostgreSQL Service**
- Railway will automatically provide `DATABASE_URL`
- No manual configuration needed

### 2. **Run Migrations**
```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# Or via Railway dashboard terminal
npx prisma migrate deploy
```

### 3. **Generate Prisma Client**
```bash
railway run npx prisma generate
```

## 🔍 **Monitoring & Debugging**

### Health Endpoints
- **Health Check**: `/api/health`
- **Readiness Check**: `/api/health/ready`

### Railway Logs
```bash
# View logs
railway logs

# Follow logs in real-time
railway logs --follow
```

### Common Issues & Solutions

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Check TypeScript compilation errors

#### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check database service is running
- Run migrations: `npx prisma migrate deploy`

#### Memory Issues
- Railway provides 512MB by default
- Consider upgrading plan for larger applications
- Optimize bundle size

## 🚀 **Production Optimizations**

### Performance
- Enable gzip compression (already configured)
- Use Redis for caching (optional)
- Optimize database queries
- Enable request throttling

### Security
- Set strong JWT secrets
- Configure CORS properly
- Use HTTPS (Railway provides automatically)
- Enable security headers (already configured)

### Monitoring
- Set up health checks
- Monitor application logs
- Track performance metrics
- Set up error reporting

## 📊 **Railway Pricing**

### Free Tier
- $5 credit monthly
- 512MB RAM
- 1GB storage
- Perfect for development/testing

### Pro Plan
- $5/month per service
- 8GB RAM
- 100GB storage
- Production-ready

## 🔗 **Useful Commands**

```bash
# Deploy to Railway
railway up

# View deployment status
railway status

# Open Railway dashboard
railway open

# Connect to database
railway connect

# Run commands in Railway environment
railway run <command>

# View environment variables
railway variables

# Set environment variable
railway variables set KEY=value
```

## ✅ **Deployment Checklist**

- [ ] Repository is ready
- [ ] All dependencies in `package.json`
- [ ] Build process works locally
- [ ] Environment variables configured
- [ ] Database service added
- [ ] Migrations run successfully
- [ ] Health endpoints working
- [ ] CORS configured for frontend
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up

Your NestJS backend is now ready for Railway deployment! 🎉





