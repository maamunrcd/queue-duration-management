# Queue Duration Management - Pilot Demo App
## Real-time Wait Time Tracking System (No Backend!)

**Purpose**: Pilot/Demo version to validate concept with doctors and clinics  
**Brand**: Queue Duration Management  
**Technology**: React + TypeScript + localStorage (No Backend!)  
**Created**: January 1, 2026

---

## 🎯 Features

### Admin Panel (`/`)
- Generate QR codes for doctors/counters
- Each QR code contains unique queue ID
- Set doctor name, secret code, avg time per patient
- View all active queues

### Doctor Panel (`/queue/{id}` → Click "ডাক্তার")
- Login with secret code
- Start queue
- Call next patient (increment number)
- Pause queue
- Reset queue
- See statistics

### Patient View (`/queue/{id}` → Click "রোগী")
- Enter serial number
- See current number being served
- See people ahead
- See estimated wait time
- Real-time updates (auto-refreshes!)

---

## 🚀 Quick Start

### Install Dependencies:
```bash
npm install
```

### Run Development Server:
```bash
npm run dev
```

Open: http://localhost:5173

### Build for Production:
```bash
npm run build
```

Deploy `dist/` folder to any static hosting (Netlify, Vercel, GitHub Pages)

---

## 📱 How to Use

### Step 1: Admin Creates Queue

1. Go to http://localhost:5173/
2. Fill form:
   - ডাক্তারের নাম: "ডা. রহমান - Cardiology"
   - Secret Code: "1234"
   - গড় সময়: 5 minutes
   - Max Serial: 50
3. Click "QR Code তৈরি করুন"
4. QR Code generated!
5. Print the QR code

---

### Step 2: Patient Scans QR

1. Patient scans QR code with phone
2. Opens URL: `/queue/{id}`
3. Sees 2 options: ডাক্তার or রোগী
4. Clicks "রোগী"
5. Enters serial number (e.g., 15)
6. Sees real-time queue status!

---

### Step 3: Doctor Controls Queue

1. Doctor scans same QR (or bookmarks URL)
2. Clicks "ডাক্তার"
3. Enters secret code: 1234
4. Sees control panel
5. Clicks "Queue শুরু করুন" → Current number becomes 1
6. After each patient, clicks "পরবর্তী রোগী" → Number increments
7. Patient with serial #2 sees wait time update automatically!

---

## 🔧 How It Works (No Backend!)

### Data Storage:
- **localStorage**: All queue data stored in browser
- **Key**: `queue_management_data`
- **Structure**: `{ queues: { [queueId]: Queue } }`

### Real-time Updates:
- **BroadcastChannel API**: Syncs between tabs
- **Polling**: Patient view refreshes every 2 seconds
- Works across tabs in same browser!

### Limitations (This is a Demo!):
- ❌ Data only in one browser (not shared across devices)
- ❌ Data lost if localStorage cleared
- ❌ No authentication (just secret code check)
- ❌ No analytics/history
- ❌ Single doctor/queue at a time (per browser)

**For Production**: Need backend (PostgreSQL), multi-tenant, real WebSocket

---

## 📁 Project Structure

```
pilot-demo/
├── src/
│   ├── pages/
│   │   ├── Admin.tsx           # QR code generation
│   │   └── QueuePage.tsx       # Doctor/Patient selection
│   ├── components/
│   │   ├── DoctorPanel.tsx     # Queue control (Start/Pause/Next)
│   │   └── PatientView.tsx     # Real-time wait time display
│   ├── utils/
│   │   └── storage.ts          # localStorage + BroadcastChannel
│   ├── types.ts                # TypeScript interfaces
│   ├── App.tsx                 # Router
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind CSS
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🎯 Use Cases

### Use Case 1: Small Clinic Demo
**Scenario**: Dr. Ahmed এর ছোট clinic, daily 20-30 patients

**Setup** (5 minutes):
1. Admin panel এ Dr. Ahmed এর queue তৈরি করুন
2. QR code print করুন
3. Clinic entrance এ লাগান

**Usage**:
- Patients scan QR, enter serial (1-30)
- Dr. Ahmed tablet এ "পরবর্তী রোগী" click করেন
- Patients real-time update দেখে

**Result**: Patients বাইরে wait করতে পারে, real-time জানে কখন আসতে হবে!

---

### Use Case 2: Hospital Department
**Scenario**: Hospital এর Cardiology department, 3 doctors

**Setup**:
- Create 3 separate queues (Dr. Rahman, Dr. Khan, Dr. Hasan)
- Each has own QR code
- Patients choose which doctor

**Usage**:
- Each doctor controls their own queue
- Patients monitor their specific queue

---

### Use Case 3: Bank Counter
**Scenario**: Bank branch, 5 counters

**Setup**:
- Create 5 queues (Counter 1, Counter 2, etc.)
- Print 5 QR codes
- Place at each counter

**Usage**:
- Customers scan, enter serial
- Counter staff call next
- Customers wait in car/outside

---

## 💡 Marketing Strategy

### How to Use This Demo:

**Week 1-2**: Build this app ✅  
**Week 3**: Test with 1 friendly doctor (free!)  
**Week 4-6**: Demo to 10 clinics  
**Week 7-8**: Get feedback, testimonials

### Pitch Script:
*"ডাক্তার সাহেব, আমি একটা app বানিয়েছি যাতে আপনার patients আর ২-৩ ঘণ্টা লাইনে দাঁড়াবে না। Free demo দিতে চাই। শুধু একটা QR code print করে দিন, আর tablet এ একটা button click করুন। Patients mobile এ দেখবে তাদের কখন আসতে হবে!"*

### Demo Process:
1. Show them this app (live)
2. Generate QR code on the spot
3. Show patient view on your phone
4. Show doctor panel on tablet
5. Click "Next" → Patient view updates instantly!
6. **WOW moment!** 🎉

### Conversion:
- If they love it → "আপনার জন্য ফ্রি রাখছি ১ মাস, try করুন!"
- After 1 month → "Full version এ upgrade করুন (multi-doctor, analytics, SMS)"
- Collect testimonial, case study

---

## 🎓 Learning Outcomes

### What You'll Learn:

1. **Product Validation**:
   - Do doctors actually use it?
   - Do patients understand QR code?
   - What features they ask for?

2. **Market Feedback**:
   - Pricing willingness
   - Feature priorities
   - Objections & concerns

3. **Technical Proof**:
   - localStorage works for small scale
   - Real-time updates possible
   - UX is intuitive (or needs improvement)

4. **Sales Skills**:
   - How to demo
   - How to handle objections
   - How to close deals

---

## 🚀 Next Steps After Pilot

### If Successful (3+ doctors using happily):

**Step 1**: Collect data
- How many patients used it?
- Wait time reduced by how much?
- Doctor satisfaction rating?
- Testimonials

**Step 2**: Create case study
- "Dr. Ahmed reduced wait time from 2 hours to 15 minutes"
- Screenshots, numbers, quotes
- Video testimonial

**Step 3**: Pitch to investors
- "We have 3 doctors using it, 200+ patients served"
- "Now we need ৳20L to build full SaaS version"
- Show this demo + case study

**Step 4**: Build Full SaaS
- Backend (Node.js + PostgreSQL)
- Multi-tenant (100s of doctors)
- Analytics, SMS, etc.
- Follow BusinessPlan.md!

---

## 📊 Success Metrics

Track these during pilot:

- [ ] Number of doctors using
- [ ] Number of patients scanned QR
- [ ] Average wait time (before vs after)
- [ ] Doctor satisfaction (1-10 rating)
- [ ] Patient satisfaction (1-10 rating)
- [ ] Would they pay? (Yes/No)
- [ ] How much? (৳___/month)

---

## ⚡ Deployment Options

### Option 1: Netlify (Easiest!)
```bash
npm run build
# Drag & drop `dist` folder to Netlify
```
**URL**: https://your-app.netlify.app  
**Cost**: ৳0

### Option 2: Vercel
```bash
npm install -g vercel
vercel
```
**Cost**: ৳0

### Option 3: GitHub Pages
```bash
npm run build
# Push to GitHub
# Settings → Pages → Deploy from main/gh-pages
```
**Cost**: ৳0

---

## 🎯 Demo Checklist

Before showing to doctors:

- [ ] App works smoothly (no bugs)
- [ ] Mobile responsive (test on phone)
- [ ] QR code generates properly
- [ ] Real-time updates work
- [ ] Bangla text readable
- [ ] Print-friendly QR code
- [ ] Have backup plan (if internet fails, show video)

---

## 🚀 GO LIVE!

**Build and deploy this weekend.**  
**Demo to first doctor next Monday.**  
**Get feedback by Friday.**  
**Iterate and scale!**

Good luck! 🎉
# queue-duration-management
