# Artio Redefined Gallery

A premium e-commerce and portfolio website for selling museum-quality art prints and showcasing graphic design services.

---

## Project Structure & Main Components

- **src/pages/**: Main app pages (Home, About, Store, Services, Contact, Auth, Cart, Orders, Admin)
- **src/components/**: Shared UI (Header, Footer, AdminRoute, UI elements)
- **src/store/**: Zustand stores for auth, cart, theme
- **src/lib/**: Firebase app + direct Firestore data layer
- **supabase/functions/**: Edge functions for checkout, download URLs
- **supabase/migrations/**: SQL migrations for DB schema
- **public/**: Static assets, manifest, icons

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide React
- **State**: Zustand
- **Database**: Firebase Firestore (direct client integration)
- **Payments**: Stripe
- **Build**: Vite

---

## Features

- **Premium Design**: Clean, sophisticated aesthetic with glassmorphism effects and smooth animations
- **E-commerce**: Full shopping cart functionality with Stripe-ready checkout
- **Authentication**: User registration and login with Firebase Auth
- **Product Catalog**: Organized by categories with quick view and detailed product pages
- **Dark Mode**: Seamless theme switching between light and dark modes
- **PWA Support**: Installable as a Progressive Web App with offline capabilities
- **Responsive**: Fully responsive design optimized for all screen sizes

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project and service account

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   # Firebase Web SDK (frontend)
   VITE_FIREBASE_API_KEY=your_web_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Firebase Admin (only required for optional db seed script)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_client_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Seed Firestore with starter categories/products (and optional admin profile):
   ```bash
   npm run db:seed
   # optional admin bootstrap by email
   npm run db:seed -- aravindhofficiallinks@gmail.com
   ```

5. Direct client migration (no API folder required):
   ```bash
   npm run db:migrate
   # optional admin profile bootstrap
   npm run db:migrate -- aravindhofficiallinks@gmail.com
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment

Push to GitHub and import in Vercel. Add environment variables and deploy.

## Firestore Data Model

- `profiles`: user profile and role (`user`/`admin`)
- `categories`: storefront categories
- `products`: product catalog
- `addresses`: delivery addresses
- `orders`: checkout and order history

## License

Copyright © 2024 Artio Redefined Gallery. All rights reserved.