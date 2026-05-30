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

## Demo accounts

The frontend uses in-memory mock data by default so the UI can be reviewed without starting the API.

```text
Admin:   admin@tracker.com   password: admin
Manager: manager@tracker.com password: manager
Member:  member@tracker.com  password: member
```

## Connect to the real API

The services are prepared for an API at `http://localhost:3000/api`.

To use the backend instead of mock data, set `useMock = false` in:

- `src/app/services/auth.service.ts`
- `src/app/services/task.service.ts`
- `src/app/services/project.service.ts`
- `src/app/services/user.service.ts`

## Build

```bash
npm run build
```
