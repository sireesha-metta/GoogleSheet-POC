# GoogleSheet-POC

GoogleSheet-POC is a React + Vite frontend with a Node.js (Express) backend.

The backend now handles:
- Login authentication
- Token session validation
- Protected API access for diagnostic data
- Proxy calls to Google Apps Script for submissions and dashboard data

## Run Locally

1. Install dependencies:

	npm install

2. Start backend (port 3001):

	npm run server

3. Start frontend (port 5173):

	npm run dev

## Environment Variables

Set these in your shell before running npm run server:

- PORT: Backend port (default: 3001)
- FRONTEND_ORIGIN: Allowed frontend origin for CORS (default: http://localhost:5173)
- ADMIN_EMAIL: Login email (default: admin@leanin-coaching.com)
- ADMIN_PASSWORD: Login password (default: Lean@123)
- TOKEN_TTL_MS: Session expiry in milliseconds for normal login (default: 28800000)
- REMEMBER_TOKEN_TTL_MS: Session expiry in milliseconds when remember me is checked (default: 604800000)
- GOOGLE_SCRIPT_URL: Apps Script endpoint for submit/getSubmissions

Frontend environment variable:

- VITE_API_BASE_URL: Backend base URL (default: http://localhost:3001)

## Backend API Routes

Auth routes:
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

Protected business routes (Bearer token required):
- GET /api/questions
- POST /api/answers
- POST /api/submit
- GET /api/submissions

## Notes

- Frontend stores token and session metadata in localStorage.
- If a token is expired or invalid, frontend redirects to /login automatically.
