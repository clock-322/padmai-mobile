# Padmai Authentication System

## Overview
This is a demo-only authentication system for the Padmai School Management React Native app. All authentication is handled in-memory and does not persist to the filesystem.

## Features

### 🔐 Authentication
- **Role-based access**: Parent, Teacher, School Owner
- **Email/Password login** with validation
- **Quick login buttons** for demo purposes
- **User registration** with role selection
- **In-memory data storage** (resets on app reload)

### 📱 User Interface
- **Modern education-themed design** with soft colors and rounded corners
- **Accessible components** with proper labels and touch targets
- **Form validation** with real-time feedback
- **Password strength indicator**
- **Demo mode banners** to indicate in-memory storage

### 🎯 Demo Credentials
- **Parent**: `parent@padmai.demo` / `Demo@123`
- **Teacher**: `teacher@padmai.demo` / `Demo@123`
- **School Owner**: `owner@padmai.demo` / `Demo@123`


## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication context and logic
├── providers/
│   └── DataProvider.tsx         # Static data provider
├── navigation/
│   ├── AuthStack.tsx            # Authentication navigation stack
│   ├── BottomTabs.tsx          # Main app bottom tabs
│   └── RootNavigation.tsx      # Root navigation logic
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx     # Login with quick demo buttons
│   │   └── RegisterScreen.tsx  # Registration with role selection
│   └── HomePlaceholder.tsx     # Placeholder home screen
├── assets/data/
│   ├── users.json              # Seed user data
│   ├── students.json           # Student data
│   ├── attendance.json         # Attendance records
│   ├── events.json             # School events
│   └── payments.json           # Payment records
└── types/
    └── auth.ts                 # TypeScript type definitions
```

## Usage

### Quick Login (Demo)
1. Open the app
2. Use the quick login buttons:
   - "Login as Parent" - logs in as Sarah Johnson
   - "Login as Teacher" - logs in as Michael Chen  
   - "Login as School Owner" - logs in as Dr. Emily Rodriguez

### Manual Login
1. Enter email and password
2. Tap "Sign In"
3. Invalid credentials will show error messages

### Registration
1. Tap "Sign Up" on login screen
2. Fill in all required fields
3. Select role (Parent/Teacher/School Owner)
4. For parents, optionally enter Child ID
5. Tap "Create Account"

### Navigation
- **Unauthenticated**: Shows AuthStack (Login/Register)
- **Authenticated**: Shows BottomTabs with Home screen
- **Logout**: Returns to login screen

## Technical Details

### Data Storage
- All user data is stored in-memory using React Context
- Static seed data loaded from JSON files
- No persistence to device storage
- Data resets on app reload

### Validation
- Email format validation
- Password minimum length (6 characters)
- Password confirmation matching
- Required field validation
- Real-time password strength indicator

### Accessibility
- Proper accessibility labels on all inputs
- Screen reader compatible
- High contrast colors
- Large touch targets (minimum 44pt)

## Demo Mode Features
- Clear indicators that data is in-memory only
- Quick login buttons for easy testing
- Console logging for debugging
- No real authentication or data persistence

## Development Notes
- This is a demonstration system only
- Do not use in production without proper security measures
- Real authentication would require:
  - Secure password hashing
  - JWT tokens or session management
  - API integration
  - Data persistence
  - Input sanitization
  - Rate limiting
