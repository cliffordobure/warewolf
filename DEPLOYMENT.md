# Deployment Guide

This guide covers deploying the Werewolf Kill Game backend to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Render (Recommended for Beginners)

Render offers free hosting for Node.js applications with MongoDB support.

#### Steps:

1. **Create a Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create a Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the Service**
   ```
   Name: werewolf-game-server
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   - Go to "Environment" tab
   - Add all variables from your `.env` file:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `JWT_REFRESH_SECRET`
     - `STRIPE_SECRET_KEY`
     - `PAYPAL_CLIENT_ID`
     - `PAYPAL_CLIENT_SECRET`
     - etc.

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be available at: `https://werewolf-game-server.onrender.com`

#### MongoDB Atlas Setup

1. Go to https://mongodb.com/atlas
2. Create a free cluster
3. Create a database user
4. Add `0.0.0.0/0` to IP whitelist (for Render)
5. Get connection string and add to Render environment variables

### Option 2: Railway

Railway provides a simple deployment process.

#### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Environment Variables**
   - Go to "Variables" tab
   - Add all environment variables

4. **Add MongoDB**
   - Click "New" → "Database" → "MongoDB"
   - Railway will automatically create a MongoDB instance
   - Use the provided `MONGODB_URI`

### Option 3: Heroku

#### Steps:

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create werewolf-game-server
   ```

4. **Add MongoDB**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET=your_secret_here
   heroku config:set STRIPE_SECRET_KEY=your_stripe_key
   # ... add all other variables
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com/apps
2. Create new app from GitHub
3. Configure build and run commands
4. Add environment variables
5. Deploy

### Option 5: AWS EC2 (Advanced)

1. Launch an EC2 instance (Ubuntu)
2. SSH into the instance
3. Install Node.js and MongoDB
4. Clone your repository
5. Install dependencies
6. Configure environment variables
7. Use PM2 to run the server
8. Set up Nginx as reverse proxy
9. Configure SSL with Let's Encrypt

## 🔒 Production Checklist

### Security
- [ ] Use strong, unique JWT secrets (32+ characters)
- [ ] Enable HTTPS only
- [ ] Set proper CORS origin
- [ ] Use production API keys for Stripe/PayPal
- [ ] Set `NODE_ENV=production`
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Use environment variables (never commit secrets)

### Database
- [ ] Use MongoDB Atlas or production database
- [ ] Enable automatic backups
- [ ] Set up database monitoring
- [ ] Configure proper indexes
- [ ] Set connection pool size

### Monitoring & Logging
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging (Winston, Morgan)
- [ ] Set up uptime monitoring
- [ ] Enable performance monitoring
- [ ] Configure alerts

### Performance
- [ ] Enable gzip compression
- [ ] Configure caching
- [ ] Optimize database queries
- [ ] Set up CDN for static assets
- [ ] Configure proper rate limits

### Payments
- [ ] Test Stripe webhooks in production
- [ ] Test PayPal webhooks in production
- [ ] Configure proper webhook endpoints
- [ ] Test payment flows thoroughly
- [ ] Set up payment failure alerts

## 🔧 Environment-Specific Configuration

### Development
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/werewolf_kill
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_MODE=sandbox
```

### Production
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/werewolf_kill
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_MODE=live
```

## 🌐 Custom Domain Setup

### Render
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records with provided values

### Railway
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS CNAME record

## 📊 Monitoring Setup

### Sentry (Error Tracking)

1. Create account at https://sentry.io
2. Install Sentry:
   ```bash
   npm install @sentry/node
   ```
3. Add to `src/index.js`:
   ```javascript
   const Sentry = require('@sentry/node');
   Sentry.init({ dsn: process.env.SENTRY_DSN });
   ```

### LogRocket (Session Replay)

1. Create account at https://logrocket.com
2. Install LogRocket:
   ```bash
   npm install logrocket
   ```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: curl https://api.render.com/deploy/srv-xxxxx
```

## 📝 Post-Deployment

1. **Test all endpoints**
   - Authentication
   - Game creation and joining
   - Payment flows
   - Socket.IO connections

2. **Monitor logs**
   - Check for errors
   - Monitor performance
   - Watch database queries

3. **Set up alerts**
   - Server downtime
   - Payment failures
   - Database issues
   - High error rates

## 🆘 Troubleshooting

### Common Issues

**Issue: MongoDB connection fails**
- Check connection string
- Verify IP whitelist
- Check database user permissions

**Issue: Socket.IO not connecting**
- Check CORS configuration
- Verify WebSocket support on hosting platform
- Check firewall rules

**Issue: Payments failing**
- Verify API keys are correct
- Check webhook endpoints
- Test with sandbox/test mode first

**Issue: High memory usage**
- Check for memory leaks
- Optimize database queries
- Configure connection pooling

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## 🎉 Success!

Once deployed, your API will be available at your deployment URL. Update your frontend to point to this URL and test thoroughly!

Remember to:
- Keep your environment variables secret
- Monitor your application regularly
- Set up automatic backups
- Keep dependencies updated
- Test payment flows thoroughly

