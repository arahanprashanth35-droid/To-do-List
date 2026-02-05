# To-do-List

A full-stack to-do list application with a React frontend and Flask backend.

## Features

- Calendar-based date selection
- Add, complete, and delete tasks
- Tasks persist in SQLite database
- Badge indicators showing incomplete tasks per date

## Tech Stack

- **Frontend**: React + Ant Design + Vite
- **Backend**: Flask + SQLAlchemy + SQLite

## Setup

### Backend
```bash
cd backend-todo-list
setup.bat          # First time only
start.bat          # Start server on http://localhost:5000
```

### Frontend
```bash
cd frontend-todo-list
npm install        # First time only
npm run dev        # Start server on http://localhost:5173
```

## Usage

1. Open http://localhost:5173
2. Select a date from the calendar
3. Click "Add Task" to create a to-do item
4. Check the box to mark tasks complete
5. Click trash icon to delete tasks
