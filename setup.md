# Solugarde Admin MVP Setup - Claude CLI Prompt

You are a senior full-stack engineer setting up the **Solugarde Admin Web Application MVP** for a client. This is a production-ready daycare staff management platform, NOT a demo.

## Current Situation
- Next.js 15 project already created
- README.md exists with full project specification
- Need to clean up, initialize ShadCN properly, and create complete file structure

## Tasks to Complete

### 1. ANALYZE & CLEAN PROJECT
- Read and understand the README.md thoroughly
- Remove ALL default Next.js files that we don't need:
  - `app/page.tsx` (default one)
  - `app/favicon.ico` 
  - Any default components or pages
  - Clean up default `app/globals.css` (we'll replace it)
- Keep only essential Next.js files: `next.config.js`, `package.json`, `tsconfig.json`

### 2. INITIALIZE SHADCN/UI PROPERLY
- Run: `npx shadcn@latest init` with these settings:
  - TypeScript: Yes
  - Style: New York
  - Base color: Slate  
  - Global CSS file: `app/globals.css`
  - CSS variables: Yes
  - Tailwind config: `tailwind.config.js`
  - Components directory: `components/ui`
  - Utils location: `lib/utils.ts`
  - React Server Components: Yes
  - Import alias: `@/*`

### 3. INSTALL REQUIRED DEPENDENCIES
Based on README, install these exact dependencies:

```bash
# Core dependencies
npm install firebase axios @tanstack/react-query @tanstack/react-query-devtools
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install recharts date-fns js-cookie next-themes react-hot-toast

# Dev dependencies  
npm install --save-dev @types/js-cookie prettier eslint-config-prettier eslint-plugin-prettier
```

### 4. CREATE COMPLETE FILE STRUCTURE
Based on the README project structure, create ALL these files and folders (EMPTY files, no content):

```
solugarde-admin/
├── app/
│   ├── globals.css                 # Will be replaced with ShadCN version
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Dashboard page  
│   ├── template.tsx                # App template with layout
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── staff/
│   │   └── page.tsx                # Staff management page
│   ├── garderies/
│   │   └── page.tsx                # Garderies page  
│   ├── applications/
│   │   └── page.tsx                # Applications page
│   ├── schedules/
│   │   └── page.tsx                # Schedules page
│   ├── timesheets/
│   │   └── page.tsx                # Timesheets page
│   ├── invoices/
│   │   └── page.tsx                # Invoices page
│   ├── reports/
│   │   └── page.tsx                # Reports page
│   ├── settings/
│   │   └── page.tsx                # Settings page
│   └── loading.tsx                 # Global loading component
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx      # Route protection
│   │   ├── LoginForm.tsx           # Login form component
│   │   └── AuthGuard.tsx           # Auth guard wrapper
│   ├── layout/
│   │   ├── MainLayout.tsx          # Main app layout
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── Header.tsx              # Top navigation
│   │   └── Footer.tsx              # Footer component
│   ├── providers/
│   │   └── AppProviders.tsx        # Context providers
│   ├── dashboard/
│   │   ├── StatsCard.tsx           # Dashboard stats cards
│   │   ├── ChartSection.tsx        # Charts component
│   │   └── QuickActions.tsx        # Quick action buttons
│   ├── staff/
│   │   ├── StaffTable.tsx          # Staff data table
│   │   ├── StaffForm.tsx           # Staff create/edit form
│   │   └── StaffCard.tsx           # Staff card component
│   ├── common/
│   │   ├── DataTable.tsx           # Reusable data table
│   │   ├── SearchInput.tsx         # Search input component
│   │   ├── DateRangePicker.tsx     # Date range picker
│   │   ├── StatusBadge.tsx         # Status badge component
│   │   └── LoadingSpinner.tsx      # Loading spinner
│   └── ui/                         # ShadCN components (will be auto-created)
├── contexts/
│   ├── AuthContext.tsx             # Authentication context
│   ├── ThemeContext.tsx            # Theme context (if needed beyond next-themes)
│   └── AppContext.tsx              # Global app context
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   ├── useApi.ts                   # API hooks
│   ├── useLocalStorage.ts          # Local storage hook
│   └── useDebounce.ts              # Debounce hook
├── lib/
│   ├── api-client.ts               # Typed API client
│   ├── firebase.ts                 # Firebase configuration
│   ├── query-client.ts             # React Query setup
│   ├── health-check.ts             # API health monitoring
│   ├── auth.ts                     # Auth utilities
│   ├── validations.ts              # Zod schemas
│   ├── constants.ts                # App constants
│   ├── utils.ts                    # Utility functions (ShadCN will create)
│   └── db.ts                       # Database utilities (if needed)
├── types/
│   ├── api.ts                      # TypeScript API types
│   ├── auth.ts                     # Auth-related types
│   ├── database.ts                 # Database types
│   └── global.ts                   # Global type definitions
├── styles/                         # Additional styles if needed
│   └── components.css              # Component-specific styles
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   ├── og-image.png
│   └── manifest.json
├── .env.local.example              # Environment variables template
├── .env.local                      # Actual env file (create empty)
├── .gitignore                      # Git ignore file
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind configuration  
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
├── README.md                       # Project documentation (exists)
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
└── components.json                 # ShadCN configuration (auto-created)
```

### 5. CONFIGURE ESSENTIAL FILES

Create these configuration files with basic setup:

**`.eslintrc.json`:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

**`.prettierrc`:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**`tsconfig.json` (update paths):**
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 6. CREATE PACKAGE.JSON SCRIPTS
Ensure package.json has these scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next"
  }
}
```

### 7. INSTALL SPECIFIC SHADCN COMPONENTS
Install these commonly needed ShadCN components:
```bash
npx shadcn@latest add button card input label avatar dropdown-menu popover toast table badge dialog select textarea checkbox switch
```

### 8. CREATE BASIC NEXT.CONFIG.JS
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
```

## IMPORTANT REQUIREMENTS

1. **NO CONTENT**: Create all files empty - user will add content
2. **PRODUCTION-READY**: This is for a client MVP, not a demo
3. **LATEST VERSIONS**: Use latest stable versions of all packages
4. **STRICT TYPING**: Ensure TypeScript strict mode is enabled
5. **CLEAN STRUCTURE**: Remove any default Next.js files we don't need
6. **SHADCN LATEST**: Use the newest ShadCN version with proper initialization

## VERIFICATION STEPS

After setup, verify:
- [ ] `npm run dev` works without errors
- [ ] `npm run build` completes successfully  
- [ ] `npm run type-check` passes
- [ ] ShadCN components are properly installed
- [ ] All folders and files exist as per README structure
- [ ] No default Next.js files remain
- [ ] ESLint and Prettier are configured

## OUTPUT EXPECTED

Provide a summary of:
1. What files were removed
2. What dependencies were installed
3. What ShadCN components were added
4. Any issues encountered and how they were resolved
5. Confirmation that the project structure matches the README exactly

Remember: This is a client MVP for a startup - everything must be production-ready and professional.