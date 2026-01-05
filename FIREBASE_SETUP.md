# 🔥 Firebase Setup - Multi-Device Sync

## 🎯 Problem:

**Current:** localStorage শুধু এক device-এ কাজ করে  
**Solution:** Firebase Realtime Database - সব device-এ real-time sync

---

## 📋 Step-by-Step Setup:

### **Step 1: Firebase Project তৈরি করুন**

1. https://console.firebase.google.com এ যান
2. "Add project" click করুন
3. Project name দিন (যেমন: "queue-management")
4. Continue → Continue → Create project

### **Step 2: Realtime Database Enable করুন**

1. Left sidebar থেকে "Realtime Database" click করুন
2. "Create database" click করুন
3. Location: `asia-south1` (Mumbai) বা আপনার কাছে যেটা আছে
4. Security rules: **"Start in test mode"** (development-এর জন্য)
5. Enable করুন

### **Step 3: Firebase Config Keys পান**

1. Project settings (⚙️) → General tab
2. Scroll down → "Your apps" section
3. Web icon (</>) click করুন
4. App nickname দিন (যেমন: "Queue Management")
5. "Register app" click করুন
6. **Config keys copy করুন** (এগুলো লাগবে)

### **Step 4: Firebase Install করুন**

```bash
cd pilot-demo
npm install firebase
```

### **Step 5: Firebase Config File তৈরি করুন**

```bash
# Create config file
touch src/config/firebase.ts
```

**File content (`src/config/firebase.ts`):**

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Step 3 থেকে copy করা keys এখানে paste করুন
const firebaseConfig = {
  apiKey: "AIzaSy...", // আপনার API key
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### **Step 6: Storage File Replace করুন**

**Option A: Firebase ব্যবহার করুন (Multi-device)**

```typescript
// src/components/Admin.tsx, DoctorPanel.tsx, PatientView.tsx, QueuePage.tsx
// সব imports change করুন:

// Before:
import { saveQueue, getQueue } from '../utils/storage';

// After:
import { saveQueue, getQueue } from '../utils/firebaseStorage';
```

**Option B: localStorage রাখুন (Single device demo)**

কিছু change করবেন না - localStorage-ই থাকবে

### **Step 7: Functions Async করুন**

Firebase ব্যবহার করলে সব functions async করতে হবে:

```typescript
// Before:
const handleNext = () => {
  callNextPatient(queue.id);
};

// After:
const handleNext = async () => {
  await callNextPatient(queue.id);
  const updated = await getQueue(queue.id);
  if (updated) setQueue(updated);
};
```

---

## 🧪 Test করুন:

### **1. Desktop এ:**
- Queue create করুন
- Patient add করুন
- "Next" click করুন

### **2. Mobile এ (same URL):**
- QR code scan করুন
- Real-time update দেখবেন! ✅

---

## 🔒 Security Rules (Production):

Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "queue_management_data": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ Important:** Production-এ authentication add করুন!

---

## 📊 Comparison:

| Feature | localStorage | Firebase |
|---------|-------------|----------|
| Multi-Device | ❌ No | ✅ Yes |
| Real-time | ❌ No | ✅ Yes |
| Setup Time | ✅ 0 min | ⚠️ 30 min |
| Cost | ✅ Free | ✅ Free (1GB) |

---

## 🎯 Quick Switch:

**localStorage → Firebase:**
1. Install Firebase: `npm install firebase`
2. Create `src/config/firebase.ts`
3. Replace imports: `storage` → `firebaseStorage`
4. Make functions async
5. Test!

**Firebase → localStorage:**
1. Replace imports: `firebaseStorage` → `storage`
2. Remove async/await
3. Done!

---

## 🆘 Troubleshooting:

### **Error: "Firebase not initialized"**
→ `src/config/firebase.ts` file check করুন

### **Error: "Permission denied"**
→ Firebase Console → Rules → Write: `true` করুন

### **No real-time updates**
→ `onQueueUpdate` function check করুন

---

## ✅ Checklist:

- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] Config keys copied
- [ ] `npm install firebase` done
- [ ] `src/config/firebase.ts` created
- [ ] Imports changed to `firebaseStorage`
- [ ] Functions made async
- [ ] Tested on 2 devices

---

**Status**: Ready to sync! 🚀  
**Time**: 30 minutes setup

