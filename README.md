# Spend Sense 💰

> A clean, ultra-simple Digital Budget Tracker for college students.

**Live site:** [your-username.github.io/spend-sense](https://your-username.github.io/spend-sense)

---

## Features

- 🎯 **Daily Safe-to-Spend** — know exactly how much you can spend today
- 📊 **Budget Overview** — allowance, spent, remaining at a glance
- 🍔🚌🎉 **3 Categories** — Food, Transit, Fun
- 🔒 **Secure Login** — Firebase Email/Password authentication
- ☁️ **Cloud Sync** — data syncs across all your devices
- 📱 **Mobile Friendly** — works great on phones

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | HTML + CSS + Vanilla JS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Hosting | GitHub Pages |

---

## Setup Instructions

### 1. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → name it `spend-sense`
3. Disable Google Analytics (optional) → Create project

### 2. Enable Authentication

1. In Firebase Console → **Authentication** → **Get Started**
2. **Sign-in method** → **Email/Password** → Enable → Save

### 3. Create Firestore Database

1. In Firebase Console → **Firestore Database** → **Create Database**
2. Choose **Start in test mode** → Select your region → Done

### 4. Register Web App

1. In Firebase Console → **Project Settings** (⚙️ gear icon)
2. Scroll to **Your apps** → Click **</>** (Web)
3. Register app (name: `spend-sense-web`)
4. Copy the `firebaseConfig` object

### 5. Add Your Config

Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "your-actual-api-key",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

### 6. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Spend Sense"
git remote add origin https://github.com/YOUR_USERNAME/spend-sense.git
git push -u origin main
```

### 7. Enable GitHub Pages

1. Go to your GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, Folder: `/ (root)` → Save
4. Your site will be live at `https://YOUR_USERNAME.github.io/spend-sense`

---

## Project Structure

```
Spend Sense/
├── index.html          # Landing page
├── auth.html           # Login / Register
├── dashboard.html      # Main budget tracker
├── profile.html        # Settings / profile
├── css/
│   ├── global.css      # Design system
│   ├── landing.css     # Landing page styles
│   ├── auth.css        # Auth form styles
│   └── dashboard.css   # Dashboard styles
├── js/
│   ├── firebase-config.js   # Firebase init (add your keys here)
│   ├── auth.js              # Login / signup / logout logic
│   ├── dashboard.js         # Budget logic + Firestore CRUD
│   └── landing.js           # Landing page animations
└── .nojekyll               # GitHub Pages configuration
```

---

## Firestore Security Rules (Recommended)

After testing, update your Firestore rules to:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures each user can only access their own data.

---

Made with ❤️ for students who want to stop running out of money.
