#  CupTogether

CupTogether is a social coffee discovery application built with **React Native, Expo, TypeScript, and Supabase**.

The platform allows users to discover and share Coffee Finds, follow other coffee lovers, create private groups, interact with posts, and save their favorite coffee discoveries.

 **Live Demo:** https://cuptogether.expo.app

---

##  Features

-  Share Coffee Finds
-  Rate coffees and drinks
-  Add thoughts and reviews
-  Add coffee shop locations
-  Upload Coffee Find images
-  Like Coffee Finds
-  Comment on Coffee Finds
-  Save favorite Coffee Finds
-  Create and edit user profiles
-  Follow and unfollow users
-  Discover other coffee lovers
-  Create private coffee groups
-  Join groups using invite codes
-  Share Coffee Finds with specific groups
-  Responsive mobile, tablet, and desktop layouts
-  Persistent authentication

---

##  Screenshots

Screenshots coming soon.

---

#  Tech Stack

## Frontend

- **React Native**
- **Expo**
- **Expo Router**
- **TypeScript**
- **React Context**
- **Supabase JavaScript SDK**

The same frontend codebase supports mobile and web layouts.

Responsive layouts are implemented using React Native's:

```tsx
useWindowDimensions()
```

---

## Backend

CupTogether uses **Supabase** as its backend platform.

The application uses:

- Supabase Auth
- PostgreSQL
- Row Level Security (RLS)
- Supabase Storage
- PostgreSQL Functions / RPC

The frontend communicates with Supabase using:

```text
@supabase/supabase-js
```

---

#  Project Structure

```text
CupTogether/
│
├── app/
│   │
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── add-coffee.tsx
│   │   ├── explore.tsx
│   │   ├── groups.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   │
│   ├── coffee/
│   │   └── [id].tsx
│   │
│   ├── group/
│   │   └── [id].tsx
│   │
│   ├── discover-people.tsx
│   ├── edit-profile.tsx
│   ├── followers.tsx
│   ├── following.tsx
│   ├── saved-coffees.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   ├── welcome.tsx
│   └── _layout.tsx
│
├── components/
│   └── CoffeeCard.tsx
│
├── context/
│   ├── AuthContext.tsx
│   └── CoffeeContext.tsx
│
├── lib/
│   └── supabase.ts
│
├── types/
│   └── coffee.ts
│
├── constants/
│
└── assets/
    └── images/
```

---

#  Navigation

CupTogether uses **Expo Router** with file-based routing.

The main authenticated application uses tab navigation:

```text
Feed
├── Add Coffee
├── Explore
├── Groups
└── Profile
```

Additional routes include:

- Coffee Details
- Group Details
- Discover People
- Edit Profile
- Following
- Followers
- Saved Coffees
- Login
- Signup
- Welcome

Dynamic routes are used for individual resources:

```text
/coffee/[id]
/group/[id]
```

---

#  State Management

CupTogether currently uses **React Context** for shared application state.

## AuthContext

Responsible for:

- Current authenticated user
- Authentication session
- Login state
- Authentication lifecycle

## CoffeeContext

Responsible for:

- Loading Coffee Finds
- Creating Coffee Finds
- Refreshing feed data
- Resolving profile information
- Managing Coffee Find visibility

Database responses are mapped into frontend-friendly TypeScript objects.

For example:

| Database | Application |
|---|---|
| `user_id` | `userId` |
| `user_name` | `userName` |
| `coffee_shop` | `coffeeShop` |
| `order_name` | `order` |
| `image_url` | `imageUrl` |
| `group_id` | `groupId` |
| `created_at` | `createdAt` |

---

#  Database

CupTogether uses PostgreSQL through Supabase.

Main application entities include:

```text
Profiles
Coffee Finds
Comments
Likes
Saved Coffees
Follows
Groups
Group Memberships
```

These entities are separated to keep the data model organized and allow authorization rules to be applied independently.

---

#  Coffee Finds

Coffee Finds are the main content shared inside CupTogether.

A Coffee Find can contain:

- Coffee shop
- Drink / order
- Rating
- Thoughts
- Location
- Image
- User
- Group
- Creation date

Coffee Finds can be either public or associated with a private group.

```text
Coffee Find
     │
     ├── Public
     │
     └── Private Group
```

---

#  Groups

CupTogether allows users to create private coffee groups.

Groups allow friends or communities to share Coffee Finds with a specific set of users.

Users can:

- Create groups
- Join groups
- Use invite codes
- View group members
- Share Coffee Finds with a group
- View group-specific Coffee Finds

Group membership validation is enforced by the backend.

---

#  Social Features

CupTogether includes social networking functionality.

Users can:

```text
Discover Users
      │
      ▼
Follow User
      │
      ▼
Following / Followers
      │
      ▼
Social Coffee Feed
```

This allows users to build a network of coffee lovers and discover Coffee Finds from people they follow.

---

#  Coffee Interactions

Coffee Finds support several independent interactions:

```text
Coffee Find
   │
   ├──  Likes
   ├──  Comments
   └──  Saved Coffees
```

Each interaction is stored independently and associated with the authenticated user.

---

#  Authentication

Authentication is handled using **Supabase Auth**.

Users can:

- Create an account
- Sign in
- Stay signed in between sessions
- Sign out

Authentication sessions are persisted so users normally remain signed in when reopening the application.

---

# Security

Security and authorization are enforced primarily at the backend level.

CupTogether uses **Supabase Row Level Security (RLS)** to control access to application data.

Examples include:

- Users can modify only their own profile.
- Users can manage only their own Coffee Finds.
- Social interactions are associated with the authenticated user.
- Private group content is restricted to authorized members.
- Group management actions are restricted to authorized users.

This means application security does not rely solely on hiding buttons or screens in the frontend.

> No private credentials or service-role keys are stored in the frontend repository.

---

# Group Privacy

Private group content is protected at the database level.

Conceptually:

```text
Coffee Find
     │
     ▼
Is this group content?
     │
 ┌───┴────┐
 │        │
No       Yes
 │        │
 ▼        ▼
Public   Check Membership
              │
         ┌────┴────┐
         │         │
      Member    Not Member
         │         │
         ▼         ▼
       Allow      Deny
```

This prevents unauthorized users from accessing private group Coffee Finds through direct database requests.

---

#  Image Storage

Supabase Storage is used to manage application images.

The application supports storage for:

- User avatars
- Coffee Find images
- Group avatars

Files are organized using application-generated paths associated with the appropriate user or group.

Storage permissions are also protected using backend authorization policies.

---

#  Responsive Design

CupTogether supports:

- Mobile
- Tablet
- Desktop Web

Layouts adapt using:

```tsx
useWindowDimensions()
```

Typical responsive breakpoints include:

| Device | Breakpoint |
|---|---:|
| Small Mobile | `< 380px` |
| Tablet | `>= 768px` |
| Desktop | `>= 1024px` |

Desktop layouts use maximum content widths to prevent components from stretching excessively on large displays.

---

#  Data Refresh

Screens that depend on updated profile or Coffee Find information refresh their data when appropriate.

For example:

```text
Edit Profile
     │
     ▼
Save Changes
     │
     ▼
Return to Feed
     │
     ▼
Refresh Data
     │
     ├── Profile
     └── Coffee Finds
```

This helps keep profile information, usernames, avatars, and Coffee Finds synchronized across the application.

---

#  Architecture

```text
                       ┌──────────────┐
                       │    Users     │
                       └──────┬───────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
           Web Browser                 Mobile App
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                     Expo / React Native
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
              Router       Contexts     Components
                 │            │            │
                 └────────────┴────────────┘
                              │
                              ▼
                     Supabase JS Client
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  Authentication         PostgreSQL             Storage
                              │                     │
                              ▼                     ▼
                            RLS              Storage Policies
                              │
                              ▼
                     PostgreSQL Functions
                            / RPC
```

---

#  Deployment

The web version of CupTogether is built using Expo.

Production builds can be exported using:

```bash
npx expo export --platform web
```

The production web application is deployed through EAS.

###  Live Demo

**https://cuptogether.expo.app**

The project architecture also supports future native builds for:

- iOS
- Android

---

# Local Development

Clone the repository:

```bash
git clone <your-repository-url>
```

Enter the project directory:

```bash
cd CupTogether
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```text
.env
```

Add your own Supabase project configuration:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Never commit your `.env` file or private credentials.

Start the development server:

```bash
npx expo start
```

For web development:

```bash
npx expo start --web
```

---

#  Environment Variables

The application expects the following environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Actual environment values are **not included in the repository**.

Make sure `.env` is included in `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

Never expose:

```text
Supabase service-role keys
Database passwords
Private API keys
Access tokens
User credentials
```

---

#  Project Goals

CupTogether was designed to explore and demonstrate:

- Cross-platform application development
- React Native architecture
- TypeScript
- File-based navigation
- Responsive UI development
- Authentication
- Social application features
- PostgreSQL data modeling
- Backend authorization
- Row Level Security
- Secure file storage
- Private group functionality
- Production deployment

---

#  Future Improvements

Planned improvements include:

-  Native iOS release
-  Native Android release
-  Notifications
-  Improved location-based discovery
-  Advanced Coffee Find search
-  User activity insights
-  Coffee shop discovery improvements
-  Additional group features
-  Performance optimizations

---

#  License

This project is currently intended for portfolio and educational purposes.

---

## CupTogether

**Discover coffee. Share your finds. Connect with coffee lovers.**

 **Live Demo:** https://cuptogether.expo.app
