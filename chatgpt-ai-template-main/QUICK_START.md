# Quick Start - Query Limit System

## 🚀 What Was Implemented

A complete query limiting system that:
- ✅ Limits free users to **5 queries** total
- ✅ Tracks usage in **Firebase Firestore**
- ✅ Shows **remaining queries** to users
- ✅ Prompts users to **upgrade to Pro** for unlimited access
- ✅ Prevents queries after limit is reached
- ✅ Pro users get **unlimited queries**

## 📋 Before You Start

### 1. Enable Firestore in Firebase Console
```
1. Go to Firebase Console (https://console.firebase.google.com)
2. Select your project: "fermat-9e38d"
3. Click "Firestore Database" in the left menu
4. Click "Create Database"
5. Choose "Start in test mode" for now
6. Click "Enable"
```

### 2. Set Firestore Security Rules
In Firebase Console → Firestore → Rules tab:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Click "Publish"

## 🧪 Testing the System

### Test as Free User
1. Run your app: `npm run dev`
2. Sign in with Google
3. Look for query counter in **top-right corner** showing "5/5"
4. Make a query - counter decreases to "4/5"
5. Make 4 more queries
6. After 5th query, you'll see **"Query Limit Reached"** banner
7. Try to make another query - you'll get a warning toast

### Test as Pro User
1. In Firebase Console, go to Firestore Database
2. Click "users" collection
3. Find your user document (named with your UID)
4. Click on it to edit
5. Change `isPro` from `false` to `true`
6. Save
7. Refresh your app
8. You should see **"Pro Member - Unlimited"** badge
9. Make unlimited queries!

## 🎨 UI Components Added

### 1. Query Counter Badge (Top-Right)
- Shows "X / 5" for free users
- Shows "Pro Member - Unlimited" for pro users
- Changes color: Green → Orange → Red as queries decrease
- Shows "Upgrade to Pro" button when ≤2 queries left

### 2. Limit Reached Banner (Center)
- Appears when all 5 queries are used
- Large, clear message
- "Upgrade to Pro" call-to-action button
- Prevents making more queries

### 3. Toast Notifications
- Warning when trying to query after limit
- Info message when clicking upgrade (placeholder)

## 📁 Files Modified

```
✨ NEW FILES:
├── src/components/QueryCounter.tsx          (Query UI components)
├── QUERY_LIMIT_README.md                    (Full documentation)
├── ADMIN_GUIDE.md                           (Admin operations guide)
└── QUICK_START.md                           (This file)

🔧 MODIFIED FILES:
├── src/lib/firebase.ts                      (Added Firestore functions)
├── src/contexts/UserContextContext.tsx      (Query tracking context)
├── app/page.tsx                             (Main UI with limits)
├── app/layout.tsx                           (Added UserContextProvider)
└── app/AppWrappers.tsx                      (Wrapped with providers)
```

## 🔧 How It Works

### Flow Diagram
```
User Signs In
    ↓
Firebase Auth creates user
    ↓
Firestore creates user document
    { queryCount: 0, isPro: false }
    ↓
User makes query
    ↓
Check: canQuery? (queryCount < 5 OR isPro)
    ↓
Yes → Execute query → Increment queryCount
    ↓
No → Show limit banner + warning toast
```

### Data Structure in Firestore
```
users (collection)
  └── {userUID} (document)
      ├── email: "user@gmail.com"
      ├── displayName: "John Doe"
      ├── photoURL: "https://..."
      ├── queryCount: 3
      ├── isPro: false
      ├── createdAt: Timestamp
      └── lastQueryAt: Timestamp
```

## ⚙️ Configuration

### Change Query Limit
Edit `src/lib/firebase.ts`:
```typescript
const FREE_QUERY_LIMIT = 5; // Change this number
```

### Enable Instant Pro Upgrade (for testing)
Edit `app/page.tsx`, uncomment in `handleUpgrade`:
```typescript
await upgradeUser();
toast({
  title: 'Welcome to Pro!',
  description: 'You now have unlimited queries!',
  status: 'success',
  duration: 5000,
  isClosable: true,
  position: 'top',
});
```

## 💰 Adding Payment (Optional)

To accept real payments, integrate Stripe:

1. Install Stripe:
```bash
npm install stripe @stripe/stripe-js
```

2. Add environment variables:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. See `ADMIN_GUIDE.md` for complete Stripe integration code

## 🐛 Troubleshooting

### Problem: Counter shows "0/5" immediately
**Solution**: Check Firestore rules allow reads. User document may not be created.

### Problem: Queries not incrementing
**Solution**: 
1. Check browser console for errors
2. Verify Firestore is enabled in Firebase Console
3. Check that `makeQuery()` is being called in `handleTranslate`

### Problem: Can't see user data in Firestore
**Solution**:
1. Make sure you've signed in at least once
2. Check Firebase Console → Firestore → users collection
3. User document is created on first sign-in

### Problem: All users appear as Pro
**Solution**: Check that `isPro` defaults to `false` in `createUserDocument` function

## 📊 Monitoring Usage

### View All Users
Firebase Console → Firestore → users collection

### Find Heavy Users
Sort by `queryCount` (descending) to find users likely to upgrade

### Export Data
See `ADMIN_GUIDE.md` for export scripts

## 🚀 Next Steps

### Production Readiness
1. ✅ Set proper Firestore security rules (see QUERY_LIMIT_README.md)
2. ⬜ Add Stripe payment integration
3. ⬜ Set up email notifications (SendGrid, Resend, etc.)
4. ⬜ Add analytics tracking
5. ⬜ Create pricing page
6. ⬜ Add user dashboard showing query history

### Potential Improvements
- Monthly query reset for free users
- Tiered pricing (5, 20, 50 queries/month)
- Referral system for bonus queries
- Query rollover for paid users
- Usage analytics dashboard
- Email alerts at 80% usage

## 📚 Documentation

- **QUERY_LIMIT_README.md**: Complete technical documentation
- **ADMIN_GUIDE.md**: Admin operations and management
- **QUICK_START.md**: This file - getting started

## ❓ Questions?

Common questions answered in the documentation:
- How to change the query limit? → See "Configuration" above
- How to make someone Pro? → See "Test as Pro User" above
- How to reset queries? → See ADMIN_GUIDE.md
- How to add payments? → See "Adding Payment" above
- Cost optimization? → See QUERY_LIMIT_README.md

---

**Ready to test?** Follow the "Testing the System" section above! 🎉
