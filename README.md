# TrailPlan — Group Trip Planner

A mobile-first, offline-capable trip planning app built with React (Vite), Tailwind CSS,
Firebase (Auth + Firestore + Storage), and the free Open-Meteo weather/geocoding API.

## ✨ Features

- Email/Password + Google Auth with role-based access control (Admin / Editor / Viewer)
- 6-character trip codes for join requests, plus direct email invitations
- Trip overview with live countdown, 14-day weather forecast, and print/PDF export
- Group Logistics Hub: master flight/train/stay/cab entries, per-passenger seat &
  boarding pass uploads, and a full-screen "My Boarding Pass" quick-scan overlay
- Day-wise itinerary with inline edit
- Dual packing lists: shared (admin/editor managed) + personal (private per user),
  with one-click batch import from shared → personal
- Group expense splitter with equal-split "who owes whom" settlement calculator,
  plus private personal expenses
- Offline trail links (GPX / custom map) + GPS pin drops (campsite, water, trailhead...)
- Three themes: Light, Dark, and Outdoor/Trek (earth tones + sage green)
- Firestore offline persistence for viewing/editing trip data with no signal

## 📁 Project structure

```
planner/
├─ firebase.json / firestore.rules / firestore.indexes.json / storage.rules / .firebaserc
├─ index.html
├─ src/
│  ├─ firebase.js                # Firebase App/Auth/Firestore/Storage init
│  ├─ main.jsx / App.jsx / index.css
│  ├─ context/                   # AuthContext, ThemeContext, TripContext
│  ├─ hooks/                     # useCountdown, useWeather
│  ├─ utils/                     # rbac, split (settlement math), weather, storage, tripCode
│  └─ components/
│     ├─ auth/                   # LoginPage, SignupPage
│     ├─ dashboard/               # Dashboard, CreateTripModal, JoinTripModal
│     ├─ layout/                  # NavBar, TripTabs, ProtectedRoute
│     ├─ trip/                    # TripLayout, TripOverview, MembersPanel, Countdown, Weather
│     ├─ logistics/                # LogisticsHub, FlightCard, FlightEditModal, MyBoardingPassModal
│     ├─ itinerary/                # Itinerary, DayCard, ItineraryItem
│     ├─ packing/                  # PackingLists, SharedPackingList, PersonalPackingList
│     ├─ expenses/                 # ExpenseTracker, AddExpenseModal, ExpenseList, SettlementSummary
│     ├─ maps/                     # TrailMaps, PinList, AddPinModal
│     └─ common/                   # Modal, RoleBadge, EmptyState, ConfirmDialog
```

## 🚀 Getting started

This environment did not have Node.js/npm installed, so dependencies have not been
installed and the dev server has not been run. To get started on a machine with
Node.js 18+ installed:

```bash
npm install
cp .env.example .env   # then fill in your Firebase project config
npm run dev
```

### Firebase project setup

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication** → Email/Password and Google sign-in providers.
3. Enable **Firestore Database** (production mode) and **Storage**.
4. Copy your web app config into `.env` (see `.env.example`).
5. Deploy security rules (requires the [Firebase CLI](https://firebase.google.com/docs/cli)):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # select/link your project, update .firebaserc
   firebase deploy --only firestore:rules,storage:rules
   ```
6. Build and deploy hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## 🗄️ Firestore data model

```
users/{uid}                              { uid, email, displayName, photoURL }
invites/{inviteId}                       { tripId, tripName, email, role, status, invitedBy }
trips/{tripId}                           { tripName, destination, destCoords, tripCode,
                                            createdBy, startDate, endDate, coverPhotoUrl,
                                            members: { [uid]: { role, status, displayName,
                                                                 email, photoURL, joinedAt } } }
trips/{tripId}/logistics/main            { items: [{ id, type, provider, flightNo, pnr,
                                             fromLabel, toLabel, terminalFrom, terminalTo,
                                             departureTime, arrivalTime, notes,
                                             passengers: [{ uid, seatNo, boardingPassUrl }] }] }
trips/{tripId}/maps/main                 { gpxUrl, customMapUrl,
                                            pins: [{ id, name, category, latitude, longitude, notes }] }
trips/{tripId}/itinerary/{yyyy-MM-dd}    { dayDate, items: [{ id, time, title, description,
                                                               location, createdBy }] }
trips/{tripId}/sharedPacking/main        { items: [{ id, item, category, assignedToUid }] }
trips/{tripId}/personalPacking/{uid}     { items: [{ id, item, category, isPacked,
                                                       importedFromShared }] }
trips/{tripId}/expenses/{expenseId}      { type: 'shared'|'personal', amount, paidByUid,
                                            description, date, visibilityUid }
```

Storage layout: `trips/{tripId}/cover/*` (cover photos) and
`trips/{tripId}/boardingPasses/{uid}/*` (per-passenger boarding pass files).

### Notes on the schema vs. the original spec

- Logistics/Maps/SharedPacking are stored as a **single document named `main`**
  inside their respective subcollections (rather than a bare subcollection doc),
  so paths stay tidy while still bundling all items into one document/read/write.
- Email invitations use a small top-level `invites` collection (instead of an
  array field on the trip doc) so they can be securely queried by the invited
  user's own email via Firestore rules, without needing a Cloud Function.

## 🔐 Roles

| Action | Admin | Editor | Viewer |
| --- | --- | --- | --- |
| Approve/reject join requests, invite by email, manage roles, delete trip | ✅ | ❌ | ❌ |
| Edit trip name/destination/dates/cover photo | ✅ | ❌ | ❌ |
| Edit logistics, itinerary, shared packing, map pins, shared expenses | ✅ | ✅ | ❌ |
| View own boarding pass, manage own personal packing list & expenses | ✅ | ✅ | ✅ |

## 💸 Firebase Spark (free tier) cost optimizations

- Logistics, map pins, and shared packing items are bundled as arrays inside a
  single document per module instead of one document per item.
- Itinerary bundles all of a day's activities into one document per day.
- `onSnapshot` listeners are only attached while their tab is mounted (each
  route component subscribes in `useEffect` and unsubscribes on unmount).
- Multi-tab IndexedDB persistence (`enableMultiTabIndexedDbPersistence`) caches
  reads locally, so repeated views of the same trip do not re-bill reads.
- Edits use `setDoc(..., { merge: true })` / `updateDoc` with dot-path field
  updates (e.g. `members.{uid}.role`) instead of rewriting whole documents.
