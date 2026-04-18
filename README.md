# 🏙️ CivicPulse — AI-Powered Citizen Grievance Redressal System

> **Empowering citizens, streamlining governance.**
> A next-generation civic engagement platform that uses AI to automatically categorize, prioritizing, and route citizen complaints to the right department.

---

## 🌟 Features

### 🚀 For Citizens
*   **Smart Reporting**: Submit complaints with photos and location. Our AI automatically detects the category (e.g., Pothole, Garbage) and urgency.
*   **Real-time Tracking**: Track the status of your complaints (Submitted -> In Progress -> Resolved) with a transparent timeline.
*   **Gamification**: Earn XP and badges (e.g., "Civic Hero", "Guardian") for reporting valid issues.
*   **Interactive UI**: Experience a fluid, 3D interactive background and modern glassmorphism design.
*   **AI Voice Calling**: Talk directly to our AI agent (ElevenLabs Convai) on the website to report issues hands-free.
*   **Email Integration**: Report issues simply by sending an email to our bot address.
*   **Telegram Bot**: Chat with our AI assistant on Telegram to report issues or check status.

### 🛡️ For Administrators
*   **AI Triage**: Automatically prioritizes critical issues (e.g., "Open manhole") over low-priority ones.
*   **Smart Routing**: Directs complaints to the specific department (e.g., "Health", "Roads", "Electrical").
*   **Dashboard**: Visualize city-wide data with heatmaps, charts, and trend analysis.
*   **Auto-Escalation**: Complaints not resolved within the SLA are automatically escalated to higher officials.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
*   **Backend**: Next.js API Routes (Serverless)
*   **Database**: Supabase (PostgreSQL)
*   **AI/ML**: Google Gemini (Pro 1.5) for text/image classification
*   **Authentication**: Supabase Auth
*   **Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn
*   Supabase Account
*   Google Cloud Account (for Gemini API)
### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/civic-pulse.git
    cd civic-pulse
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    GROQ_API_KEY=your_groq_api_key
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```

4.  **Database Setup**
    Run the SQL scripts provided in `supabase-schema.sql` and `supabase-gamification.sql` in your Supabase SQL Editor.

5.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌍 Deployment

The easiest way to deploy is using **Vercel**:

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Add the environment variables (from step 3 above) in the Vercel Project Settings.
4.  Click **Deploy**.

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the Hackathon.
