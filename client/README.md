# Prashikshan AI — Frontend Client

This is the frontend client for **Prashikshan AI**, an AI-powered mock interview platform. The UI has been recently refactored to prioritize a premium, modern SaaS aesthetic, utilizing smooth micro-interactions, vivid animated gradients, and cohesive glassmorphism elements.

## Technology Stack
- **React 19**
- **Vite 8**
- **Tailwind CSS v4** (using `@theme` and `@import "tailwindcss"`)
- **Lucide React** (icons)
- Vanilla CSS (`index.css`) for advanced keyframe animations

---

## Pages & Known Features Checklist

Use the detailed feature list below as requirements to verify proper functionality and check for errors across the application.

### 1. Landing Page (`/`)
- **Architecture:** Full-screen hero layout without scrolling (100vh).
- **Features:**
  - Ambient, continuously shifting gradient background (`hero-bg`).
  - Floating, blurred decorative orbs with varied animation delays.
  - "Get Started Free" Call-to-Action (CTA) button featuring a pulsing glow ring, scale-on-hover, and shadow lift.
  - Glassmorphism feature cards at the bottom.
  - Entrance animations scaling and sliding up elements on mount.
- **Checks / Requirements:**
  - [ ] Page should absolutely not spawn a vertical scrollbar on desktop.
  - [ ] CTA button and bottom feature strip should NOT intersect or overlap on any screen size.
  - [ ] Headings must responsively adjust font size across mobile, tablet, and desktop breakpoints.

### 2. Authentication Pages (`/login` & `/signup`)
- **Architecture:** Centered glass-style authentication cards.
- **Features:**
  - Smooth entrance animations.
  - "Continue with Google" social authentication button (currently mocked).
  - Form validation for required fields (e.g., valid email, minimum 6 character password).
  - Password visibility toggle (Eye/EyeOff icons).
  - Loading states preventing multi-submission.
- **Checks / Requirements:**
  - [ ] Submitting empty fields must trigger inline, localized error messages.
  - [ ] Clicking the Eye icon must toggle input type between `text` and `password`.
  - [ ] Clicking login/signup fakes a 1-second loading delay before redirecting to `/dashboard`.

### 3. Dashboard Page (`/dashboard`)
- **Architecture:** Tabbed dashboard interface with a persistent sticky navigation bar.
- **Features:**
  - **Dashboard Navbar:**
    - Sticky header with an iOS-style translucent blur (`.navbar-blur`).
    - Pill-style horizontal scroll tab bar (Overview, My Interviews, Analytics, Profile).
    - Dark mode toggle presented as a dynamic pill with sliding sun/moon indicators.
  - **Overview Tab:** Grid of 4 stat cards (hover-scale icons) and a wide CTA Banner with gradient, floating decorative circles, and a "white-solid" start button.
  - **My Interviews & Analytics Tabs:** Emphasized, cleanly centered "Empty States" with descriptions.
  - **Profile Tab:** Card layout containing personal info, visually distinct avatar, and structured row data.
- **Checks / Requirements:**
  - [ ] The "Start Interview" button in the Overview tab MUST be styled properly (white rounded pill, NOT a broken white box).
  - [ ] Dark mode toggle should successfully append the `dark` class to the HTML root and save preference to `localStorage`.
  - [ ] Clicking tabs instantly swaps the view without reloading the page.
  - [ ] Tab bar on mobile screens needs to offer horizontal swiping without scrollbars.

### 4. Configure Interview Page (`/configure`)
- **Architecture:** Two-column layout (form on the left, sticky summary on the right).
- **Features:**
  - Form fields: Subject dropdown, Bloom's Taxonomy Mode (Single/Mixed), Bloom Level dropdown, Difficulty selector.
  - Question Slider: Draggable range slider updating total questions (1-20).
  - Summary Panel: Real-time reflection of chosen options alongside an estimated time calculation.
- **Checks / Requirements:**
  - [ ] Selecting "Mixed" Bloom's mode hides the individual "Bloom Level" dropdown.
  - [ ] Clicking difficulty pills instantly updates the active state and changes styling (e.g., Hard turns red).
  - [ ] Slider smoothly scrubs and dynamically updates the summary values.

### 5. Interview Session Page (`/interview`)
- **Architecture:** A rigid viewport-locking app layout designed for deep focus. 
- **Features:**
  - **Header:** Connection status indicator, dynamic Timer, AI state badge (e.g., *Waiting, Listening, AI Speaking*), and progress bar/ratio counter.
  - **Main Panel (Left):**
    - Typewriter-style animated text rendering for incoming AI questions.
    - AI Speaking bounce-dot indicators.
    - Answering text area with live word counter.
    - Disables text input when it is the AI's turn.
  - **Sidebar (Right):**
    - Rotating Interview Tips widget replacing tips every 8 seconds.
    - Step-by-step vertical progress tracking timeline for all questions.
  - **Bottom Controls:** Start/Stop voice recording toggles (UI mocks), Skip Question, Submit & Next.
  - **Result View:** End-of-interview dynamic scorecard summarizing strengths and areas to improve.
- **Checks / Requirements:**
  - [ ] Currently leveraging `useDemoInterview` to mock WebSocket flows natively without backend. Ensure the mock hook walks through the correct stages (connecting -> waiting -> generating answer -> waiting user -> result).
  - [ ] "Submit Answer" is disabled if the user has not typed any response.
  - [ ] Typewriter text properly resets to 0 and re-types for every individual question interval.

---

## Global UI System Rules

- **Spacings:** Adherence to multiples of 4px and 8px grid system.
- **Shadows:** Cards use distinct resting shadows and expand depth on hover (`hover:-translate-y-1 hover:shadow-[...]`).
- **Buttons Structure:**
  - Defined in `src/components/ui/Button.jsx`.
  - Global variants including `primary`, `gradient`, `white-solid`, `secondary`, `ghost`, and `danger`.
  - Implement active states (`active:translate-y-0`) giving a tactile press-down feeling.
- **Typography:** Uses Google Fonts `Inter` for standard UI, and `Poppins` exclusively for high-impact headings and numerical data.

---

## Local Development Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Start the Vite Dev Server:**
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser to view the application.

*Note: For complete WebSocket implementation with LLMs, refer to `useInterview.js` and ensure the FastAPI backend is running simultaneously on port 8000.*
