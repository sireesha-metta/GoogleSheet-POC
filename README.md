# GoogleSheet-POC

GoogleSheet-POC is a React + Vite frontend.

All Node.js API code now lives in the leadership-assesment backend.

## Run Locally

1. Install dependencies:

	npm install

2. Start the leadership-assesment backend (port 5000).

3. Start frontend (port 5173):

	npm run dev

## Environment Variables

Frontend environment variable:

- VITE_API_BASE_URL: Backend base URL (default: http://localhost:5000)

## Backend API

These frontend flows depend on the leadership-assesment backend routes:

- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- GET /api/questions
- POST /api/answers
- POST /api/submit
- GET /api/submissions

## Notes

- Frontend stores token and session metadata in localStorage.
- If a token is expired or invalid, frontend redirects to /login automatically.
