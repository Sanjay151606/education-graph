# Project Structure Documentation

## 📂 Complete File Tree

```
education-platform-with-assessment/
│
├── app/                                    # Next.js App Directory
│   │
│   ├── education/                         # 🎓 EDUCATION PLATFORM MODULE
│   │   ├── page.tsx                      # Home page with hero, features, courses
│   │   ├── layout.tsx                    # Layout with Navigation component
│   │   │
│   │   ├── courses/                      # Course catalog section
│   │   │   └── page.tsx                 # Browse courses with filters
│   │   │
│   │   ├── dashboard/                    # Learning dashboard
│   │   │   └── page.tsx                 # Progress tracking, enrolled courses
│   │   │
│   │   ├── about/                        # About platform
│   │   │   └── page.tsx                 # Mission, team, features
│   │   │
│   │   └── contact/                      # Contact & support
│   │       └── page.tsx                 # Contact form, FAQ
│   │
│   ├── test/                             # 🎯 ASSESSMENT MODULE (INTEGRATED)
│   │   └── page.tsx                     # Test entry point with instructions
│   │
│   ├── section-a/                        # Test Section A
│   │   └── page.tsx                     # Reading & Listening (23 questions)
│   │
│   ├── section-b/                        # Test Section B
│   │   └── page.tsx                     # Speaking (4 topics)
│   │
│   ├── section-c/                        # Test Section C
│   │   └── page.tsx                     # Grammar (34 questions)
│   │
│   ├── section-d/                        # Test Section D
│   │   └── page.tsx                     # Listening Comprehension (16 questions)
│   │
│   ├── finish/                           # Test completion
│   │   └── page.tsx                     # Results and submission
│   │
│   ├── components/                       # 🧩 SHARED COMPONENTS
│   │   ├── Navigation.tsx               # Unified navigation bar
│   │   ├── JSquadBadge.tsx             # Branding badge (floating)
│   │   ├── AnimatedLogo.tsx            # Animated logo component
│   │   └── LoadingSpinner.tsx          # Loading indicator
│   │
│   ├── api/                              # 🔌 API ROUTES
│   │   ├── uploadAudio/
│   │   │   └── route.ts                # Audio file upload endpoint
│   │   └── submit/
│   │       └── route.ts                # Test submission endpoint
│   │
│   ├── globals.css                       # Global styles and animations
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Root page (redirects to /education)
│   └── not-found.tsx                     # 404 page
│
├── public/                                # Static assets
│   └── audio/
│       └── .gitkeep                      # Audio files directory
│
├── node_modules/                          # Dependencies (gitignored)
│
├── .next/                                 # Next.js build output (gitignored)
│
├── .vscode/                               # VS Code settings
│
├── .env.example                           # Environment variables template
├── .gitattributes                         # Git attributes
├── .gitignore                             # Git ignore rules
│
├── next-env.d.ts                          # Next.js TypeScript declarations
├── next.config.js                         # Next.js configuration
├── tsconfig.json                          # TypeScript configuration
├── tailwind.config.js                     # TailwindCSS configuration
├── postcss.config.js                      # PostCSS configuration
│
├── package.json                           # Project dependencies and scripts
├── package-lock.json                      # Locked dependencies
│
├── vercel.json                            # Vercel deployment config
│
├── README.md                              # Original project README
├── EDUCATION_PLATFORM_README.md           # New platform documentation
├── PROJECT_STRUCTURE.md                   # This file
├── INDEX.md                               # Documentation index
└── LICENSE                                # License file
```

## 🎯 Module Breakdown

### 1. Education Platform Module (`/app/education/`)

**Purpose**: Main learning platform with courses, dashboard, and information pages

**Pages**:
- **Home** (`page.tsx`) - Landing page with hero, features, popular courses
- **Courses** (`courses/page.tsx`) - Course catalog with filtering
- **Dashboard** (`dashboard/page.tsx`) - User learning progress and stats
- **About** (`about/page.tsx`) - Platform information and team
- **Contact** (`contact/page.tsx`) - Contact form and support

**Layout**: Uses `layout.tsx` which includes the Navigation component

**Key Features**:
- Responsive design
- Course filtering by category and level
- Progress tracking
- Assessment status integration
- Modern UI with gradients and animations

---

### 2. Assessment Module (`/app/test/`, `/app/section-*/`, `/app/finish/`)

**Purpose**: Comprehensive communication skills assessment system

**Structure**:
```
/test              → Entry point and instructions
/section-a         → Reading & Listening (23 questions)
/section-b         → Speaking (4 topics)
/section-c         → Grammar (34 questions)
/section-d         → Listening Comprehension (16 questions)
/finish            → Results and submission
```

**Key Features**:
- Audio recording with MediaRecorder API
- Strict timers
- Auto-save every 3 seconds
- Tab switch detection
- Progress persistence
- One-time recording per question

**Integration Points**:
- Accessible from education platform navigation
- Dashboard shows test progress
- Shared navigation component
- Consistent styling and branding

---

### 3. Shared Components (`/app/components/`)

**Navigation.tsx**
- Unified navigation bar
- Active state indicators
- Mobile responsive menu
- Links to all platform sections

**JSquadBadge.tsx**
- Floating branding badge
- Animated effects
- Tooltip on hover
- Consistent across all pages

**AnimatedLogo.tsx**
- Animated logo component
- Used in various sections

**LoadingSpinner.tsx**
- Loading state indicator
- Reusable across pages

---

### 4. API Routes (`/app/api/`)

**uploadAudio/route.ts**
- Handles audio file uploads
- Processes FormData
- Returns file ID
- Used by test sections

**submit/route.ts**
- Handles test submission
- Processes complete test data
- Logs submission
- Returns confirmation

---

### 5. Styling System

**globals.css**
- Custom component classes
- Animation keyframes
- Gradient effects
- Hover states
- Responsive utilities

**TailwindCSS Configuration**
- Custom color palette
- Extended animations
- Responsive breakpoints
- Custom utilities

---

## 🔄 Navigation Flow

```
User Journey:

1. Landing (/)
   ↓
2. Education Home (/education)
   ├─→ Browse Courses (/education/courses)
   ├─→ View Dashboard (/education/dashboard)
   ├─→ Learn About Platform (/education/about)
   ├─→ Contact Support (/education/contact)
   └─→ Take Assessment (/test)
       ├─→ Section A (/section-a)
       ├─→ Section B (/section-b)
       ├─→ Section C (/section-c)
       ├─→ Section D (/section-d)
       └─→ Finish & Submit (/finish)
           └─→ Back to Dashboard (/education/dashboard)
```

---

## 📊 Data Flow

### LocalStorage Structure
```typescript
{
  // User Information
  candidateName: string
  testStartTime: string (ISO timestamp)
  
  // Test Answers
  answers: {
    sectionA: {
      [questionId]: {
        fileId: string
        timestamp: string
        type: 'Read Aloud' | 'Listen and Repeat'
      }
    }
    sectionB: {
      [topicId]: {
        fileId: string
        timestamp: string
        topic: string
      }
    }
    sectionC: {
      [questionId]: {
        answer: string
        timestamp: string
      }
    }
    sectionD: {
      [questionId]: {
        answer: string
        timestamp: string
      }
    }
  }
  
  // Progress Tracking
  progress: {
    section: string
    currentQuestion: number
    tabSwitches: number
    timestamp: string
  }
}
```

### API Data Flow
```
Client (Browser)
    ↓
    ├─→ Audio Recording → FormData → /api/uploadAudio → File Storage
    │                                      ↓
    │                                  Returns fileId
    │                                      ↓
    └─→ Test Completion → JSON → /api/submit → Logging/Database
                                      ↓
                                  Returns success
```

---

## 🎨 Design System

### Color Palette
```css
Primary:   Blue (#2563eb) → Indigo (#4f46e5)
Secondary: Purple (#9333ea) → Pink (#ec4899)
Success:   Green (#16a34a) → Emerald (#059669)
Warning:   Yellow (#eab308) → Amber (#f59e0b)
Danger:    Red (#dc2626) → Pink (#ec4899)
Accent:    Gold (#fbbf24) → Amber (#f59e0b)
```

### Typography
```
Headings:  Bold, 2xl-6xl, gradient text
Body:      Regular, base-lg, gray-700
Buttons:   Semibold, base-xl, white
Labels:    Semibold, sm, gray-700
```

### Spacing
```
Cards:     p-6 to p-8
Sections:  py-12 to py-20
Gaps:      gap-4 to gap-8
Margins:   mb-4 to mb-12
```

---

## 🔧 Configuration Files

### next.config.js
- Next.js configuration
- Build settings
- Environment variables

### tsconfig.json
- TypeScript compiler options
- Path aliases
- Module resolution

### tailwind.config.js
- Custom colors
- Extended utilities
- Plugin configuration

### postcss.config.js
- TailwindCSS processing
- Autoprefixer

### vercel.json
- Deployment configuration
- Build settings
- Environment variables

---

## 📦 Dependencies

### Production
- `next` - React framework
- `react` - UI library
- `react-dom` - React DOM renderer
- `formidable` - Form data parsing

### Development
- `typescript` - Type safety
- `tailwindcss` - Utility-first CSS
- `autoprefixer` - CSS vendor prefixes
- `postcss` - CSS processing
- `@types/*` - TypeScript definitions

---

## 🚀 Build & Deployment

### Development
```bash
npm run dev          # Start dev server on port 5001
```

### Production
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Deployment
```bash
vercel               # Deploy to Vercel
vercel --prod        # Deploy to production
```

---

## 📝 File Naming Conventions

### Pages
- `page.tsx` - Route page component
- `layout.tsx` - Layout wrapper
- `not-found.tsx` - 404 page

### Components
- `PascalCase.tsx` - React components
- Descriptive names (Navigation, JSquadBadge)

### API Routes
- `route.ts` - API endpoint handler
- Folder name = endpoint path

### Styles
- `globals.css` - Global styles
- Component styles inline with Tailwind

---

## 🔐 Security Considerations

### Client-Side
- Input validation
- XSS prevention
- LocalStorage encryption (future)

### Server-Side
- File upload validation
- Size limits
- Type checking
- Sanitization

---

## 🧪 Testing Strategy

### Manual Testing
- [ ] All navigation links work
- [ ] Forms validate correctly
- [ ] Audio recording functions
- [ ] Timers count down properly
- [ ] Data persists correctly
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Automated Testing (Future)
- Unit tests for components
- Integration tests for flows
- E2E tests for user journeys
- API endpoint tests

---

## 📈 Performance Optimization

### Current
- Next.js automatic code splitting
- Image optimization
- CSS purging with Tailwind
- Lazy loading components

### Future
- Server-side rendering
- Static generation where possible
- CDN for static assets
- Database query optimization

---

## 🎯 Key Integration Points

### Education ↔ Assessment
1. **Navigation**: Unified nav bar on all pages
2. **Dashboard**: Shows test progress and results
3. **Styling**: Consistent design system
4. **Branding**: J-SQUAD badge on all pages
5. **Data**: Shared LocalStorage for user info

### Component Reusability
- Navigation used in both modules
- JSquadBadge appears everywhere
- Shared CSS classes and animations
- Consistent color scheme

---

## 📚 Documentation Files

1. **README.md** - Original test platform docs
2. **EDUCATION_PLATFORM_README.md** - New platform guide
3. **PROJECT_STRUCTURE.md** - This file
4. **INDEX.md** - Documentation index

---

**Last Updated**: February 2026
**Version**: 2.0.0
**Maintained by**: J-SQUAD
