## 🚀 Features

- **Authentication & Authorization**: jwt Auth with role-based access control (Admin, Client, Remplacant)
- **Responsive Dashboard**: Overview cards, charts, and real-time metrics
- **Staff Management**: CRUD operations for staff and substitute management
- **Modern UI/UX**: Clean, accessible interface with dark/light theme support
- **Type Safety**: Fully typed with TypeScript and Zod validation
- **API Integration**: Typed API client with React Query for state management
- **Production Ready**: Error boundaries, loading states, and health monitoring

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15** - App Router with TypeScript
- **React 18** - Latest stable version
- **TypeScript** - Strict type checking

### UI & Styling
- **ShadCN/UI v2.7.0** - Accessible component library
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Next Themes** - Dark/light mode support

### State Management & Data Fetching
- **TanStack React Query** - Server state management
- **Axios** - HTTP client with interceptors

### Authentication & Backend
- **Firebase Authentication** - JWT-based auth
- **NestJS API** - Backend integration
- **OpenAPI** - API documentation and types

### Development Tools
- **ESLint & Prettier** - Code quality and formatting
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
solugarde-admin/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Dashboard page
│   ├── template.tsx             # App template with layout
│   └── login/
│       └── page.tsx             # Login page
├── components/                   # Reusable components
│   ├── auth/
│   │   └── ProtectedRoute.tsx   # Route protection
│   ├── layout/
│   │   ├── MainLayout.tsx       # Main app layout
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── Header.tsx           # Top navigation
│   ├── providers/
│   │   └── AppProviders.tsx     # Context providers
│   └── ui/                      # ShadCN UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── lib/
│   ├── api-client.ts            # Typed API client
│   ├── firebase.ts              # Firebase configuration
│   ├── query-client.ts          # React Query setup
│   ├── health-check.ts          # API health monitoring
│   └── utils.ts                 # Utility functions
├── types/
│   └── api.ts                   # TypeScript API types
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind configuration
├── package.json                 # Dependencies
└── .env.local.example           # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or pnpm
- Firebase project
- Access to the Solugarde API

### Installation

1. **Clone and install dependencies:**
```bash
git clone 
cd solugarde-admin
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Fill in your environment variables:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://solugarde-dev-production.up.railway.app/api/v1

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

The application uses Firebase Authentication with custom JWT tokens. Three user roles are supported:

- **Admin**: Full system access
- **Client**: Daycare management features
- **Remplacant**: Substitute staff features
 

## 🎨 UI Components

Built with ShadCN/UI for consistency and accessibility:

- **Cards & Layouts**: Dashboard stats, content containers
- **Forms**: Login, user management, data entry
- **Navigation**: Sidebar with role-based menu items
- **Feedback**: Toasts, loading states, error boundaries
- **Theme**: Automatic dark/light mode support

## 🔌 API Integration

### Health Check
The app includes built-in API health monitoring:
```typescript
import { performHealthCheck } from '@/lib/health-check';

const result = await performHealthCheck();
console.log('API Status:', result.isHealthy ? 'Healthy' : 'Unhealthy');
```

### API Client Usage
```typescript
import { apiClient } from '@/lib/api-client';

// Get current user
const user = await apiClient.getMe();

// Fetch dashboard data
const dashboardData = await apiClient.getAdminDashboard();

// Create a new user
const newUser = await apiClient.createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'client'
});
```

## 📊 Features Overview

### Dashboard
- Role-based metrics and insights
- Interactive charts (attendance, revenue, staff distribution)
- Quick action buttons
- Real-time notifications

### Staff Management
- User CRUD operations
- Role assignment and permissions
- Profile management
- Availability tracking

### Authentication & Security
- JWT token handling with automatic refresh
- Role-based route protection
- Secure API communication
- Session persistence

## 🧪 Development

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

### Build & Deploy
```bash
# Production build
npm run build

# Start production server
npm run start
```

## 🚀 Deployment

The application is optimized for deployment on:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Docker** containers

### Environment Variables for Production
Ensure all environment variables are set in your deployment platform:
- Firebase configuration
- API endpoints
- Analytics IDs (optional)

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use TypeScript strictly - no `any` types
3. Test your changes thoroughly
4. Update documentation as needed

## 📝 License

This project is proprietary software developed for Solugarde.

## 🆘 Support

For technical support or questions about the implementation, please contact the development team.

---

**Built with ❤️ for Solugarde** - Making daycare management effortless.