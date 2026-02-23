# DORA Metrics Dashboard

This project visualizes DORA metrics (production releases) for the `business-domain-services` and `frontend` repositories using the GitHub API.

## Setup

### Backend
1. `cd backend`
2. `npm install`
3. `node index.js` (starts server on port 4000)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start` (starts React app on port 3000)

## Usage
- Enter your GitHub personal access token in the input field.
- The dashboard will display a bar chart of production releases per month since January for both repositories.

## Configuration
- Update the `OWNER` constant in `frontend/src/App.tsx` to your GitHub organization or username.

---

**Note:** This is a demo. For production, secure your backend and never expose your GitHub token in client code.
