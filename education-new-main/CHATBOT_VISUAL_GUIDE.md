# 🎨 AI Chatbot - Visual Design Guide

## 🎯 Overview
This guide shows the visual design and user interface of the AI chatbot feature.

---

## 📍 Location & Appearance

### Floating Chat Button
```
┌─────────────────────────────────────┐
│                                     │
│         Your Page Content           │
│                                     │
│                                     │
│                              ┌────┐ │
│                              │ 💬 │ │ ← Floating Button
│                              │    │ │   (Bottom-Right)
│                              └────┘ │
└─────────────────────────────────────┘
```

**Button Details**:
- Size: 64px × 64px
- Position: Fixed, bottom-right (24px from edges)
- Background: Gradient (blue → purple)
- Icon: Message bubble (white)
- Animation: Pulsing effect
- Notification: Red dot (top-right of button)
- Hover: Scales to 110%

---

## 💬 Chat Window Layout

```
┌──────────────────────────────────────┐
│  🤖 Brain Graph AI        🟢 Online  │ ← Header (Gradient)
│                                   ✕  │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────┐     │
│  │ Hi! I'm your Brain Graph   │     │ ← AI Message
│  │ AI assistant...            │     │   (Left, White)
│  └────────────────────────────┘     │
│  10:30 AM                            │
│                                      │
│              ┌──────────────────┐   │
│              │ How do I start?  │   │ ← User Message
│              └──────────────────┘   │ (Right, Gradient)
│                          10:31 AM    │
│                                      │
│  ┌────────────────────────────┐     │
│  │ Great question! To start   │     │ ← AI Response
│  │ an assessment...           │     │
│  └────────────────────────────┘     │
│  10:31 AM                            │
│                                      │
├──────────────────────────────────────┤
│  Type your message...          [➤]  │ ← Input Area
│  Powered by Gemini AI               │
└──────────────────────────────────────┘
```

**Window Details**:
- Size: 384px wide × 600px tall
- Position: Above chat button
- Background: White
- Border: 2px purple
- Corners: Rounded (16px)
- Shadow: Large drop shadow

---

## 🎨 Color Scheme

### Primary Colors
```
Chat Button:
├─ Background: linear-gradient(to right, #2563eb, #7c3aed)
├─ Hover: Scales + brighter gradient
└─ Icon: White (#ffffff)

Header:
├─ Background: linear-gradient(to right, #2563eb, #7c3aed)
├─ Text: White (#ffffff)
└─ Online Dot: Green (#22c55e) with pulse

User Messages:
├─ Background: linear-gradient(to right, #2563eb, #7c3aed)
├─ Text: White (#ffffff)
└─ Alignment: Right

AI Messages:
├─ Background: White (#ffffff)
├─ Border: 1px #e5e7eb
├─ Text: Gray-800 (#1f2937)
└─ Alignment: Left

Input Field:
├─ Background: White (#ffffff)
├─ Border: 2px #d1d5db
├─ Focus Border: #a855f7 (purple)
└─ Text: Gray-900 (#111827)

Send Button:
├─ Background: linear-gradient(to right, #2563eb, #7c3aed)
├─ Hover: Darker gradient
└─ Icon: White (#ffffff)
```

---

## ✨ Animations

### 1. Chat Button
```css
/* Pulse Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Notification Dot */
@keyframes ping {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* Hover Scale */
hover: scale(1.1)
```

### 2. Chat Window
```css
/* Open Animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 3. Messages
```css
/* New Message */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Smooth appearance */
duration: 0.3s
```

### 4. Typing Indicator
```css
/* Bouncing Dots */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Staggered delays */
dot1: 0s
dot2: 0.1s
dot3: 0.2s
```

---

## 📱 Responsive Design

### Desktop (1024px+)
```
┌─────────────────────────────────────┐
│                                     │
│         Full Page Content           │
│                                     │
│                              ┌────┐ │
│                              │Chat│ │
│                              └────┘ │
└─────────────────────────────────────┘

Chat Window: 384px × 600px
Position: Fixed bottom-right
```

### Tablet (768px - 1023px)
```
┌──────────────────────────────┐
│                              │
│      Page Content            │
│                              │
│                       ┌────┐ │
│                       │Chat│ │
│                       └────┘ │
└──────────────────────────────┘

Chat Window: 360px × 550px
Position: Fixed bottom-right
```

### Mobile (< 768px)
```
┌─────────────────┐
│                 │
│   Page Content  │
│                 │
│          ┌────┐ │
│          │Chat│ │
│          └────┘ │
└─────────────────┘

Chat Window: 90vw × 500px
Position: Centered
```

---

## 🎭 States & Interactions

### Button States
```
1. Default:
   - Gradient background
   - Pulsing animation
   - Red notification dot
   - Message icon

2. Hover:
   - Scale to 110%
   - Brighter gradient
   - Cursor: pointer

3. Active (Chat Open):
   - Red gradient (different color)
   - X icon instead of message
   - No pulse animation
   - No notification dot
```

### Message States
```
1. Sending:
   - User message appears immediately
   - Typing indicator shows
   - Input field disabled

2. Receiving:
   - Typing indicator visible
   - Bouncing dots animation
   - "AI is typing..." implied

3. Received:
   - AI message appears
   - Fade-in animation
   - Timestamp added
   - Input re-enabled
```

### Input States
```
1. Empty:
   - Placeholder text visible
   - Send button disabled (50% opacity)
   - Gray border

2. Typing:
   - Placeholder hidden
   - Send button enabled
   - Purple border on focus

3. Sending:
   - Input disabled
   - Gray background
   - Loading state
```

---

## 🎯 Interactive Elements

### Clickable Areas
```
1. Chat Button (64×64px)
   ├─ Opens/closes chat window
   └─ Hover effect + cursor pointer

2. Close Button (32×32px)
   ├─ Top-right of header
   ├─ X icon
   └─ Closes chat window

3. Send Button (48×48px)
   ├─ Right side of input
   ├─ Arrow icon
   └─ Sends message

4. Input Field (full width)
   ├─ Text entry
   ├─ Enter key sends
   └─ Focus border effect
```

### Hover Effects
```
Chat Button:
  transform: scale(1.1)
  transition: 0.3s

Close Button:
  background: rgba(255,255,255,0.2)
  transition: 0.2s

Send Button:
  transform: scale(1.05)
  gradient: darker
  transition: 0.3s

Message Bubbles:
  (No hover effect - static)
```

---

## 📐 Spacing & Layout

### Chat Window Padding
```
Header:
  padding: 16px (all sides)

Messages Area:
  padding: 16px (all sides)
  gap: 16px (between messages)

Input Area:
  padding: 16px (all sides)
  gap: 8px (between input and button)
```

### Message Bubbles
```
Padding: 12px (all sides)
Max Width: 80% of container
Border Radius: 16px
Margin Bottom: 4px (for timestamp)

Timestamp:
  font-size: 12px
  margin-top: 4px
  color: gray-500
```

### Typography
```
Header Title:
  font-size: 16px
  font-weight: bold
  color: white

Online Status:
  font-size: 12px
  color: blue-100

Message Text:
  font-size: 14px
  line-height: 1.5
  white-space: pre-wrap

Timestamp:
  font-size: 12px
  color: gray-500

Input Placeholder:
  font-size: 14px
  color: gray-400

Footer Text:
  font-size: 12px
  color: gray-500
  text-align: center
```

---

## 🎨 Visual Hierarchy

### Priority Levels
```
1. HIGHEST - Chat Button
   - Always visible
   - Pulsing animation
   - Bright colors
   - Large size

2. HIGH - User Messages
   - Gradient background
   - Right-aligned
   - Bold presence

3. MEDIUM - AI Messages
   - Clean white background
   - Left-aligned
   - Professional look

4. LOW - Timestamps
   - Small text
   - Gray color
   - Supporting info

5. LOWEST - Footer
   - Tiny text
   - Very light gray
   - Branding only
```

---

## 🌈 Accessibility

### Color Contrast
```
✅ Header Text on Gradient: 4.5:1 (WCAG AA)
✅ User Message Text: 4.5:1 (WCAG AA)
✅ AI Message Text: 7:1 (WCAG AAA)
✅ Input Text: 7:1 (WCAG AAA)
✅ Button Icons: 4.5:1 (WCAG AA)
```

### Interactive Elements
```
✅ Minimum touch target: 44×44px
✅ Keyboard navigation: Tab order
✅ Focus indicators: Purple border
✅ Screen reader labels: aria-label
✅ Button states: disabled attribute
```

---

## 🎬 Animation Timeline

### Opening Chat (0.3s)
```
0.0s: Click button
0.0s: Window starts fade-in
0.1s: Window 50% visible
0.2s: Window 80% visible
0.3s: Window fully visible
0.3s: Input field auto-focus
```

### Sending Message (2-5s)
```
0.0s: User types message
0.0s: User presses Enter
0.0s: Message appears (right side)
0.1s: Input clears
0.1s: Typing indicator appears
2-5s: AI response received
0.0s: Typing indicator fades out
0.1s: AI message fades in
0.2s: Scroll to bottom
```

### Closing Chat (0.2s)
```
0.0s: Click close/button
0.0s: Window starts fade-out
0.1s: Window 50% visible
0.2s: Window fully hidden
```

---

## 🎨 Design Tokens

### Shadows
```
Chat Button:
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

Chat Window:
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

Message Bubbles:
  (No shadow - flat design)
```

### Border Radius
```
Chat Button: 50% (circle)
Chat Window: 16px
Message Bubbles: 16px
Input Field: 12px
Send Button: 12px
Close Button: 50% (circle)
```

### Z-Index Layers
```
Chat Button: z-50
Chat Window: z-50
Page Content: z-0
Navigation: z-40
```

---

## 📊 Component Breakdown

### ChatBot Component Structure
```
<ChatBot>
  ├─ <FloatingButton>
  │   ├─ Icon (Message/Close)
  │   └─ NotificationDot
  │
  └─ <ChatWindow> (conditional)
      ├─ <Header>
      │   ├─ Avatar
      │   ├─ Title & Status
      │   └─ CloseButton
      │
      ├─ <MessagesArea>
      │   ├─ <Message> (AI)
      │   ├─ <Message> (User)
      │   ├─ <Message> (AI)
      │   ├─ <TypingIndicator> (conditional)
      │   └─ <ScrollAnchor>
      │
      └─ <InputArea>
          ├─ <TextField>
          ├─ <SendButton>
          └─ <Footer>
```

---

## 🎯 Best Practices Applied

### Visual Design
✅ Consistent color scheme with platform
✅ Clear visual hierarchy
✅ Adequate spacing and padding
✅ Smooth animations (not distracting)
✅ Professional appearance
✅ Modern card-based UI

### User Experience
✅ Intuitive button placement
✅ Clear open/close actions
✅ Immediate visual feedback
✅ Loading states visible
✅ Error messages friendly
✅ Auto-scroll to latest

### Accessibility
✅ High contrast ratios
✅ Large touch targets
✅ Keyboard navigation
✅ Focus indicators
✅ Screen reader support
✅ Semantic HTML

---

**🎨 The chatbot design is modern, professional, and perfectly integrated with the Brain Graph platform aesthetic!**

