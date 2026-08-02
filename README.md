# Travel Planner

A full-stack, mobile-responsive web app for trip planning with day-wise itineraries, dual packing lists, group expense splitting, flight logistics with boarding pass scanning, weather forecasts, and offline trail maps.

## Tech Stack

- **React** (Vite) + JavaScript
- **Tailwind CSS** + Lucide Icons
- **Firebase** v10+ (Auth, Firestore, Storage) with offline persistence
- **Open-Meteo API** for weather forecasts

## Features

- Email/Password + Google authentication with RBAC (Admin, Editor, Viewer)
- Trip join via 6-character code with admin approval
- Live countdown timer with trip status (Upcoming / In Progress / Completed)
- Read-only by default UI with explicit Edit modals
- Group flight logistics with per-traveler seat numbers and boarding pass uploads
- Full-screen "My Boarding Pass" scanner overlay
- Day-wise itinerary timeline
- Shared + personal packing lists with batch import
- Shared expense pool with equal-split calculator and settlement summary
- 14-day weather widget (forecast or historical)
- Trail maps with GPX links, map embeds, and GPS pin drops
- Dark, Light, and Outdoor/Trek themes

## Project Structure

```
travel_planner/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .env.example
├── public/
│   └── vite.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── firebase.js
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── ThemeContext.jsx
    │   └── TripContext.jsx
    ├── hooks/
    │   ├── useFirestoreDoc.js
    │   └── useFirestoreCollection.js
    ├── utils/
    │   ├── dates.js
    │   ├── expenses.js
    │   └── roles.js
    ├── components/
    │   ├── layout/
    │   │   ├── Header.jsx
    │   │   └── CountdownTimer.jsx
    │   ├── ui/
    │   │   ├── Modal.jsx
    │   │   └── ReadOnlyField.jsx
    │   ├── Logistics.jsx
    │   ├── Itinerary.jsx
    │   ├── PackingList.jsx
    │   ├── ExpenseTracker.jsx
    │   ├── WeatherWidget.jsx
    │   └── MapHub.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── TripSelectPage.jsx
        ├── TripDashboard.jsx
        └── MembersModal.jsx
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**

   Copy `.env.example` to `.env` and fill in your Firebase project credentials:

   ```bash
   cp .env.example .env
   ```

3. **Firebase Console setup**

   - Enable **Email/Password** and **Google** authentication
   - Create a **Firestore** database
   - Create a **Storage** bucket
   - Set Firestore security rules (example below)
   - Set Storage security rules (example below)

4. **Run dev server**

   ```bash
   npm run dev
   ```

## Firestore Security Rules (starter)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isMember(tripId) {
      return request.auth != null
        && get(/databases/$(database)/documents/trips/$(tripId)).data.members[request.auth.uid].status == 'approved';
    }
    function isEditor(tripId) {
      let role = get(/databases/$(database)/documents/trips/$(tripId)).data.members[request.auth.uid].role;
      return isMember(tripId) && (role == 'admin' || role == 'editor');
    }

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if isEditor(tripId) || (
        request.auth != null &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['members'])
      );
      match /{subcollection}/{docId} {
        allow read: if isMember(tripId);
        allow write: if isEditor(tripId);
      }
      match /personalPacking/{uid} {
        allow read, write: if isMember(tripId) && request.auth.uid == uid;
      }
      match /expenses/{expenseId} {
        allow read: if isMember(tripId);
        allow create: if isMember(tripId);
        allow update, delete: if isMember(tripId) && (
          resource.data.paidByUid == request.auth.uid || isEditor(tripId)
        );
      }
    }
  }
}
```

## Storage Rules (starter)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /trips/{tripId}/boarding-passes/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Build

```bash
npm run build
npm run preview
```
