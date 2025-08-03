# Design Rating App

A React TypeScript application for collecting user information and rating design images, built with Vite, TailwindCSS, and Firebase.

## Features

- **Form Collection**: Collect user name, age, gender, and optional contact information
- **Design Rating**: Rate designs from Firestore with star ratings
- **Firebase Integration**: Store responses in Firestore and upload design images to Firebase Storage
- **Admin Panel**: Upload and manage design images (password: `admin123`)
- **Responsive Design**: Fully optimized for mobile (375px), iPad (768px), laptops (1024px), and large desktops (1280px+)
- **Lottie Animations**: Confetti animation on thank you page

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Firebase Storage
4. Create two collections in Firestore:
   - `designs` - for storing design information
   - `responses` - for storing user responses
5. Set up Firebase Storage rules for public read and authenticated write

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── FormPage.tsx          # User information collection
│   ├── RatePage.tsx          # Design rating interface
│   ├── ThankYouPage.tsx      # Success page with animation
│   └── StarRating.tsx        # Reusable star rating component
├── admin/
│   └── AdminPage.tsx         # Admin panel for uploading designs
├── context/
│   └── UserContext.tsx       # React Context for user data
├── firebase/
│   └── config.ts            # Firebase configuration
└── App.tsx                  # Main app with routing
```

## Routes

- `/` - Form page for user information
- `/rate` - Design rating page
- `/thankyou` - Thank you page with confetti animation
- `/admin` - Admin panel (password: `admin123`)

## Data Structure

### Designs Collection (`designs`)
```typescript
{
  name: string;
  imageUrl: string;
  filename: string;
  uploadedAt: string;
}
```

### Responses Collection (`responses`)
```typescript
{
  userInfo: {
    name: string;
    age: number;
    gender: string;
    contact?: string;
  };
  ratings: Array<{
    designId: string;
    designQuality: number;
    buyIntention: number;
  }>;
  timestamp: ServerTimestamp;
}
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase Firestore, Firebase Storage
- **Routing**: React Router DOM v6
- **State Management**: React Context
- **Animations**: Lottie React
- **Form Validation**: Custom validation

## Responsive Design

The application is fully optimized for all screen sizes:
- **Mobile devices** (375px and up) - Single column layouts, touch-friendly controls
- **iPad portrait** (768px and up) - Two-column grids, larger form elements
- **Laptops** (1024px and up) - Multi-column layouts, side-by-side content, larger text
- **Large desktops** (1280px and up) - Maximum grid columns, spacious layouts
- **Extra large screens** (1536px and up) - Optimized for 4K displays

### Responsive Features:
- **Adaptive containers**: Max-width increases with screen size
- **Flexible grids**: 1-5 columns depending on screen size
- **Scalable typography**: Text sizes adjust for readability
- **Touch-friendly elements**: Larger buttons and inputs on bigger screens
- **Smart layouts**: Side-by-side content on laptops, stacked on mobile

## Admin Features

Access the admin panel at `/admin` with password `admin123` to:
- **Upload new design images** with automatic Firebase Storage and Firestore integration
- **Manage existing designs** with a visual grid layout showing all uploaded designs
- **Delete designs** with confirmation prompts (removes both Storage files and Firestore documents)
- **Preview images** before uploading with real-time file validation
- **Refresh design list** to sync with latest database changes
- **View upload dates** and design statistics

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```