# 🚀 Quick Start - Firebase Multi-Device Sync

## ✅ What's Done:

1. ✅ Firebase config added (`src/config/firebase.ts`)
2. ✅ Firebase storage service created (`src/utils/firebaseStorage.ts`)

## ⚠️ What's Left:

### **Step 1: Install Firebase**

```bash
cd pilot-demo
npm install firebase
```

### **Step 2: Update Imports**

**4 files need updating:**
- `src/pages/Admin.tsx`
- `src/components/DoctorPanel.tsx`
- `src/components/PatientView.tsx`
- `src/pages/QueuePage.tsx`

**Change this:**
```typescript
import { saveQueue, getQueue } from '../utils/storage';
```

**To this:**
```typescript
import { saveQueue, getQueue } from '../utils/firebaseStorage';
```

### **Step 3: Make Functions Async**

Add `async/await` to all functions that use Firebase:

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

## 🧪 Test:

1. Run: `npm run dev`
2. Open on desktop
3. Open same URL on mobile
4. Make changes on desktop
5. See updates on mobile instantly! ✅

---

## 📝 Files to Update:

1. ✅ `src/config/firebase.ts` - DONE
2. ✅ `src/utils/firebaseStorage.ts` - DONE
3. ⚠️ `src/pages/Admin.tsx` - Need to update imports
4. ⚠️ `src/components/DoctorPanel.tsx` - Need to update imports + async
5. ⚠️ `src/components/PatientView.tsx` - Need to update imports + async
6. ⚠️ `src/pages/QueuePage.tsx` - Need to update imports + async

---

**Status**: 2/6 files done  
**Next**: Install firebase + update imports
