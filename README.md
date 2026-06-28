# Sri Karuna Hospitals Management System - Setup Guide

## 1. Requirements
- Node.js (v18+)
- MySQL (v8+)

## 2. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or CLI).
2. Execute the `database/hospital.sql` script to create the database, tables, and seed data.

### Seed Accounts (Password for all: `password123`)
- **Admin**: `admin@karuna.com`
- **Reception**: `reception@karuna.com`
- **Doctor**: `naveen@karuna.com`
- **Pharmacy**: `pharmacy@karuna.com`

## 3. Running Locally

### Start the Backend
1. Open a terminal.
2. `cd server`
3. Check the `.env` file and make sure MySQL credentials (DB_USER, DB_PASSWORD) match your local setup.
4. `npm install` (If not already installed)
5. `npm run dev` (Ensure you add `"dev": "node server.js"` in `package.json` scripts, or just run `node server.js`).

### Start the Frontend
1. Open a new terminal.
2. `cd client`
3. `npm install`
4. `npm run dev`
5. Open `http://localhost:3000` in your browser.

## 4. Deployment Guides

### Frontend (Vercel)
1. Push your code to GitHub.
2. Go to Vercel and import the repository.
3. Select the `client` directory as the Root Directory.
4. Vercel will automatically detect Vite. Click Deploy.
5. In your Vercel project settings, you'll need to configure proxy redirects or set an environment variable `VITE_API_URL` pointing to the backend.

### Backend (Railway)
1. Push your code to GitHub.
2. Go to Railway and create a new project -> Deploy from GitHub repo.
3. Set the Root Directory to `/server`.
4. Add the Environment Variables from your `.env` file (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET).
5. Provision a MySQL Database within Railway and update the credentials accordingly.
