# 🔒 Firebase Permission Fix

## 🐛 Error:

```
PERMISSION_DENIED: Permission denied
```

**Problem:** Firebase Realtime Database security rules are blocking access.

---

## ✅ Solution: Update Firebase Security Rules

### **Step 1: Go to Firebase Console**

1. Open: https://console.firebase.google.com
2. Select your project: **queue-pilot-a2993**
3. Click: **Realtime Database** (left sidebar)
4. Click: **Rules** tab

### **Step 2: Update Rules**

**Replace the current rules with this:**

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

### **Step 3: Publish Rules**

1. Click **Publish** button
2. Wait for confirmation

---

## 🔒 Security Rules Explained:

### **Current (Default - Blocks Everything):**
```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

### **Development/Testing (Allow All):**
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

### **Production (Recommended - Add Authentication):**
```json
{
  "rules": {
    "queue_management_data": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## ⚠️ Important Notes:

1. **Development:** Use `true` for both read/write (current fix)
2. **Production:** Add Firebase Authentication for security
3. **Test Mode:** Firebase sometimes sets test mode (30 days) - check expiration

---

## 🧪 Test After Fix:

1. Refresh your app
2. Try creating a queue
3. Should work without permission errors! ✅

---

## 📝 Quick Steps:

1. Firebase Console → Your Project
2. Realtime Database → Rules tab
3. Paste the rules (above)
4. Click **Publish**
5. Refresh app

---

**Status**: Ready to fix!  
**Time**: 2 minutes

