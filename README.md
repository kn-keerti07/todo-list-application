# To-Do List Application (Next.js)

## Setup
1. Install Node.js 18.18 or later.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open http://localhost:3000.

## Features
- Add a task (empty tasks are rejected with a message).
- Mark a task completed or active again with the checkbox or by clicking its text.
- Delete a task.
- Filter by All, Active, or Completed.
- Clear all completed tasks at once.
- Tasks are saved in the browser's localStorage, so they remain after a refresh.

## Project structure
- `app/layout.js` – root layout and fonts
- `app/page.js` – home page
- `app/components/TodoApp.js` – all task logic and UI
- `app/globals.css` – styling
