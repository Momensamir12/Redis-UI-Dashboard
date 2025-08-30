# RedisDashboard (UI)

A  simple dashboard for interacting with my redis implementation (built as part of the Codecrafters Redis challenge).  
The UI provides a simple way to browse keys, inspect values, monitor server stats, and run arbitrary Redis commands.

---

## ✨ Features

- **Keys list** with basic metadata (name, type)  
- **Key details viewer** for common types (string, list, set, hash, zset, stream)  
- **Command terminal** to run arbitrary Redis commands  
- **Server INFO & stats bar** (role, memory usage, connected clients, etc.)  
- **Create lists, sorted sets, streams** directly from the UI  

---

## 🚀 Quickstart

### 1. Prerequisites

- Redis server running on port **6379**  
   You can change the port in the `.env` file inside the `backend` folder.  
   More info on running the redis server : [Redis-Clone Repository](https://github.com/Momensamir12/Redis-Clone-) 
   (real redis probably won't work with the ui due to authentication issues) 
- Node.js **18+**  
- npm  

---

### 2. Start the Backend

```bash
# from repo root
cd backend
npm install
npm run dev
```

### 3. Start the Frontend

```bash
# from repo root
cd frontend
npm install
npm run dev
```

### 4. Access the Dashboard

Open your browser and go to:
```
http://localhost:5173/
```

---

## 🛠 Tech Stack

- **Frontend:** React vue
- **Backend:** Node.js

---

## 🎥 Demo

![Dashboard Demo](https://github.com/Momensamir12/Redis-UI-Dashboard/raw/master/frontend/src/assets/uidemo.gif)
```
