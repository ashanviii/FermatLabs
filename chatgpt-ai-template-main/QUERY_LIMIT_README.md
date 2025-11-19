# Query Limit System Implementation

## Overview
This implementation adds a 5-query limit for free users with Firebase Authentication and Firestore tracking. Users can see their remaining queries and are prompted to upgrade to Pro for unlimited access.

## Features Implemented

### 1. **Firebase Firestore Integration**
- Added Firestore to track user query counts
- Automatic user document creation on first login
- Real-time query count tracking

### 2. **Query Limit System**
- Free users: 5 queries maximum
- Pro users: Unlimited queries
- Query count increments only after successful API calls
- Persistent across sessions using Firestore

### 3. **User Interface Components**
- **Query Counter Badge**: Shows remaining queries (top-right corner)
  - Displays `X / 5` for free users
  - Shows "Pro Member - Unlimited" for pro users
  - Color-coded based on remaining queries (green → orange → red)
  
- **Upgrade Button**: Appears when 2 or fewer queries remain
  
- **Limit Reached Banner**: Full-screen message when queries exhausted
  - Clear call-to-action to upgrade
  - Prevents further queries until upgrade

### 4. **User Context**
- Centralized state management for:
  - Query count
  - Remaining queries
  - Pro status
  - Loading states
- Automatic refresh on authentication changes

## File Changes

### New Files
1. `src/components/QueryCounter.tsx` - Query counter UI components
2. Updated `src/contexts/UserContextContext.tsx` - User context with query tracking

### Modified Files
1. `src/lib/firebase.ts` - Added Firestore functions
2. `app/page.tsx` - Integrated query limit checks
3. `app/layout.tsx` - Added UserContextProvider
4. `app/AppWrappers.tsx` - Added context providers

## Firestore Data Structure

### Users Collection (`users/{uid}`)
```json
{
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://...",
  "queryCount": 3,
  "isPro": false,
  "createdAt": "Firebase Timestamp",
  "lastQueryAt": "Firebase Timestamp"
}
```

## Testing the Implementation

### Test Free User Flow
1. Sign in with Google
2. Make queries and watch the counter decrease
3. When 2 queries remain, upgrade button appears
4. After 5 queries, limit banner shows
5. Further query attempts show warning toast

### Test Pro User Flow
1. In Firebase Console, set `isPro: true` for a user document
2. Sign in as that user
3. See "Pro Member - Unlimited" badge
4. Make unlimited queries without restrictions

### Manual Pro Upgrade (For Testing)
In `app/page.tsx`, uncomment these lines in `handleUpgrade` function:
```typescript
// await upgradeUser();
// toast({
//   title: 'Welcome to Pro!',
//   description: 'You now have unlimited queries!',
//   status: 'success',
//   duration: 5000,
//   isClosable: true,
//   position: 'top',
// });
```

## Firebase Console Setup

### Required Steps
1. **Enable Firestore Database**
   - Go to Firebase Console → Firestore Database
   - Create database in production mode
   - Start in test mode for development (or configure security rules)

2. **Firestore Security Rules (Development)**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

3. **Firestore Security Rules (Production)**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow create: if request.auth != null && request.auth.uid == userId;
         allow update: if request.auth != null && request.auth.uid == userId 
                       && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isPro']))
                       || request.auth.token.admin == true;
         allow delete: if false;
       }
     }
   }
   ```

## Future Enhancements

### Payment Integration
To make this production-ready, integrate a payment processor:

1. **Stripe Integration**
   ```typescript
   // Example upgrade flow
   const handleUpgrade = async () => {
     const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
     const { sessionId } = await fetch('/api/create-checkout-session', {
       method: 'POST',
     }).then(res => res.json());
     
     await stripe.redirectToCheckout({ sessionId });
   };
   ```

2. **Webhook Handler** (`/api/stripe-webhook`)
   - Listen for successful payments
   - Call `upgradeToPro(userId)` on success
   - Send confirmation email

### Query Reset Options
- Monthly query reset for free users
- Different tiers (5, 20, 50 queries/month)
- Add `lastResetDate` field to user documents

### Analytics
- Track query usage patterns
- Monitor conversion from free to pro
- A/B test different limits (3 vs 5 vs 10)

## Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Troubleshooting

### Issue: Query counter not updating
- Check Firestore permissions in Firebase Console
- Verify user is authenticated
- Check browser console for errors

### Issue: Cannot make any queries
- Verify Firestore database is enabled
- Check that user document was created
- Inspect `users/{uid}` document in Firestore Console

### Issue: All users showing as Pro
- Check Firestore security rules
- Verify `isPro` field defaults to `false`

## Cost Optimization

This implementation helps reduce backend costs by:
1. Limiting free tier usage to 5 queries per user
2. Only incrementing after successful API calls
3. Encouraging pro upgrades for heavy users
4. Using client-side state to minimize Firestore reads

### Estimated Firestore Usage (per user)
- Document creation: 1 write
- Query check: 1 read per query attempt
- Query increment: 1 write per successful query
- Pro upgrade: 1 write

For 1000 free users × 5 queries each:
- Reads: ~5,000
- Writes: ~6,000 (1k creates + 5k increments)
- Well within Firebase free tier limits

## Support

For questions or issues with the query limit system, check:
1. Browser console for error messages
2. Firebase Console → Firestore for data verification
3. Network tab for API call failures
