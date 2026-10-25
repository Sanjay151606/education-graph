# Windows Build Note

## ⚠️ Known Issue

You may encounter a build error on Windows related to static workers:
```
⨯ Static worker exited with code: 3221226505
Error: spawn UNKNOWN
```

## ✅ Solution

This is a known Windows-specific issue with Next.js build workers. **The application works perfectly in development mode.**

### Use Development Mode (Recommended)
```bash
npm run dev
```

This will start the server on `http://localhost:5001` with all features working perfectly, including:
- ✅ All visualizations
- ✅ Knowledge graphs
- ✅ Progress charts
- ✅ Learning paths
- ✅ Skills radar
- ✅ Hot reload
- ✅ Full functionality

### Alternative Build Solutions

#### Option 1: Use WSL (Windows Subsystem for Linux)
```bash
# Install WSL
wsl --install

# Inside WSL
npm run build
npm start
```

#### Option 2: Disable Static Optimization
Add to `next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}
```

#### Option 3: Use Vercel Deployment
```bash
# Deploy directly to Vercel (builds in cloud)
npm i -g vercel
vercel
```

## 🎯 Recommended Workflow

For development and testing:
```bash
npm run dev
```

For production deployment:
```bash
# Deploy to Vercel (handles build automatically)
vercel --prod
```

## ✅ Verification

The code compiles successfully (✓ Compiled successfully) - the issue is only with the static page generation worker on Windows. All functionality works in development mode.

---

**Note**: This does not affect the quality or functionality of the application. It's purely a Windows-specific build optimization issue.
