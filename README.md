# DON BOSCO SKILL MISSION®
### *Empowering Youths • Transforming Lives*

A premium, cinematic full-stack Academy Management and Timetable Scheduling Suite built for **Don Bosco Skill Mission (DBSM)**. Features passwordless OTP authentication, intelligent language-balanced room and dining allocations, fair rotational duty management, and modern glassmorphism design.

---

## 🌟 Key Features

### 1. 🔐 Cinematic Passwordless Authentication
- **Dual Portals**: Dedicated **Administrator** and **Student** gateways.
- **Secure Email + 6-Digit OTP**: Passwordless flow with HMAC-SHA256 hashed verification and 5-minute expiration.
- **Live Email Dispatch**: Integrated with Gmail SMTP (Nodemailer) and Resend API for instant code delivery.
- **Strict Role Authorization**: Only pre-registered emails authorized by an administrator can request access codes.

### 2. 📊 Master Executive Admin Dashboard
- **Live Statistics**: Real-time counts and percentages for Total Students, Hostellers, Day Scholars, Active Languages, Male, and Female demographics.
- **Dynamic Linguistic Diversity Pool**: Interactive progress bars and percentage distribution directly powering accommodation balancing.
- **Quick Action Modules**: One-click shortcuts to manage Students, Dormitories, Refectory Tables, and Rotational Duties.
- **⚡ One-Click Master Scheduler**: Generates conflict-free schedules across all institutional modules simultaneously.

### 3. 🛌 Intelligent Accommodation & Dining Balancing
- **Dormitory Management**:
  - Full CRUD control over residential halls, bed capacities, and strict gender segregation.
  - **Soft Language Balancing**: Prevents single-language concentration while strictly enforcing gender and capacity constraints.
- **Refectory Dining Tables**:
  - Configurable table capacities, seat counts, and seating policies (`Any`, `Male Only`, `Female Only`).
  - Distributes students across diverse linguistic groups to foster intercultural communication.

### 4. 🧹 Daily Rotational Duties (Fair FIFO Rotation)
- **Morning Jobs**: Grounds maintenance, hall cleaning, water preparation.
- **House Cleaning**: Zone sanitization with gender-specific rules.
- **Special Responsibilities**: Configurable roles (Bell Ringers, Sacristans, Water System, Gate Locking).
- **Liturgy & Ministry**: Mass readings and prayer lead roles for eligible hostellers.
- **Assembly**: Anchors, opening prayers, hymn leads, and thought for the day.
- **Conflict-Free Guarantee**: Shared daily tracking prevents any student from receiving duplicate conflicting tasks on the same date.

### 5. 🎓 Dedicated Student Portal (Own-Data Isolation)
- **Private Data Protection**: Students only have read-only access to their own assigned bed, dining seat, daily tasks, and institutional notices.
- **JWT Identity Token Verification**: Identity is extracted securely from the server session.

### 6. 🛡️ Custom Confirmation Dialogs
- Replaces generic browser popups with institutional glassmorphism confirmation modals for safe record deletions.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons |
| **Typography** | Helvetica Now Display (Medium / Regular) |
| **Backend** | Node.js, Express, Prisma ORM, TypeScript |
| **Database** | **Neon.tech Serverless PostgreSQL** (Local SQLite fallback) |
| **Email Delivery** | **Nodemailer (Gmail SMTP)** & **Resend API** |
| **Deployment** | **Vercel Serverless Functions** (`vercel.json`) |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 2. Installation
```bash
# 1. Clone the repository
git clone https://github.com/Donboscop/Management-DBSM.git
cd Management-DBSM

# 2. Install dependencies
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Database (Neon PostgreSQL Cloud Connection)
DATABASE_URL="postgresql://neondb_owner:npg_xxxxxx@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Security Secrets
JWT_SECRET="dbsm-cinematic-jwt-secret-key-production-grade-2026"
PORT=3001
NODE_ENV="development"

# OTP & Email Dispatch Configuration (Gmail SMTP)
OTP_EXPIRY_MINUTES=5
OTP_COOLDOWN_SECONDS=60
MAX_OTP_ATTEMPTS=5
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="donboscop24@gmail.com"
SMTP_PASS="your-16-letter-gmail-app-password"
```

### 4. Database Setup & Seeding
```bash
# Push schema to PostgreSQL database
npx prisma db push

# Seed initial administrators, students, rooms, tables, and roles
npx tsx server/src/seed.ts --run
```

### 5. Run the Application
```bash
# Start both Backend API (port 3001) and Frontend Vite (port 5173) concurrently
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Deploy DBSM Academy"
   git push origin main
   ```
2. Go to **[https://vercel.com/new](https://vercel.com/new)** and import `Donboscop/Management-DBSM`.
3. In **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | *(Your Neon PostgreSQL connection string)* |
| `JWT_SECRET` | *(Your secure JWT secret string)* |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `donboscop24@gmail.com` |
| `SMTP_PASS` | *(Your Gmail 16-letter App Password)* |

4. Click **Deploy**. Vercel will automatically build the frontend and host all `/api/*` endpoints as serverless functions.

---

## 🔑 Default Initial Credentials

### Administrator Portal:
- `donboscop24@gmail.com` *(Primary Administrator)*
- `admin@donbosco.edu`
- `director@donbosco.edu`

### Sample Student Accounts:
- `donbosco@gmail.com` (Don Bosco — Hosteller, Tamil)
- `maria@gmail.com` (Maria Dominic — Hosteller, Kannada)
- `arun@gmail.com` (Arun Kumar — Hosteller, Tamil)
- `priya@gmail.com` (Priya Sharma — Hosteller, Hindi)

---

## 📂 Project Structure

```
├── api/                    # Vercel Serverless Function entry point
│   └── index.ts
├── prisma/                 # Prisma ORM Schema
│   └── schema.prisma
├── public/                 # Static assets & background photography
│   └── background.jpg
├── server/                 # Express Backend API
│   ├── src/
│   │   ├── middleware/     # Auth & Role middleware
│   │   ├── routes/         # Auth, Admin, and Student routes
│   │   ├── services/       # Email & dispatching services
│   │   ├── utils/          # Language balancing & FIFO schedulers
│   │   ├── app.ts          # Express application setup
│   │   ├── seed.ts         # Database seeder
│   │   └── server.ts       # Standalone server runner
├── src/                    # React Frontend
│   ├── components/
│   │   ├── auth/           # Login, OTP verification & portal selection
│   │   ├── portals/        # Admin and Student master dashboards
│   │   └── ui/             # Reusable UI controls (Buttons, Inputs, Modals)
│   ├── context/            # Authentication Context
│   ├── services/           # Frontend API client
│   ├── App.tsx             # Root routing container
│   └── main.tsx            # React application entry
├── vercel.json             # Vercel deployment routing configuration
└── package.json
```

---

## 📄 License & Institutional Notice

© 2026 **DON BOSCO SKILL MISSION®**. All rights reserved.  
*Empowering Youths • Transforming Lives.*
