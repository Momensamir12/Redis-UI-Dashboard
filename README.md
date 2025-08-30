# RedisDashboard (UI)

A small React UI to showcase a custom Redis-compatible server implementation (Codecrafter challenge). The UI provides a simple dashboard for browsing keys, viewing server INFO, inspecting key values, and running arbitrary Redis commands.



## Features
- Keys list with basic metadata (name, type)
- Key details viewer for common types (string, list, set, hash, zset, stream)
- Simple command terminal to run arbitrary Redis commands
- Server INFO display and lightweight stats bar
- Create / delete keys and basic set operations from the UI
- 
## Quickstart

Prerequisites:
- Node 18+ (or compatible)
- npm

Start backend:
````bash
# from repo root
cd backend
npm install
npm run dev

start frontend :

````bash
# from repo root
cd frontend
npm install
npm run dev

Techstack :
- Frontend : React vue
- Backend : Nodejs

access the ui in the browser at http://localhost:5173/
