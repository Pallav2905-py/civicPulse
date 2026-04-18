# CivicPulse — Implementation Document

## AI-Powered Citizen Grievance Redressal Platform

**Version:** 1.0.0
**Date:** February 12, 2026
**Team:** Hackathon Project

---

## 1. Project Overview

CivicPulse is an AI-powered platform that enables citizens to report civic issues (potholes, broken streetlights, water leaks, etc.) and ensures they reach the right government department with appropriate priority. The system uses **Natural Language Processing (NLP)** for automatic complaint categorization, **intelligent routing** to departments, **priority scoring**, and **citizen feedback loops** — creating a transparent, efficient grievance resolution pipeline.

### 1.1 Problem Statement

Citizens face difficulty reporting civic issues through traditional channels:
- No centralized platform for all types of complaints
- Manual categorization leads to misrouted complaints
- Lack of transparency in complaint tracking
- No priority-based handling — critical issues get delayed
- No feedback mechanism to improve services

### 1.2 Solution

CivicPulse addresses all of the above by offering:
- **One-stop complaint submission** with real-time AI classification preview
- **Automatic AI-based categorization** into 9 complaint categories
- **Smart routing** to 7+ government departments
- **Dynamic priority scoring** based on urgency, impact, spread, and public votes
- **Live status tracking** with a timeline for each complaint
- **Citizen feedback** after resolution (star rating + comments)
- **Admin dashboard** with analytics, charts, and department performance metrics

---

## 2. Tech Stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| **Framework**      | Next.js 16 (App Router)                 |
| **Language**       | TypeScript                              |
| **Frontend**       | React 19, Framer Motion                 |
| **Styling**        | Tailwind CSS 4, Custom CSS (Dark Theme) |
| **Charts**         | Recharts                                |
| **Icons**          | Lucide React                            |
| **Maps** (planned) | Leaflet + React Leaflet                 |
| **Database**       | In-memory simulation (hackathon-ready)  |
| **AI Engine**      | Custom NLP keyword classification       |

### 2.1 Dependencies (`package.json`)

```json
{
  "dependencies": {
    "framer-motion": "^12.34.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.563.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-leaflet": "^5.0.0",
    "recharts": "^3.7.0"
  }
}
```

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Landing  │ │ Submit   │ │Dashboard │ │ Admin Panel   │  │
│  │ Page     │ │ Form     │ │(Citizen) │ │ (Government)  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       │             │            │               │           │
├───────┼─────────────┼────────────┼───────────────┼───────────┤
│       │        API LAYER (Next.js API Routes)    │           │
│  ┌────┴──────┐ ┌────┴──────┐ ┌───┴────┐ ┌───────┴────────┐  │
│  │/api/      │ │/api/      │ │/api/   │ │/api/           │  │
│  │analytics  │ │complaints │ │classify│ │complaints/[id] │  │
│  └────┬──────┘ └────┬──────┘ └───┬────┘ └───────┬────────┘  │
│       │             │            │               │           │
├───────┼─────────────┼────────────┼───────────────┼───────────┤
│       │        BUSINESS LOGIC                    │           │
│  ┌────┴──────────────┴────────────┴───────────────┴────────┐  │
│  │                    AI Engine (ai.ts)                     │  │
│  │  • classifyComplaint()    • calculatePriorityScore()    │  │
│  │  • getDepartment()        • getEstimatedResolution()    │  │
│  └─────────────────────┬───────────────────────────────────┘  │
│                        │                                      │
│  ┌─────────────────────┴───────────────────────────────────┐  │
│  │              In-Memory Database (db.ts)                 │  │
│  │  • complaints[]  • statusUpdates[]  • feedbacks[]       │  │
│  │  • CRUD operations  • Analytics aggregation             │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Project Structure

```
civic-pulse/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout + navigation
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Design system & theme
│   │   ├── submit/
│   │   │   └── page.tsx               # Complaint submission form
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Citizen dashboard
│   │   ├── complaint/
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Complaint detail view
│   │   ├── admin/
│   │   │   └── page.tsx               # Admin dashboard
│   │   └── api/
│   │       ├── complaints/
│   │       │   ├── route.ts           # GET all / POST new
│   │       │   └── [id]/
│   │       │       └── route.ts       # GET one / PATCH update
│   │       ├── classify/
│   │       │   └── route.ts           # Real-time AI preview
│   │       └── analytics/
│   │           └── route.ts           # Dashboard analytics
│   └── lib/
│       ├── types.ts                   # TypeScript interfaces
│       ├── ai.ts                      # AI classification engine
│       └── db.ts                      # In-memory database
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 5. Core Modules — Detailed Implementation

### 5.1 Type System (`src/lib/types.ts`)

Defines all TypeScript interfaces and constants used throughout the application.

**Key Types:**

| Type                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `ComplaintCategory`   | 9 categories: Pothole, Streetlight, Water Leak, etc. |
| `PriorityLevel`       | 4 levels: Critical, High, Medium, Low              |
| `ComplaintStatus`     | 5 states: Submitted → Assigned → In Progress → Resolved → Closed |
| `Complaint`           | Full complaint object with 20+ fields              |
| `ClassificationResult`| AI output: category, confidence, urgency, etc.     |
| `AnalyticsData`       | Aggregated metrics for admin dashboard             |

**Constant Mappings:**

```typescript
// Category → Department routing
DEPARTMENT_MAP = {
    POTHOLE:              "Roads & Infrastructure",
    STREETLIGHT:          "Electrical Department",
    WATER_LEAK:           "Water Supply Department",
    GARBAGE:              "Sanitation Department",
    DRAINAGE:             "Drainage Department",
    ROAD_DAMAGE:          "Roads & Infrastructure",
    ILLEGAL_CONSTRUCTION: "Building & Planning",
    NOISE_POLLUTION:      "Local Police",
    OTHER:                "General Administration",
};
```

---

### 5.2 AI Classification Engine (`src/lib/ai.ts`)

The heart of the system — a keyword-based NLP classifier that operates entirely offline (no API keys required).

#### 5.2.1 `classifyComplaint(title, description) → ClassificationResult`

**Algorithm:**
1. Concatenate title + description and convert to lowercase
2. Match against **9 keyword dictionaries** (multi-word matches score higher)
3. Determine urgency from **urgency keywords** (e.g., "urgent", "dangerous" → CRITICAL)
4. Estimate **affected area** (SMALL / MEDIUM / LARGE) from context clues
5. Map area size to **estimated people affected** (10 / 50 / 200)
6. Calculate **confidence score** (60%–95%) based on keyword match strength

**Example Keyword Dictionaries:**

```typescript
CATEGORY_KEYWORDS = {
    POTHOLE: ["pothole", "pot hole", "hole in road", "crater", "road pit"],
    WATER_LEAK: ["water leak", "pipe burst", "broken pipe", "flooding", "waterlogging"],
    GARBAGE: ["garbage", "trash", "waste", "dustbin", "foul smell", "overflowing bin"],
    // ... 6 more categories
};

URGENCY_KEYWORDS = {
    CRITICAL: ["urgent", "emergency", "dangerous", "accident", "life threatening"],
    HIGH: ["serious", "broken", "safety", "unsafe", "worsening"],
    MEDIUM: ["problem", "issue", "needs repair"],
    LOW: ["minor", "small", "suggestion"],
};
```

#### 5.2.2 `calculatePriorityScore(urgency, area, people, upvotes) → {score, level}`

**Weighted Formula:**

```
Score = (Urgency × 0.4) + (Impact × 0.3) + (Spread × 0.2) + (Votes × 0.1)
```

| Factor      | Weight | Scale | Source                          |
| ----------- | ------ | ----- | ------------------------------- |
| Urgency     | 40%    | 0–10  | Keyword urgency level           |
| Impact      | 30%    | 0–10  | Estimated people affected / 20  |
| Spread      | 20%    | 0–10  | Affected area size              |
| Public Votes| 10%    | 0–10  | Citizen upvotes / 5             |

**Priority Thresholds:**
- Score ≥ 8 → **CRITICAL** (resolve in 1 day)
- Score ≥ 6 → **HIGH** (resolve in 3 days)
- Score ≥ 4 → **MEDIUM** (resolve in 7 days)
- Score < 4 → **LOW** (resolve in 14 days)

#### 5.2.3 `getDepartment(category) → string`

Performs a direct lookup from the `DEPARTMENT_MAP` constant. Routes each category to one of **7 government departments**.

#### 5.2.4 `getEstimatedResolution(priority) → ISO date string`

Returns an estimated resolution date based on priority:
- CRITICAL → +1 day
- HIGH → +3 days
- MEDIUM → +7 days
- LOW → +14 days

---

### 5.3 In-Memory Database (`src/lib/db.ts`)

Simulates a full database for the hackathon demo. All data lives in memory — no external DB setup required.

**Data Stores:**

```typescript
const complaints: Complaint[] = [];      // All complaints
const statusUpdates: StatusUpdate[] = []; // Status change history
const feedbacks: Feedback[] = [];         // Citizen feedback
```

**Seed Data:** 10 realistic complaints across multiple categories (Pothole, Streetlight, Water Leak, Garbage, Drainage, Road Damage, Illegal Construction, Noise Pollution), 3 status updates, and 2 feedback entries. All based in Pune, Maharashtra.

**CRUD Operations:**

| Function                | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `getAllComplaints()`     | List complaints with optional filters (status, category, priority, department) |
| `getComplaintById(id)`  | Single complaint lookup                        |
| `createComplaint(data)` | Creates and stores new complaint               |
| `updateComplaint(id)`   | Partial update (status, assignment, etc.)       |
| `upvoteComplaint(id)`   | Increment vote count (prevents duplicates)     |
| `getStatusUpdates(id)`  | History of status changes for a complaint      |
| `createStatusUpdate()`  | Log a status transition with comment           |
| `createFeedback()`      | Store citizen rating + comment                 |
| `getFeedback(id)`       | Retrieve feedback for a resolved complaint     |
| `getAnalytics()`        | Aggregate all metrics for admin dashboard      |

**Analytics Aggregation (`getAnalytics()`):**
- Total complaints, pending count, resolved today
- Average resolution time (days)
- Breakdown by category, status, priority
- 7-day complaint trend
- Department performance (total, resolved, avg days)

---

## 6. API Routes

### 6.1 `POST /api/complaints` — Submit New Complaint

**Request Body:**
```json
{
    "title": "Massive pothole on MG Road",
    "description": "3-foot wide pothole causing accidents...",
    "address": "MG Road, Near Central Mall, Pune",
    "latitude": 18.5204,
    "longitude": 73.8567
}
```

**Processing Pipeline:**
```
Input → AI Classification → Priority Scoring → Department Routing → ETA Calculation → Store
```

**Response (201):**
```json
{
    "complaint": { /* full complaint object with ID */ },
    "classification": {
        "category": "POTHOLE",
        "confidence": 0.7,
        "urgencyLevel": "MEDIUM",
        "affectedAreaSize": "MEDIUM",
        "estimatedPeopleAffected": 50
    },
    "priority": { "score": 6.0, "level": "MEDIUM" },
    "department": "Roads & Infrastructure"
}
```

### 6.2 `GET /api/complaints` — List All Complaints

**Query Parameters:** `?status=IN_PROGRESS&category=POTHOLE&priority=CRITICAL`

Returns filtered, sorted array of complaints (newest first).

### 6.3 `GET /api/complaints/[id]` — Complaint Detail

Returns full complaint object with status update history and feedback.

### 6.4 `PATCH /api/complaints/[id]` — Update Complaint

Supports three actions:
1. **Upvote:** `{ "action": "upvote" }`
2. **Status Change:** `{ "status": "IN_PROGRESS", "comment": "Team dispatched" }`
3. **Feedback:** `{ "rating": 4, "feedbackComment": "Good job!" }`

### 6.5 `POST /api/classify` — Real-time AI Preview

Used for the live classification preview on the submission form. Returns classification, priority, department, and ETA without creating a complaint.

### 6.6 `GET /api/analytics` — Dashboard Analytics

Returns aggregated analytics data for the admin dashboard (KPIs, charts, department performance).

---

## 7. Frontend Pages

### 7.1 Landing Page (`/`)

| Section        | Details                                                        |
| -------------- | -------------------------------------------------------------- |
| Hero           | Animated gradient text, CTA buttons ("Report an Issue", "Track Complaints") |
| Live Stats     | 4 animated counters (Total Complaints, Resolved, Avg Resolution, Satisfaction) |
| How It Works   | 4-step process: Report → AI Classifies → Dept. Resolves → Feedback |
| Features Grid  | 6 cards: AI Classification, Smart Routing, Live Tracking, Priority Engine, Feedback, Analytics |
| Footer         | Branding and tagline                                           |

**Key Tech:** Framer Motion animations, `AnimatedNumber` component with `requestAnimationFrame`, API data fetching on mount.

### 7.2 Complaint Submission (`/submit`)

| Section            | Details                                                 |
| ------------------ | ------------------------------------------------------- |
| Form Fields        | Issue Title, Detailed Description, Location/Address, Photo Upload (UI only) |
| AI Preview Panel   | Real-time classification as user types (debounced API calls to `/api/classify`) |
| Preview Details    | Category, Priority badge, Score, Department, Confidence %, People Affected |
| Submit Button      | Calls `POST /api/complaints`, shows success overlay with complaint ID |

**Key Tech:** Debounced input with 500ms delay for real-time AI preview, success overlay with complaint ID display.

### 7.3 Citizen Dashboard (`/dashboard`)

| Section         | Details                                                        |
| --------------- | -------------------------------------------------------------- |
| Filter Bar      | Buttons for status (All, Submitted, Assigned, etc.) and category filters |
| Complaint Cards | Grid layout showing title, category, priority badge, status badge, upvotes, time ago |
| Upvote Button   | Sends PATCH request to upvote, updates count in UI              |
| Card Click      | Navigates to `/complaint/[id]` for full details                 |

**Key Tech:** Client-side filtering, relative time display ("2 days ago"), inline upvote with optimistic UI.

### 7.4 Complaint Detail (`/complaint/[id]`)

| Section          | Details                                                      |
| ---------------- | ------------------------------------------------------------ |
| Header           | Title, category icon, priority + status badges               |
| Description      | Full complaint description text                              |
| Status Timeline  | Chronological list of status changes with timestamps         |
| Feedback Form    | Star rating (1-5 clickable stars) + comment textarea (for resolved complaints) |
| Sidebar          | Priority score, department, location, reporter, date, upvotes, estimated resolution |

**Key Tech:** Dynamic `[id]` route, star rating component, conditional feedback form based on complaint status.

### 7.5 Admin Dashboard (`/admin`)

**Tab 1 — Overview:**
| Widget                  | Chart Type  | Data Source                  |
| ----------------------- | ----------- | ---------------------------- |
| Total Complaints        | KPI Card    | `analytics.totalComplaints`  |
| Pending                 | KPI Card    | `analytics.pendingComplaints`|
| Resolved Today          | KPI Card    | `analytics.resolvedToday`    |
| Avg. Resolution         | KPI Card    | `analytics.avgResolutionDays`|
| Complaints by Category  | Bar Chart   | `analytics.byCategory`       |
| Status Distribution     | Donut Chart | `analytics.byStatus`         |
| 7-Day Trend             | Line Chart  | `analytics.trend`            |
| Priority Distribution   | Bar Chart   | `analytics.byPriority`       |

**Tab 2 — All Complaints:**
- Full data table with columns: ID, Title, Category, Priority, Status, Department, Upvotes, Date, Actions
- Status filter tabs with counts (All, Submitted, Assigned, In Progress, Resolved)
- Inline dropdown to change complaint status (PATCH API)

**Tab 3 — Departments:**
- Performance cards for each department showing:
  - Total complaints handled
  - Resolved count
  - Average resolution time (days)
  - Resolution rate with progress bar

**Key Tech:** Recharts library (BarChart, PieChart, LineChart), tabbed navigation, inline status update dropdowns.

---

## 8. Design System

### 8.1 Theme

- **Mode:** Dark theme with deep navy/indigo backgrounds
- **Style:** Glassmorphism (translucent cards with backdrop blur)
- **Colors:** Purple/violet primary accent, gradient text effects

### 8.2 Color Palette

| Usage      | Color                                       |
| ---------- | ------------------------------------------- |
| Background | `#0a0a1a` (deep navy)                       |
| Cards      | `rgba(255,255,255,0.03)` with blur          |
| Primary    | `#8b5cf6` → `#a78bfa` (purple gradient)     |
| Critical   | `#ef4444` (red)                              |
| High       | `#f97316` (orange)                           |
| Medium     | `#eab308` (yellow)                           |
| Low        | `#22c55e` (green)                            |
| Resolved   | `#22c55e` (green)                            |
| Submitted  | `#8b5cf6` (purple)                           |
| In Progress| `#f59e0b` (amber)                            |

### 8.3 Animations

- **Hero section:** Fade-in + slide-up on load (Framer Motion)
- **Number counters:** Smooth count-up animation using `requestAnimationFrame`
- **Cards:** Hover scale + glow effect
- **Buttons:** Gradient shift on hover
- **Page transitions:** Content fade-in with stagger

---

## 9. Data Flow Diagrams

### 9.1 Complaint Submission Flow

```
Citizen fills form
       │
       ▼
As user types → POST /api/classify → AI Preview updates in real-time
       │
       ▼
Clicks "Submit"
       │
       ▼
POST /api/complaints
       │
       ├─→ classifyComplaint(title, desc)  → category + confidence
       ├─→ calculatePriorityScore()        → score + level
       ├─→ getDepartment(category)         → department name
       ├─→ getEstimatedResolution(level)   → ETA date
       │
       ▼
Complaint stored in database
       │
       ▼
Success overlay shows complaint ID (e.g., CPL-0101)
```

### 9.2 Complaint Resolution Flow

```
SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
    │           │            │            │
    │     Dept officer   Work begins   Issue fixed
    │     picks it up                     │
    │                                     ▼
    │                              Citizen gets notified
    │                                     │
    │                                     ▼
    │                              Citizen submits feedback
    │                              (1–5 stars + comment)
    │
    └── At each stage, a StatusUpdate record is created
        with timestamp, officer name, and comment
```

---

## 10. AI Classification — Examples

| Complaint Text                                                 | Category       | Priority | Department              | Confidence |
| -------------------------------------------------------------- | -------------- | -------- | ----------------------- | ---------- |
| "Huge pothole on MG Road causing accidents"                    | POTHOLE        | MEDIUM   | Roads & Infrastructure  | 70%        |
| "Major water pipe burst on Station Road"                       | WATER_LEAK     | CRITICAL | Water Supply Department | 70%        |
| "Streetlight not working for 2 weeks"                          | STREETLIGHT    | HIGH     | Electrical Department   | 70%        |
| "Garbage not collected for 5 days, foul smell"                 | GARBAGE        | MEDIUM   | Sanitation Department   | 80%        |
| "Illegal construction blocking public pathway"                 | ILLEGAL_CONST  | MEDIUM   | Building & Planning     | 70%        |
| "Continuous loud music from banquet hall at night"              | NOISE_POLLUTION| MEDIUM   | Local Police            | 70%        |

---

## 11. How to Run

### 11.1 Development

```bash
# Clone the project
cd civic-pulse

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000`

### 11.2 Production Build

```bash
npm run build
npm start
```

### 11.3 Available Routes

| Route                | Description              |
| -------------------- | ------------------------ |
| `/`                  | Landing page             |
| `/submit`            | Report a new issue       |
| `/dashboard`         | Citizen complaint tracker|
| `/complaint/[id]`    | Complaint detail view    |
| `/admin`             | Admin analytics panel    |

---

## 12. Future Enhancements

1. **Real AI Integration** — Replace keyword matching with OpenAI / Hugging Face transformer models for higher accuracy NLP classification
2. **MongoDB/PostgreSQL** — Migrate from in-memory database to persistent storage
3. **Interactive Map** — Leaflet-based heatmap showing complaint hotspots
4. **Authentication** — User login (OTP-based for citizens, role-based for officers)
5. **Email/SMS Notifications** — Alert citizens when complaint status changes
6. **Image Analysis** — Use computer vision to verify and enhance complaint classification from uploaded photos
7. **Multi-language Support** — Hindi, Marathi, and other regional language input processing
8. **Mobile App** — React Native companion app for on-the-go reporting

---

## 13. Summary

CivicPulse demonstrates a complete, end-to-end intelligent grievance redressal pipeline built with modern web technologies. The platform combines:

- **AI-powered NLP** for automatic issue categorization (9 categories, 7+ departments)
- **Dynamic priority scoring** with a weighted multi-factor algorithm
- **Real-time classification preview** giving users instant feedback before submission
- **Full-featured admin dashboard** with 4 interactive chart types and department analytics
- **Citizen feedback loop** enabling continuous improvement of public services
- **Premium dark-mode UI** with glassmorphism, animations, and responsive design

The system is designed to be hackathon-ready (zero external dependencies for data/AI) while being architected for easy migration to production-grade infrastructure.

---

*Built with ⚡ Next.js 16 • React 19 • TypeScript • Tailwind CSS • Recharts • Framer Motion*
