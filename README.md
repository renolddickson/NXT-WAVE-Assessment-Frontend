# Team Task Tracker Frontend

Angular frontend for the Team Task Tracker application. The main active development branch for this repository is `DEVELOPMENT`.

---

## Setup & Build Instructions

### Prerequisites
* Node.js (v20 or higher) and npm installed

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Application
Start the Angular CLI local development server:
```bash
npm start
```
*Note: You can also execute the direct command `ng serve`.*

### 3. Access in Web Browser
Open your browser and navigate to:
`http://localhost:4200`

### 4. Build for Production
To compile the production-ready optimized application bundle, run:
```bash
npm run build
```
The compiled assets will be written to the `dist/task-tracker-frontend/` directory.

---

## API Backend Connection
The frontend services communicate with the backend server API. The API URL is centralized in the environment configuration:
* **Development Config**: [environment.ts](file:///d:/ASSESSMENT/Angular/task-tracker-frontend/src/environments/environment.ts) (points to `http://localhost:3000/api`)
* **Production Config**: [environment.prod.ts](file:///d:/ASSESSMENT/Angular/task-tracker-frontend/src/environments/environment.prod.ts) (handles swaps automatically during `npm run build`)

Ensure that the backend API server is active before logging in or performing actions in the web client.

---

## Features Implemented

- **Login and Registration screens**: Multi-tenant boundaries scope all accounts under organizations.
- **Kanban Task Board**: Integrated board and table view toggles for easy tracking.
- **Dynamic Task Mutations**: CRUD support (creation, edits, deletion) along with assignee assignments and project scope tags.
- **Sequential Status Transitions**: Status updates advanced via dynamic dropdowns following server-enforced workflow routes (`TODO` -> `IN_PROGRESS` -> `IN_REVIEW` -> `DONE` & `BLOCKED`).
- **Interactive Multi-Filters**: Filter dashboard by status, priority, and assignees.
- **Team Analytics Dashboard**: Custom analytics screen displaying total overdue item counts and user completion times (restricted to ADMIN/MANAGER roles).
- **Silent Token Rotation**: Advanced HTTP Interceptor automatically locks outgoing calls and refreshes bearer access tokens upon hitting 401 expiration responses, preventing request race conditions.
