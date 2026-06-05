# GateX — Smart Hostel Leave & Access Management System

A full-stack hostel management platform with multi-level approval workflows, QR-based outpass generation, real-time occupancy tracking, and visitor management.

## Live Demo
- Frontend: [gatex.vercel.app](https://gatex.vercel.app)
- Backend: [gatex-api.onrender.com](https://gatex-api.onrender.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Cache & Queues | Redis (Upstash), BullMQ |
| Auth | JWT, Google OAuth 2.0, RBAC |
| DevOps | Docker, Docker Compose, GitHub |
| Notifications | Nodemailer |
| Deployment | Vercel (client), Render (server) |

## Features

- **Multi-Level Approval Workflow** — Leave requests go through Parent → Tutor → Warden approval chain
- **QR-Based Outpass** — Unique QR generated after full approval; security scans for exit/entry
- **Role-Based Access Control** — 6 roles: Student, Parent, Tutor, Warden, Security, Admin
- **Live Occupancy Dashboard** — Real-time view of students inside/outside hostel
- **Late Return Detection** — BullMQ worker runs every 5 minutes, marks late returns and alerts wardens
- **Visitor Management** — Pre-register visitors with QR pass generation
- **Announcement Center** — Admin/Warden broadcasts notices to all users
- **Redis Caching** — Dashboard stats cached for fast load
- **Token Blacklisting** — Logout immediately invalidates JWT via Redis
- **Audit Logging** — Every action recorded with user, role, and timestamp

## User Roles

| Role | Capabilities |
|------|-------------|
| Student | Apply leave, register visitors, view QR outpass |
| Parent | Approve/reject child's leave requests |
| Tutor | Second-stage leave approval |
| Warden | Final approval, visitor approval, dashboard access |
| Security | QR scan for exit/entry, view currently outside |
| Admin | Full access, monthly reports, announcements |

## Leave Workflow