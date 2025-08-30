# RedisDashboard (UI)

A lightweight React-based dashboard for interacting with a custom **Redis-compatible server implementation** (built as part of the Codecrafters Redis challenge).  
The UI provides a simple way to browse keys, inspect values, monitor server stats, and run arbitrary Redis commands.

---

## ✨ Features
- **Keys list** with basic metadata (name, type)  
- **Key details viewer** for common types (string, list, set, hash, zset, stream)  
- **Command terminal** to run arbitrary Redis commands  
- **Server INFO & stats bar** (role, memory usage, connected clients, etc.)  
- **Create and delete keys** directly from the UI  
- **Basic set operations** from the UI  

---

## 🚀 Quickstart

### 1. Prerequisites
- A Redis-compatible server running on port **6379**  
  > You can change the port in the `.env` file inside the `backend` folder.  
  > More info: [Redis-Clone Repository](https://github.com/Momensamir12/Redis-Clone-)  

- Node.js **18+**  
- npm  

---

### 2. Start the Backend
```bash
# from repo root
cd backend
npm install
npm run dev

3. Start the Frontend
```bash
# from repo root
cd frontend
npm install
npm run dev
4. Access the Dashboard

---

Open your browser and go to:
 http://localhost:5173/

🛠 Tech Stack
Frontend: React vue
Backend: Node.js

🎥 Demo
A short demo of the UI can be found here:

frontend/src/demoui.web

