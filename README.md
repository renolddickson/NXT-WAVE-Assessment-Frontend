# Team Task Tracker Frontend

Angular frontend for the Team Task Tracker take-home assignment.

The app includes:

- Login and registration screens
- Role-aware navigation for `ADMIN`, `MANAGER`, and `MEMBER`
- Kanban task board with status columns
- Task filters for status, priority, and assignee
- Task create/edit/delete for admin and manager users
- Status transition actions for assignees and managers
- Projects and users management screens

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## API

The services are prepared for an API at `http://localhost:3000/api`.
Run the backend before logging in or using the task board.

## Build

```bash
npm run build
```
