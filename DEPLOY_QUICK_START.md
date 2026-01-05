# 🚀 Quick Deploy - 5 Minutes

## ⚡ Fastest Way: Vercel

### **Step 1: Push to GitHub (2 min)**

```bash
cd pilot-demo

# If not a git repo yet
git init
git add .
git commit -m "Queue Management App - Ready to deploy"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/queue-management.git
git branch -M main
git push -u origin main
```

### **Step 2: Deploy on Vercel (3 min)**

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub (free, no credit card)
3. **Click:** "Add New Project"
4. **Select** your repository
5. **Configure:**
   - Framework: **Vite** (auto-detected)
   - Build Command: `npm run build` (auto)
   - Output Directory: `dist` (auto)
6. **Click:** "Deploy"
7. **Wait 2 minutes** → Done! ✅

**You'll get:** `https://queue-management.vercel.app`

---

## 🔥 Alternative: Firebase Hosting

### **Step 1: Install Firebase CLI**

```bash
npm install -g firebase-tools
```

### **Step 2: Login & Initialize**

```bash
firebase login
cd pilot-demo
firebase init hosting
```

**Select:**
- Use existing project: `queue-pilot-a2993`
- Public directory: `dist`
- Single-page app: **Yes**

### **Step 3: Build & Deploy**

```bash
npm run build
firebase deploy --only hosting
```

**You'll get:** `https://queue-pilot-a2993.web.app`

---

## ✅ After Deployment:

1. ✅ Test the app
2. ✅ Share URL with others
3. ✅ Test on mobile
4. ✅ Verify Firebase sync works

---

## 🎯 Which to Choose?

- **Vercel**: Easiest, fastest, best for demo
- **Firebase**: Good if you want everything in one place

**Recommendation: Vercel** ⭐

---

**Time**: 5 minutes  
**Cost**: Free  
**Result**: Live demo URL! 🎉

