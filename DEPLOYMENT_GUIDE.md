# Notesnook Deployment Guide

## 🎯 What's Been Built

✅ **Web App Build**: `apps/web/build/` (23 MB, production-ready)
✅ **Desktop Electron Wrapper**: `apps/desktop/build/` (1.9 MB)
✅ **Vercel Configuration**: `apps/web/vercel.json` (optimized settings)

---

## 🚀 Deployment Option 1: Vercel CLI (Quick Deploy)

### Prerequisites
- Vercel account (free at https://vercel.com)
- Vercel CLI already installed ✅

### Steps

**1. Login to Vercel**
```bash
vercel login
```
- Choose your login method (email, GitHub, etc.)
- Complete authentication

**2. Deploy the Web App**
```bash
cd /home/user/notesnook/apps/web
vercel --prod ./build
```

**3. Get Your Live URL**
- Vercel will output a URL like: `https://notesnook-xyz.vercel.app`
- Your app is now live! 🎉

### When to Use This
- ✅ Quick testing
- ✅ One-time deployments
- ✅ Manual control
- ❌ Not ideal for continuous updates

---

## 🔄 Deployment Option 2: Vercel + GitHub (Recommended)

### Why This Method?
- Automatic deployments on every push
- Preview URLs for pull requests
- Professional CI/CD pipeline
- Zero maintenance after setup

### Steps

**1. Ensure Code is on GitHub**
Your code is already pushed to:
- Repository: `pinkcaitpops/notesnook`
- Branch: `claude/prepare-deployment-011CURRPBErZrXjK6tWB5Avt`

**2. Merge to Main Branch**
```bash
# Option A: Via GitHub UI
# Go to: https://github.com/pinkcaitpops/notesnook
# Create Pull Request → Merge

# Option B: Via Command Line
git checkout main
git pull origin main
git merge claude/prepare-deployment-011CURRPBErZrXjK6tWB5Avt
git push origin main
```

**3. Connect to Vercel**
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `pinkcaitpops/notesnook` repository
4. Configure project:
   - **Framework Preset**: Other (or Vite)
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && npm run build:web`
   - **Output Directory**: `build`
   - **Install Command**: `cd ../.. && npm ci && npm run bootstrap -- --scope=web`
5. Click "Deploy"

**4. Set Up Environment (if needed)**
Add any environment variables in Vercel dashboard if required.

**5. Done!**
- Every push to `main` → Auto-deploy
- Every PR → Preview deployment
- Rollback anytime via dashboard

---

## 🖥️ Desktop App Distribution

### For Linux AppImage

**Build Installer**
```bash
cd /home/user/notesnook/apps/desktop
yarn electron-builder --linux AppImage --x64
```

**Output Location**
```
/home/user/notesnook/apps/desktop/output/notesnook-3.3.2.AppImage
```

**Distribution**
- Upload to GitHub Releases
- Share direct download link
- Users can run: `chmod +x notesnook-3.3.2.AppImage && ./notesnook-3.3.2.AppImage`

### For Windows Portable

**Build Installer**
```bash
cd /home/user/notesnook/apps/desktop
yarn electron-builder --win portable --x64
```

**Output Location**
```
/home/user/notesnook/apps/desktop/output/notesnook-3.3.2.exe
```

### For macOS (Requires Mac)
Cannot be built on Linux. Requires:
- macOS machine
- Apple Developer certificates

---

## 🧪 Local Testing

### Test Web App Locally
```bash
cd /home/user/notesnook/apps/web
npm run start:test
```
Opens at: http://localhost:3000

### Test Desktop App Locally
```bash
cd /home/user/notesnook/apps/desktop
npm run start
```
Launches Electron app

---

## 📝 Build Configuration

### Web Build Settings (vercel.json)
- ✅ SPA routing (all routes → index.html)
- ✅ Security headers (XSS, clickjacking protection)
- ✅ Service worker cache control
- ✅ Clean URLs enabled

### Performance Optimizations
- Code splitting enabled
- Minification applied
- Tree shaking active
- Gzip compression ready

---

## 🔧 Troubleshooting

### "Build Failed" on Vercel
**Problem**: Monorepo structure
**Solution**: Use custom build commands:
```
Root Directory: apps/web
Install: cd ../.. && npm ci && npm run bootstrap -- --scope=web
Build: cd ../.. && npm run build:web
```

### "Module Not Found" Errors
**Problem**: Missing dependencies
**Solution**: Clear cache and rebuild:
```bash
npm run clean
npm ci
npm run bootstrap -- --scope=web
npm run build:web
```

### Theme Files Missing
**Problem**: Network blocked during build
**Solution**: Theme files are gitignored. They're generated during build or can be manually created.

---

## 📊 What You Have

| Asset | Location | Size | Status |
|-------|----------|------|--------|
| Web Build | `/apps/web/build/` | 23 MB | ✅ Ready |
| Desktop Build | `/apps/desktop/build/` | 1.9 MB | ✅ Ready |
| Vercel Config | `/apps/web/vercel.json` | - | ✅ Configured |
| Git Branch | `claude/prepare-deployment-*` | - | ✅ Pushed |

---

## 🎯 Recommended Path

1. **Test locally** (5 minutes)
   - Run `npm run start:test` in `apps/web`
   - Verify everything works

2. **Deploy via Vercel CLI** (5 minutes)
   - Quick verification deployment
   - Get immediate feedback

3. **Set up GitHub → Vercel** (10 minutes)
   - Long-term automated solution
   - Professional workflow

4. **Create desktop installers** (Optional, 15 minutes)
   - If you need distributable apps

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Electron Builder: https://www.electron.build/
- Notesnook: https://github.com/streetwriters/notesnook

---

**Generated by Claude Code**
**Date**: October 24, 2025
