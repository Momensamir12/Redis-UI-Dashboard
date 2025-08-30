# RedisDashboard (UI)

A lightweight React-based dashboard for interacting with a custom **Redis-compatible server implementation** (built as part of the Codecrafters Redis challenge).  
The UI provides a simple way to browse keys, inspect values, monitor server stats, and run arbitrary Redis commands.

---

## ✨ Features
-  **Keys list** with basic metadata (name, type)  
-  **Key details viewer** for common types (string, list, set, hash, zset, stream)  
-  **Command terminal** to run arbitrary Redis commands  
-  **Server INFO & stats bar** (role, memory usage, connected clients, etc.)  
-  **Create and delete keys** directly from the UI  
-  **Basic set operations** from the UI  

---

## 🚀 Quickstart

### Start the backend
```bash
# from repo root
cd backend
npm install
npm run dev
Start the frontend
bash
Copy code
# from repo root
cd frontend
npm install
npm run dev
Open the UI in your browser at: http://localhost:5173/
