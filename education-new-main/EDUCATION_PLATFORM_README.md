# Education Platform with Integrated Assessment System

## 🎓 Overview

A comprehensive education platform that seamlessly integrates a professional assessment/testing system. Built with Next.js 14, TypeScript, and TailwindCSS.

## ✨ Features

### Education Platform
- **Home Page** - Hero section, features overview, popular courses, stats
- **Courses** - Browse courses with filtering by category and level
- **Dashboard** - Track learning progress, view enrolled courses, upcoming tasks
- **About** - Mission, vision, team, technology stack
- **Contact** - Contact form, FAQ, support information

### Assessment System (Integrated)
- **Section A** - Reading & Listening (23 questions)
- **Section B** - Speaking (4 topics)
- **Section C** - Grammar (34 questions)
- **Section D** - Listening Comprehension (16 questions)
- **Total**: 77 questions with audio recording, timers, and auto-save

## 📁 Project Structure

```
app/
├── education/                    # Education Platform Module
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Education layout with navigation
│   ├── courses/
│   │   └── page.tsx            # Courses catalog
│   ├── dashboard/
│   │   └── page.tsx            # Learning dashboard
│   ├── about/
│   │   └── page.tsx            # About page
│   └── contact/
│       └── page.tsx            # Contact page
│
├── test/                        # Assessment Module (Integrated)
│   └── page.tsx                # Test entry point
│
├── section-a/                   # Test Section A
│   └── page.tsx
├── section-b/                   # Test Section B
│   └── page.tsx
├── section-c/                   # Test Section C
│   └── page.tsx
├── section-d/                   # Test Section D
│   └── page.tsx
├── finish/                      # Test completion
│   └── page.tsx
│
├── components/                  # Shared Components
│   ├── Navigation.tsx          # Unified navigation bar
│   ├── JSquadBadge.tsx        # Branding badge
│   ├── AnimatedLogo.tsx       # Animated logo
│   └── LoadingSpinner.tsx     # Loading component
│
├── api/                        # API Routes
│   ├── uploadAudio/
│   │   └── route.ts           # Audio upload endpoint
│   └── submit/
│       └── route.ts           # Test submission endpoint
│
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout
└── page.tsx                    # Root redirect to /education
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd <project-folder>
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:5001
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563eb) to Indigo (#4f46e5)
- **Secondary**: Purple (#9333ea) to Pink (#ec4899)
- **Success**: Green (#16a34a) to Emerald (#059669)
- **Warning**: Yellow (#eab308) to Amber (#f59e0b)
- **Danger**: Red (#dc2626) to Pink (#ec4899)

### Typography
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable sans-serif
- **Buttons**: Semibold with hover effects

### Components
- **Cards**: Rounded corners, shadows, hover effects
- **Buttons**: Gradient backgrounds, transform on hover
- **Navigation**: Sticky header with active state indicators
- **Badges**: Animated, gradient effects

## 🔗 Navigation Flow

```
Root (/) 
  → Redirects to /education

/education (Home)
  ├── /education/courses (Browse Courses)
  ├── /test (Assessment Entry) ← Integrated Test Module
  │   ├── /section-a
  │   ├── /section-b
  │   ├── /section-c
  │   ├── /section-d
  │   └── /finish
  ├── /education/dashboard (Learning Dashboard)
  ├── /education/about (About Platform)
  └── /education/contact (Contact & Support)
```

## 🎯 Key Features

### Unified Navigation
- Consistent navigation across all pages
- Active state indicators
- Mobile-responsive menu
- Smooth transitions

### Seamless Integration
- Test module accessible from education platform
- Shared design system and components
- Consistent branding (J-SQUAD)
- Unified user experience

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interfaces
- Adaptive layouts

### Modern UI/UX
- Gradient backgrounds
- Smooth animations
- Hover effects
- Loading states
- Success/error feedback

## 📊 Assessment Features

### Auto-Save
- Progress saved every 3 seconds
- LocalStorage persistence
- Resume capability

### Audio Recording
- MediaRecorder API
- One-time recording per question
- Automatic upload
- File management

### Timers
- Strict time limits
- Visual countdown
- Auto-progression

### Tab Monitoring
- Detects tab switches
- Warning system
- Integrity tracking

## 🔧 Configuration

### Port Configuration
```json
// package.json
"scripts": {
  "dev": "next dev -p 5001",
  "start": "next start -p 5001"
}
```

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 📱 Pages Overview

### Education Platform

#### Home (`/education`)
- Hero section with CTA buttons
- Feature highlights
- Popular courses showcase
- Assessment CTA
- Platform statistics

#### Courses (`/education/courses`)
- Course catalog with filters
- Category filtering
- Level filtering (Beginner/Intermediate/Advanced)
- Course cards with details
- Enrollment buttons

#### Dashboard (`/education/dashboard`)
- Welcome header
- Learning statistics
- Assessment status tracking
- Enrolled courses progress
- Recent activity feed
- Upcoming tasks
- Quick actions
- Learning streak tracker

#### About (`/education/about`)
- Mission & vision
- Platform impact statistics
- Feature highlights
- Team members
- Technology stack
- Core values

#### Contact (`/education/contact`)
- Contact methods
- Contact form
- FAQ section
- Quick links
- Support hours

### Assessment Module

#### Test Entry (`/test`)
- Test overview
- Section breakdown
- Instructions
- Name input
- Start/Continue options
- Back to education link

#### Test Sections (`/section-a`, `/section-b`, `/section-c`, `/section-d`)
- Question display
- Timer countdown
- Audio recording
- Progress tracking
- Navigation controls
- Auto-save functionality

#### Finish (`/finish`)
- Completion summary
- Section statistics
- Submission confirmation
- Return to platform

## 🎨 Styling

### Global Styles (`globals.css`)
- Custom component classes
- Animation keyframes
- Gradient effects
- Hover states
- Responsive utilities

### TailwindCSS
- Utility-first approach
- Custom color palette
- Responsive breakpoints
- Custom animations

## 🔐 Data Management

### LocalStorage Keys
- `candidateName` - User name
- `testStartTime` - Test start timestamp
- `answers` - Test responses
- `progress` - Current progress

### Data Structure
```typescript
{
  candidateName: string
  testStartTime: string
  answers: {
    sectionA: { [questionId]: { fileId, timestamp, type } }
    sectionB: { [questionId]: { fileId, timestamp, type } }
    sectionC: { [questionId]: { answer, timestamp } }
    sectionD: { [questionId]: { answer, timestamp } }
  }
  progress: {
    section: string
    currentQuestion: number
    tabSwitches: number
    timestamp: string
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
vercel --prod
```

### Build for Production
```bash
npm run build
npm start
```

## 🧪 Testing Checklist

### Education Platform
- [ ] Home page loads correctly
- [ ] Navigation works on all pages
- [ ] Course filtering functions
- [ ] Dashboard displays data
- [ ] Contact form submits
- [ ] Mobile responsive
- [ ] All links work

### Assessment Module
- [ ] Test entry page loads
- [ ] Name validation works
- [ ] Section navigation
- [ ] Audio recording
- [ ] Timer countdown
- [ ] Auto-save functionality
- [ ] Progress persistence
- [ ] Submission process

### Integration
- [ ] Navigation between education and test
- [ ] Consistent styling
- [ ] Shared components work
- [ ] Back navigation functions
- [ ] Dashboard shows test status

## 📝 Customization Guide

### Branding
1. Update logo in `Navigation.tsx`
2. Modify color scheme in `tailwind.config.js`
3. Update J-SQUAD badge in components
4. Change platform name in navigation

### Content
1. Edit course data in `/education/courses/page.tsx`
2. Update team info in `/education/about/page.tsx`
3. Modify FAQ in `/education/contact/page.tsx`
4. Adjust statistics in home page

### Styling
1. Modify `globals.css` for global styles
2. Update component classes
3. Adjust animations and transitions
4. Customize color gradients

## 🐛 Troubleshooting

### Common Issues

**Navigation not showing**
- Check if Navigation component is imported
- Verify layout structure

**Test not saving progress**
- Check LocalStorage permissions
- Verify auto-save interval

**Audio recording fails**
- Check microphone permissions
- Verify MediaRecorder API support

**Styling issues**
- Clear browser cache
- Rebuild with `npm run build`
- Check TailwindCSS configuration

## 📚 Technologies Used

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Emoji + SVG
- **Audio**: MediaRecorder API
- **Storage**: LocalStorage
- **Deployment**: Vercel-ready

## 🎯 Future Enhancements

- [ ] User authentication
- [ ] Course enrollment system
- [ ] Video lessons
- [ ] Live chat support
- [ ] Certificate generation
- [ ] Payment integration
- [ ] Progress analytics
- [ ] Social features
- [ ] Mobile app

## 👥 Credits

**Developed by J-SQUAD**
- Excellence in Assessment Technology
- Professional Education Solutions

## 📄 License

This project is proprietary software developed for educational purposes.

## 🤝 Support

For support and inquiries:
- Email: support@eduplatform.com
- Phone: +1 (555) 123-4567
- Live Chat: Available 24/7

---

**Built with ❤️ by J-SQUAD**
