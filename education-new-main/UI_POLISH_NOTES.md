# UI/UX Design System & Alignment Polish Notes

## Overview
This document records the visual alignment, design system tokens, and accessibility enhancements applied across BrainGraph.

---

## 1. Design System & Shared Components

### [`Card.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/common/Card.jsx)
- **Border Radius:** Standardized `rounded-3xl` across all content containers.
- **Elevation & Borders:** Soft `border-slate-200/90` with subtle shadows (`shadow-sm`, hover `shadow-md`).
- **Variants:** `default` (white solid), `glass` (frosted blur `backdrop-blur-md`), `flat` (`bg-slate-50`), `interactive` (lift and border highlight on hover).
- **Responsive Padding:** Scaled padding `p-5 sm:p-6` ensuring comfortable spacing on mobile, tablet, and desktop screens.

### [`EmptyState.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/common/EmptyState.jsx)
- Reusable friendly zero-data visual container with icon badge, title, constructive explanation, and optional action button.

### [`LoadingSpinner.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/common/LoadingSpinner.jsx)
- Consistent loading indicator respecting accessibility `role="status"` and `aria-label`.

---

## 2. Page-Level Visual Refactoring

### [`Dashboard.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/Dashboard.jsx)
- **Header:** Premium indigo-to-purple gradient banner with quick link to Progress Reports.
- **Card Hierarchy:** AI recommendations presented with sequenced numbered pills and clear focus/break time badges.
- **AI Topic Mastery Profile:** Integrated [`StrengthsWeaknessesCard.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/dashboard/StrengthsWeaknessesCard.jsx) highlighting student superpowers (🥇/🥈) and growth areas (🥉) with concrete AI tips.
- **Action Grid:** Clean 3-column responsive navigation cards with hover micro-interactions.

### [`StudyMaterials.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/StudyMaterials.jsx)
- **Knowledge Band Header:** Integrated quick-action triggers for **Adaptive Practice Quiz** and **Ask Doubt Assistant**.
- **Interactive Modals:**
  - [`PracticeQuizModal.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/ai/PracticeQuizModal.jsx): Band-aware 5-question multiple choice engine with progress bar, hints, instant rationales, and celebratory completion score summary.
  - [`DoubtAssistantModal.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/ai/DoubtAssistantModal.jsx): Conversational AI tutor providing plain-language, ADHD-friendly chunked explanations with key takeaways and follow-up prompts.

### [`ReportHistory.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/ReportHistory.jsx)
- **Delivery Status Badges:** Clear multi-channel status indicators (`Sent (SMS & Email)`, `Pending`, `Opted Out`, `Failed`).
- **Expandable Timeline:** Allows students and teachers to inspect plain-language completion summaries, score badges, and trigger one-click notification resends.

### [`Settings.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/Settings.jsx)
- **Contact & Notification Card:** Added dedicated section for Student Mobile (SMS), Parent/Guardian Email, Parent Mobile (SMS), and `notify_on_completion` toggle switch.

### [`TeacherDashboard.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/TeacherDashboard.jsx)
- **AI Pre-Lesson Class Insights:** Integrated [`TeacherClassInsightsCard.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/dashboard/TeacherClassInsightsCard.jsx) aggregating student knowledge band distributions (Foundation vs On Track vs Advanced) and recommended instructional pathways.

### [`Tasks.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/Tasks.jsx) & [`TaskCard.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/TaskCard.jsx)
- **Micro-Step Breakdown:** Visual sparkle badges for AI-generated subtasks with duration estimates.
- **Accessible Indicators:** Task priority and status badges use high-contrast color pairs and text labels, not color alone.

### [`FocusMode.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/FocusMode.jsx)
- **Distraction Logger:** Non-punitive, supportive distraction counter with clear reassurance copy.
- **Interval Controls:** Quick presets (15m, 25m, 45m sprints) with distinct active rings.

### [`Progress.jsx`](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/Progress.jsx)
- **Weekly Digest Integration:** Auto-generated celebratory progress summary highlighting completed tasks, focus minutes, and celebratory wins.

---

## 3. Accessibility & Motion Guidelines
- **Color Contrast:** All status badges (emerald, amber, purple, rose) use 4.5:1+ contrast ratios against their respective tinted backgrounds.
- **Non-Color Indicators:** Icons, text descriptions, and emoji badges accompany all statuses.
- **Reduced Motion:** Interactive cards and modals use smooth CSS opacity transitions without disorienting layout jumps.
