# Firebase Admin Guide - Managing Query Limits

## Quick Actions in Firebase Console

### Make a User Pro (Manual)
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find `users` collection
4. Click on the user document (identified by UID)
5. Edit the document
6. Set `isPro: true`
7. Save changes

The user will see the change on next page refresh.

### Reset User Query Count
1. Go to Firebase Console → Firestore Database
2. Find `users/{userId}` document
3. Edit `queryCount` field to `0`
4. Save changes

### View User Query Statistics
```javascript
// In Firebase Console, use the Firestore query:
// Collection: users
// Order by: queryCount (descending)
// This shows power users who might convert to Pro
```

### Bulk Operations (Using Firebase CLI)

#### Install Firebase Tools
```bash
npm install -g firebase-tools
firebase login
```

#### Reset All User Queries (Monthly)
Create a script `scripts/resetQueries.js`:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();

async function resetMonthlyQueries() {
  const db = admin.firestore();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('isPro', '==', false).get();
  
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.update(doc.ref, { queryCount: 0 });
  });
  
  await batch.commit();
  console.log(`Reset queries for ${snapshot.size} users`);
}

resetMonthlyQueries();
```

Run with:
```bash
node scripts/resetQueries.js
```

#### Find Users Close to Limit
```javascript
// Get users with 4+ queries (good upgrade targets)
const db = admin.firestore();
const usersRef = db.collection('users');
const snapshot = await usersRef
  .where('isPro', '==', false)
  .where('queryCount', '>=', 4)
  .get();

snapshot.forEach(doc => {
  const data = doc.data();
  console.log(`${data.email}: ${data.queryCount}/5 queries used`);
});
```

## Monitoring & Analytics

### Key Metrics to Track
1. **Conversion Rate**: Users who upgrade after hitting limit
2. **Churn Rate**: Users who stop using after hitting limit
3. **Average Queries**: Typical usage before abandonment
4. **Time to Limit**: How long until users hit 5 queries

### Export User Data for Analysis
```javascript
const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp();

async function exportUserData() {
  const db = admin.firestore();
  const snapshot = await db.collection('users').get();
  
  const userData = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    userData.push({
      uid: doc.id,
      email: data.email,
      queryCount: data.queryCount,
      isPro: data.isPro,
      createdAt: data.createdAt?.toDate?.(),
      lastQueryAt: data.lastQueryAt?.toDate?.(),
    });
  });
  
  fs.writeFileSync('user_export.json', JSON.stringify(userData, null, 2));
  console.log(`Exported ${userData.length} users`);
}

exportUserData();
```

## Setting Up Automated Pro Upgrades

### After Stripe Payment Success
Create `/api/stripe-webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { upgradeToPro } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      await upgradeToPro(userId);
      console.log(`User ${userId} upgraded to Pro`);
    }
  }

  return NextResponse.json({ received: true });
}
```

### Create Checkout Session API
Create `/api/create-checkout-session/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Fermat Pro Subscription',
            description: 'Unlimited queries for your AI travel assistant',
          },
          unit_amount: 999, // $9.99
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
    metadata: {
      userId,
    },
  });

  return NextResponse.json({ sessionId: session.id });
}
```

## Testing Commands

### Check if Firestore is working
```javascript
// In browser console on your app:
const { db } = await import('./src/lib/firebase');
const { collection, getDocs } = await import('firebase/firestore');

const snapshot = await getDocs(collection(db, 'users'));
console.log(`Found ${snapshot.size} users`);
snapshot.forEach(doc => console.log(doc.id, doc.data()));
```

### Test query increment
```javascript
// In browser console:
const { incrementQueryCount } = await import('./src/lib/firebase');
const { auth } = await import('./src/lib/firebase');

await incrementQueryCount(auth.currentUser.uid);
console.log('Query count incremented!');
```

## Pricing Recommendations

### Suggested Pro Pricing
- **Monthly**: $9.99/month - Unlimited queries
- **Annual**: $89.99/year - Save 25% (2 months free)
- **Lifetime**: $199.99 - One-time payment

### Free Tier Alternatives
If 5 queries is too restrictive:
- **Option 1**: 10 queries/month with monthly reset
- **Option 2**: 5 queries total, then 1 query/day
- **Option 3**: 5 queries + 1 bonus query per friend referral

Update `FREE_QUERY_LIMIT` in `firebase.ts` to change the limit.

## Support Email Templates

### User Hit Limit Email
```
Subject: You've reached your free query limit! 🚀

Hi [User Name],

You've used all 5 free queries on Fermat! We hope you found our AI travel assistant helpful.

Want unlimited access? Upgrade to Fermat Pro:
✨ Unlimited queries
🚀 Priority support
💜 Support our backend costs

[Upgrade to Pro Button]

Thanks for using Fermat!
```

### Pro Welcome Email
```
Subject: Welcome to Fermat Pro! 🎉

Hi [User Name],

Thank you for upgrading to Fermat Pro!

You now have:
✓ Unlimited queries
✓ No restrictions
✓ Our eternal gratitude 💜

Start exploring without limits: [App Link]

Questions? Reply to this email anytime.

Happy travels!
```
