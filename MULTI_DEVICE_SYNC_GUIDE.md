# 📱 Multi-Device Sync Guide - Queue Management

## 🎯 Problem:

**Current State:**
- ✅ Works on single device/browser
- ❌ localStorage is browser-specific
- ❌ No sync across devices
- ❌ Mobile scan won't see desktop updates

**Solution Needed:**
- Backend API server
- Real-time synchronization
- Database storage
- Cross-device support

---

## 🚀 Solution Options:

### **Option 1: Quick Setup - Firebase/Supabase (Recommended for MVP)**

**Pros:**
- ✅ Fastest setup (30 minutes)
- ✅ Built-in real-time sync
- ✅ Free tier available
- ✅ No server management

**Cons:**
- ⚠️ Vendor lock-in
- ⚠️ Limited customization

### **Option 2: Custom Backend (Node.js + MongoDB)**

**Pros:**
- ✅ Full control
- ✅ Customizable
- ✅ Scalable

**Cons:**
- ⚠️ More setup time
- ⚠️ Server management needed

### **Option 3: Hybrid (localStorage + API)**

**Pros:**
- ✅ Works offline (localStorage fallback)
- ✅ Syncs when online
- ✅ Best UX

**Cons:**
- ⚠️ More complex code

---

## 🎯 Recommended: Firebase Realtime Database

### **Why Firebase?**
1. **Real-time sync** - Changes appear instantly on all devices
2. **Easy setup** - Just add Firebase SDK
3. **Free tier** - 1GB storage, 10GB transfer/month
4. **No backend code** - Firebase handles everything

---

## 📋 Implementation Steps:

### **Step 1: Setup Firebase Project**

```bash
# 1. Go to https://console.firebase.google.com
# 2. Create new project
# 3. Enable Realtime Database
# 4. Get config keys
```

### **Step 2: Install Firebase**

```bash
cd pilot-demo
npm install firebase
```

### **Step 3: Create Firebase Config**

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### **Step 4: Create Firebase Storage Service**

```typescript
// src/utils/firebaseStorage.ts
import { database } from '../config/firebase';
import { ref, set, get, onValue, off } from 'firebase/database';
import type { Queue, QueueData } from '../types';

const STORAGE_KEY = 'queue_management_data';

// Get all queues from Firebase
export const getAllQueues = async (): Promise<QueueData> => {
  const snapshot = await get(ref(database, STORAGE_KEY));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return { queues: {} };
};

// Get specific queue
export const getQueue = async (queueId: string): Promise<Queue | null> => {
  const snapshot = await get(ref(database, `${STORAGE_KEY}/queues/${queueId}`));
  if (snapshot.exists()) {
    const queue = snapshot.val();
    // Backward compatibility
    if (!queue.patientHistory) queue.patientHistory = [];
    if (queue.totalPatientsJoined === undefined) {
      queue.totalPatientsJoined = queue.currentNumber || 0;
    }
    if (!queue.avgTimePerPatient) queue.avgTimePerPatient = 5;
    return queue;
  }
  return null;
};

// Save queue to Firebase
export const saveQueue = async (queue: Queue): Promise<void> => {
  await set(ref(database, `${STORAGE_KEY}/queues/${queue.id}`), {
    ...queue,
    lastUpdated: new Date().toISOString(),
  });
};

// Listen for real-time updates
export const onQueueUpdate = (
  callback: (queueId: string) => void
): (() => void) => {
  const queueRef = ref(database, `${STORAGE_KEY}/queues`);
  
  const unsubscribe = onValue(queueRef, (snapshot) => {
    if (snapshot.exists()) {
      const queues = snapshot.val();
      // Notify for each queue update
      Object.keys(queues).forEach((queueId) => {
        callback(queueId);
      });
    }
  });

  return () => off(queueRef);
};

// Delete queue
export const deleteQueue = async (queueId: string): Promise<void> => {
  await set(ref(database, `${STORAGE_KEY}/queues/${queueId}`), null);
};
```

### **Step 5: Update Existing Code**

**Replace localStorage imports:**

```typescript
// Before:
import { saveQueue, getQueue } from '../utils/storage';

// After:
import { saveQueue, getQueue } from '../utils/firebaseStorage';
```

**Make functions async:**

```typescript
// Before:
export const callNextPatient = (queueId: string): void => {
  const queue = getQueue(queueId);
  // ...
};

// After:
export const callNextPatient = async (queueId: string): Promise<void> => {
  const queue = await getQueue(queueId);
  // ...
};
```

---

## 🔄 Alternative: Custom Node.js Backend

### **Backend Structure:**

```
backend/
├── server.js          # Express server
├── routes/
│   └── queues.js      # Queue API routes
├── models/
│   └── Queue.js       # Queue model
└── database/
    └── db.js          # MongoDB connection
```

### **Simple Express Backend:**

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'queue_management';

let db;

MongoClient.connect(MONGODB_URI)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch(console.error);

// Get all queues
app.get('/api/queues', async (req, res) => {
  const queues = await db.collection('queues').find({}).toArray();
  res.json({ queues: Object.fromEntries(queues.map(q => [q.id, q])) });
});

// Get specific queue
app.get('/api/queues/:id', async (req, res) => {
  const queue = await db.collection('queues').findOne({ id: req.params.id });
  if (queue) {
    res.json(queue);
  } else {
    res.status(404).json({ error: 'Queue not found' });
  }
});

// Save queue
app.put('/api/queues/:id', async (req, res) => {
  const queue = { ...req.body, lastUpdated: new Date().toISOString() };
  await db.collection('queues').updateOne(
    { id: req.params.id },
    { $set: queue },
    { upsert: true }
  );
  res.json(queue);
});

// Delete queue
app.delete('/api/queues/:id', async (req, res) => {
  await db.collection('queues').deleteOne({ id: req.params.id });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **Frontend API Service:**

```typescript
// src/utils/apiStorage.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getAllQueues = async (): Promise<QueueData> => {
  const response = await fetch(`${API_BASE_URL}/queues`);
  const data = await response.json();
  return data;
};

export const getQueue = async (queueId: string): Promise<Queue | null> => {
  const response = await fetch(`${API_BASE_URL}/queues/${queueId}`);
  if (response.ok) {
    return await response.json();
  }
  return null;
};

export const saveQueue = async (queue: Queue): Promise<void> => {
  await fetch(`${API_BASE_URL}/queues/${queue.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queue),
  });
};

// Real-time updates using polling (or WebSockets)
export const onQueueUpdate = (
  callback: (queueId: string) => void
): (() => void) => {
  const interval = setInterval(async () => {
    const data = await getAllQueues();
    Object.keys(data.queues).forEach(queueId => {
      callback(queueId);
    });
  }, 2000); // Poll every 2 seconds

  return () => clearInterval(interval);
};
```

---

## 🎯 Quick Start: Firebase (Recommended)

### **1. Install Firebase:**

```bash
cd pilot-demo
npm install firebase
```

### **2. Create Firebase Project:**
- Go to https://console.firebase.google.com
- Create project
- Enable Realtime Database
- Copy config

### **3. Add Firebase Config:**
- Create `src/config/firebase.ts` with your config
- Create `src/utils/firebaseStorage.ts` (use code above)

### **4. Replace Storage Imports:**
- Replace all `storage.ts` imports with `firebaseStorage.ts`
- Make functions async

### **5. Test:**
- Open on desktop
- Open on mobile
- Make changes on desktop
- See updates on mobile instantly! ✅

---

## 📊 Comparison:

| Feature | localStorage | Firebase | Custom Backend |
|---------|-------------|----------|---------------|
| Setup Time | ✅ 0 min | ✅ 30 min | ⚠️ 2-3 hours |
| Multi-Device | ❌ No | ✅ Yes | ✅ Yes |
| Real-time | ❌ No | ✅ Yes | ⚠️ Need WebSocket |
| Offline | ✅ Yes | ⚠️ Limited | ❌ No |
| Cost | ✅ Free | ✅ Free tier | ⚠️ Server cost |
| Scalability | ❌ No | ✅ Yes | ✅ Yes |

---

## 🎯 Recommendation:

**For MVP/Demo:** Use **Firebase** - fastest setup, real-time sync, free tier

**For Production:** Use **Custom Backend** - full control, better for scaling

---

## 📝 Next Steps:

1. ✅ Choose solution (Firebase recommended)
2. ✅ Setup Firebase/Custom backend
3. ✅ Create storage service
4. ✅ Update imports
5. ✅ Make functions async
6. ✅ Test on multiple devices
7. ✅ Deploy!

---

**Status**: Ready to implement!  
**Time**: 30 minutes (Firebase) or 2-3 hours (Custom Backend)

