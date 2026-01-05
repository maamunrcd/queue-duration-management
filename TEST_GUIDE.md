# 🧪 Testing Your Pilot Demo App
## Step-by-Step Test করুন (5 minutes)

**App Running**: http://localhost:5174 ✅

---

## 🎯 Test Scenario: Dr. Rahman's Clinic

### Step 1: Create Queue (Admin Panel)

1. Open: http://localhost:5174
2. Fill form:
   - **Doctor Name**: `ডা. রহমান - কার্ডিওলজি`
   - **Secret Code**: `1234`
   - **Initial Time**: `5` minutes
3. Click **"QR Code তৈরি করুন"**
4. ✅ QR Code appears!
5. Copy the URL (below QR code)

---

### Step 2: Simulate 3 Patients

**Open 3 tabs** (simulate 3 patients):

**Tab A** (Patient #1):
- Paste URL → Opens queue page
- Click **"রোগী"**
- Click **"Queue তে যুক্ত হন (Auto Serial)"**
- ✅ Gets Serial #1
- Sees: "Queue এখনো শুরু হয়নি"

**Tab B** (Patient #2):
- Same URL
- Click "রোগী"
- Click "Auto Serial"
- ✅ Gets Serial #2

**Tab C** (Patient #3):
- Same process
- ✅ Gets Serial #3

---

### Step 3: Doctor Starts Queue

**Open New Tab** (Doctor):
- Same URL
- Click **"ডাক্তার"**
- Enter code: `1234`
- ✅ Doctor panel opens!
- Click **"Queue শুরু করুন"**
- Current Number: **1**

**Check Patient Tabs**:
- Tab A (Patient #1): **"আপনার পালা এসে গেছে!" 🔔**
- Tab B (Patient #2): "People Ahead: 1, Wait: ~5 min"
- Tab C (Patient #3): "People Ahead: 2, Wait: ~10 min"

**Magic!** ✨ সব real-time update হয়েছে!

---

### Step 4: Test Dynamic Time Calculation

**Doctor Tab**:
1. Wait **15 seconds** (simulate 15-second patient)
2. Click **"পরবর্তী রোগী ডাকুন"**
3. Current: **2**
4. Panel shows: "বর্তমান রোগীর সাথে 0 মিনিট" (just started)
5. ✅ Check "Last patients": `#1: 0.3m` (15 seconds = 0.25 min)

**Patient Tabs Update**:
- Tab B (Patient #2): **"Your turn!" 🔔**
- Tab C (Patient #3): Wait updated to new average!

---

6. Wait **45 seconds** (simulate longer patient)
7. Click **"পরবর্তী রোগী"**
8. Current: **3**
9. ✅ Check stats:
   - Last patients: `#2: 0.8m, #1: 0.3m`
   - Avg Time: ~0.5 min (dynamic!)

**Tab C (Patient #3)**:
- **"Your turn এসে গেছে!"** 🎉

---

### Step 5: Add More Patients (Test Unlimited)

**New Tab**:
- URL → "রোগী" → "Auto Serial"
- Gets: **#4**

**Another New Tab**:
- Auto Serial → Gets: **#5**

**Doctor Panel Shows**:
- Current: 3
- Total Joined: **5** (dynamic!)
- Waiting: **2**

**Continue clicking "পরবর্তী রোগী"** → All patient tabs update! ✅

---

## ✅ What to Verify

### Doctor Panel:
- [ ] QR code appears when created
- [ ] Doctor can login with secret code
- [ ] "Start" button works
- [ ] "Next Patient" increments number
- [ ] Timer shows duration with current patient
- [ ] Stats update (completed, waiting, avg time)
- [ ] Last 5 patients times show
- [ ] Pause/Resume works
- [ ] Reset works (with confirmation)

### Patient View:
- [ ] Auto join gives next serial number
- [ ] Manual serial entry works
- [ ] "Not joined yet" warning if serial > total
- [ ] Real-time updates (2-second refresh)
- [ ] Wait time calculates correctly
- [ ] "Your turn!" alert shows at right time
- [ ] "Already served" shows if serial < current
- [ ] Bangla text displays properly

### Real-time:
- [ ] Doctor clicks Next → Patient view updates (within 2 sec)
- [ ] Multiple tabs sync (BroadcastChannel)
- [ ] Updates continue even if doctor pauses

---

## 🐛 Common Issues & Fixes

### Issue 1: "Real-time not working"
**Fix**: 
- Make sure both tabs are same browser
- BroadcastChannel works same-browser only
- Or wait 2 seconds (polling interval)

### Issue 2: "Average time shows NaN"
**Fix**:
- Make sure to call at least 1 patient
- Initial estimate (5 min) used until first patient completes

### Issue 3: "Total patients not increasing"
**Fix**:
- Click "Auto Serial" button (not manual entry)
- Manual entry doesn't increase total (by design)

---

## 📱 Mobile Test

### On Your Phone:

1. Find your laptop's local IP:
   ```bash
   ipconfig getifaddr en0  # Mac
   # Or check System Preferences → Network
   ```

2. Start dev server with host:
   ```bash
   npm run dev -- --host
   ```

3. On phone browser:
   ```
   http://192.168.x.x:5174
   ```

4. Test QR scanner:
   - Open camera
   - Point at QR code on laptop screen
   - Should open queue page!

---

## 🎯 Demo Readiness Checklist

Before showing to doctor:

- [ ] App works on laptop ✅
- [ ] App works on mobile (responsive) ✅
- [ ] QR code scans properly
- [ ] Real-time updates < 3 seconds
- [ ] No console errors
- [ ] Bangla text readable
- [ ] "Wow moment" works (Next → instant update)
- [ ] Practiced demo 2-3 times
- [ ] Have backup (video recording if live demo fails)

---

## 🚀 Production Deployment (Free!)

### Deploy to Netlify:

```bash
# Build
npm run build

# Drag & drop `dist/` folder to netlify.com
```

**Result**: https://your-queue-demo.netlify.app

**Benefits**:
- Permanent URL (share easily!)
- No need to keep laptop on
- Show demo from anywhere (just need internet)
- Free forever (under 100GB/month bandwidth)

---

## 📊 Data to Collect

During pilot test, track:

```
Doctor: ডা. রহমান
Clinic: রহমান মেডিকেল
Date: Jan 5, 2026

Patients who scanned QR: 45
Patients who used app: 38 (84% adoption!)
Average wait time (before): 2 hours
Average wait time (after): 15 minutes
Wait time reduction: 87.5%

Doctor feedback: "Amazing! Patients খুশি!"
Patient feedback: "অসাধারণ! সময় বাঁচলো!"

Would they pay?: YES
How much?: ৳2,000/month
```

**This data = Your pitch to investors!** 💰

---

**Test Now: http://localhost:5174**

**Works? → Demo tomorrow! 🚀**

