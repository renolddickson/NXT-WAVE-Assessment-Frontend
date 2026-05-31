# Team Task Tracker Frontend

Angular frontend for the Team Task Tracker application. The main active development branch for this repository is `DEVELOPMENT`.

The application includes the following features:

- Login and registration screens (organization-scoped)
- Kanban task board (with board and table view toggles)
- Task management (creation, updates, deletion, and status advancement through a server-enforced workflow)
- Task filtering by status, priority, and assignee
- Project creation and list directories
- User list and management (creating, editing, and deleting team accounts with system roles)
- Team analytics dashboard for managers and administrators (displaying overdue task counts and average completion times per user)
- Token refresh interception (automatically refreshes tokens on 401 errors, or logs the user out and redirects to login on session expiration)

---

## Run Locally

Ensure you have Node.js and npm installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Application
Start the Angular CLI local development server:
```bash
ng serve
```
*Note: You can also use the npm run script shortcut `npm start` which invokes `ng serve`.*

### 3. Access in Web Browser
Open your browser and navigate to:
`http://localhost:4200`

---

## API Backend Server

The frontend services communicate with the backend server API at `http://localhost:3000/api`.
Ensure that the backend API server is fully running before logging in or performing actions.

---

## Production Build

To compile the production-ready optimized application bundle, run:
```bash
npm run build
```
The output files will be compiled and written to the `dist/task-tracker-frontend/` directory.
