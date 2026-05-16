# TaskFlow — Enterprise Team Task Manager

A full-stack, enterprise-grade team task management application featuring granular role-based access control, workspace management, an immersive glassmorphic dark UI, and rich data visualization.

## ✨ Features

- **Authentication** — Secure JWT-based registration and login with encrypted passwords.
- **Workspaces** — Create dedicated workspaces for different teams or clients, and link specific projects to them.
- **Projects** — Comprehensive project tracking with real-time completion metrics, dynamic deadlines, and team member management.
- **Task Management** — Create, assign, and track tasks with robust priority levels, due dates, custom tagging, and comments.
- **Kanban Board** — Visual board for dragging/updating tasks between Todo, In Progress, Review, and Done.
- **Enterprise Dashboard** — Data-rich metrics overview featuring a custom weekly activity SVG graph, project health meters, and overdue task alerts.
- **Role-Based Access** — Workspace Admins can manage members; members contribute to assigned projects safely.
- **Immersive UI** — Premium dark mode aesthetic with custom hover states, glow effects, micro-animations, and glassmorphic panels.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6, Lucide React (Icons) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (via Mongoose) |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **Styling** | Pure CSS (Custom Glassmorphism Design System) |
| **Deployment** | Railway (Monorepo Single-Service Setup) |

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas Cluster (or local MongoDB)

### Environment Variables
Create a `.env` file in the **`backend/`** directory:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### Installation & Execution
This project is structured as a monorepo.

1. **Install all dependencies** (Frontend & Backend):
```bash
npm install
```
*(The root `package.json` uses a postinstall script to automatically install nested dependencies).*

2. **Run the Backend** (Port 5000):
```bash
cd backend
npm run dev
```

3. **Run the Frontend** (Port 5174):
```bash
cd frontend
npm run dev
```

## 🌐 Deploy to Railway

This application is engineered to deploy seamlessly as a **Single Service** on Railway. The Node.js backend serves the compiled React frontend statically, eliminating CORS issues and reducing infrastructure costs.

1. Create a new project on Railway.
2. Deploy directly from your GitHub repository.
3. Add your Environment Variables (`MONGO_URI`, `JWT_SECRET`).
4. **Deploy!** Railway will automatically:
   - Run `npm install` (which installs frontend + backend).
   - Run `npm run build` (which compiles the Vite React app).
   - Run `npm start` (which boots Express and serves the app on the web).

## 📁 Project Architecture

```
team-task-manager/
├── package.json          # Root Monorepo configuration
├── backend/
│   ├── src/
│   │   ├── app.js        # Express app (API + Static Serving)
│   │   ├── db.js         # Mongoose Schemas & Connection
│   │   ├── middleware/
│   │   │   └── auth.js   # JWT validation
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── projects.js
│   │       ├── tasks.js
│   │       └── workspaces.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI (Modals, Selects)
    │   ├── pages/        # Dashboard, Projects, Kanban Boards
    │   ├── App.jsx       # Routing & Global Search
    │   ├── AuthContext.jsx
    │   ├── api.js        # Axios interceptors
    │   └── index.css     # Global Design System
    ├── index.html
    ├── vite.config.js
    └── package.json
```
