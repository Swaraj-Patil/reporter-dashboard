# Reporter Dashboard: Visibility & Timely Feedback (BEST)

A research-oriented prototype dashboard that demonstrates how reporters can receive **timely feedback** and **visible evidence of impact** on the issues they submit.  
This project is inspired by *Designing Fictions for Collective Civic Reporting of Privacy Harms* and is intended as a **demo for research discussion**.

---

## 🚀 Goal

Build a **reporter-facing dashboard** that:
- Lists submitted tickets and their status.
- Shows a timeline of actions (e.g., *Received → In Review → Responded*).
- Displays sample **automated + human comments**.
- Provides a visual **impact feed** simulating outcomes (*e.g., ad removed, advertiser warned*).

Includes an **Admin/Mock Reviewer panel** to simulate reviewer actions and generate live feedback messages.

---

## ✨ Features

- **Reporter Dashboard**
  - Submit a ticket (synthetic data, no real backend storage).
  - View status updates in real-time via **WebSockets**.
  - Timeline of actions with both automated + human reviewer notes.
  - Toggle for **anonymized summaries**.

- **Admin Panel**
  - See list of pending tickets.
  - Update ticket status (`Received`, `In Review`, `Responded`).
  - Add feedback messages (auto-generated or custom).
  - Trigger impact events (*ad removed, advertiser warned*).

- **Impact Feed**
  - Live simulation of positive outcomes from submitted reports.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript, TailwindCSS)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (synthetic sample data seeded)
- **Real-time**: WebSockets (`socket.io`)
- **Hosting (Free Tier)**:
  - Frontend → Vercel
  - Backend + DB → Render / Railway / Supabase

---

## 📂 Project Structure
```
reporter-dashboard/
├── client/ # Next.js frontend
│ ├── app/ # App Router pages
│ ├── components/ # UI components
│ ├── lib/ # Utilities (WebSocket client, API helpers)
│ └── styles/ # Global Tailwind styles
│
├── server/ # Node.js backend
│ ├── index.js # Express + Socket.io server
│ ├── routes/ # Ticket + admin routes
│ ├── db/ # Prisma ORM setup (Postgres)
│ └── utils/ # Helper functions (mock data, anonymizer)
│
├── prisma/ # Schema + migrations
│ └── schema.prisma
│
├── .env.example # Example env vars
├── package.json
└── README.md
```
---

## ⚡ Getting Started

### 1️⃣ Clone the Repo
```bash
git clone https://github.com/Swaraj-Patil/reporter-dashboard.git
cd reporter-dashboard
```

### 2️⃣ Setup Environment
Copy `.env.example` → `.env` and fill in values:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/reporterdb"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

### 3️⃣ Install Dependencies
```bash
# frontend
cd client
npm install

# backend
cd ../server
npm install
```

### 4️⃣ Setup Database
```bash
cd ..
npx prisma migrate dev --name init
npx prisma db seed
```

### 5️⃣ Run Locally
```bash
# start backend
cd server
npm run dev

# in new terminal, start frontend
cd client
npm run dev
```

- Frontend → http://localhost:3000
- Backend → http://localhost:4000

---

## 🎥 Demo Video
*(to be added after recording demo walk-through)*

---

## 📊 Why This Matters
- Timely Feedback → Immediate updates through live WebSockets.
- Visible Benefits → Simulated "impact feed" showing real-world consequences.
- Transparency & Control → Anonymized summaries toggle for privacy.

This directly addresses participant expectations from the BEST study.

---

## 🤝 Contributing
PRs and suggestions are welcome. This is a research prototype — feel free to adapt for academic demos.

---

## 📜 License
MIT

---