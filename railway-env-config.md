# Railway Environment Variables Configuration

## Required Environment Variables for Railway Deployment

Set these in your Railway dashboard under Project Settings → Variables:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```
**Note**: Railway will automatically provide this when you add a PostgreSQL service.

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### Redis Configuration (Optional - for caching)
```
REDIS_URL=redis://username:password@host:port
```
**Note**: Railway will automatically provide this when you add a Redis service.

### Application Configuration
```
NODE_ENV=production
PORT=3000
```

### CORS Configuration
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### File Upload Configuration
```
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
```

## How to Set Environment Variables in Railway:

1. Go to your Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add each variable with its value
5. Make sure to set them for Production environment

## Database Setup:

### Option 1: Railway PostgreSQL (Recommended)
1. In Railway dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`
4. Run migrations: `npx prisma migrate deploy`

### Option 2: External Database
- Use Railway's PostgreSQL service
- Or connect to external database (Supabase, PlanetScale, etc.)

## Redis Setup (Optional):

### Option 1: Railway Redis
1. In Railway dashboard, click "New Service"
2. Select "Database" → "Redis"
3. Railway will automatically provide `REDIS_URL`

### Option 2: External Redis
- Use Railway's Redis service
- Or connect to external Redis (Upstash, etc.)

## Important Notes:

- **DATABASE_URL**: Railway will provide this automatically when you add PostgreSQL
- **JWT_SECRET**: Generate a strong secret key (32+ characters)
- **PORT**: Railway will set this automatically, but you can override
- **NODE_ENV**: Set to `production` for production deployment
- **FRONTEND_URL**: Set to your deployed frontend URL for CORS

## Security Recommendations:

1. Use strong, unique JWT secrets
2. Enable SSL/TLS in production
3. Set up proper CORS origins
4. Use environment-specific database URLs
5. Enable Redis authentication if using external Redis

## Testing Your Configuration:

After setting variables, test your deployment:
1. Check Railway logs for any errors
2. Test API endpoints
3. Verify database connection
4. Check Redis connection (if using)
5. Test file uploads
6. Verify CORS settings



