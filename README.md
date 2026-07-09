<div align="center">

# 🏥 Sri Karuna Hospital Management System
  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)

A comprehensive hospital management system with role-based dashboards for Administrators, Doctors, Receptionists, and Pharmacy staff.

</div>

---

## ✨ Features

- 🔐 **Role-Based Access Control (RBAC)**: Distinct dashboards for Admin, Doctor, Reception, and Pharmacy.
- 👨‍⚕️ **Patient Management**: Register, admit, and track patient history.
- 💊 **Pharmacy Module**: Track inventory and billing.
- 📊 **Analytics Dashboard**: Daily, weekly, and monthly statistics for hospital revenue and visits.
- 🌍 **Ngrok Integration**: Quickly share your local development server with the world.

---

## 🛠️ Requirements

Before you begin, ensure you have met the following requirements:
* **Node.js** (v18 or higher)
* **MySQL** (v8 or higher)

---

## ⚙️ Setup Guide

### 1. Database Setup 🗄️

1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or CLI).
2. Execute the `database/hospital.sql` script to create the database, tables, and seed data.

#### Seed Accounts (Password for all: `password123`)
| Role       | Email                      |
|------------|----------------------------|
| **Admin**  | `admin@karuna.com`         |
| **Reception** | `reception@karuna.com`  |
| **Doctor** | `naveen@karuna.com`        |
| **Pharmacy**| `pharmacy@karuna.com`     |
| **Laboratory**| `lab@karuna.com`        |

---

### 2. Running Locally 💻

#### Start the Backend 🟢
1. Open a terminal.
2. Navigate to the server: `cd server`
3. Configure the `.env` file and make sure MySQL credentials (`DB_USER`, `DB_PASSWORD`) match your local setup.
4. Install dependencies: `npm install`
5. Run the server: `npm run dev`

#### Start the Frontend 🖥️
1. Open a new terminal.
2. Navigate to the client: `cd client`
3. Install dependencies: `npm install`
4. Run the frontend: `npm run dev`
5. Open `http://localhost:3000` in your browser.

---

## 🌐 Live Sharing with Ngrok

To temporarily share your project live with friends or clients without deploying:

1. Keep your **Backend** and **Frontend** running in separate terminals.
2. Open a third terminal in the root directory.
3. Run the setup script:
   ```bash
   python ngrok_setup.py
   ```
4. Share the generated link (e.g., `https://<random>.ngrok-free.dev`). Visitors will be able to view and interact with the full application!

---

## 🚀 Deployment Guides

### Frontend (Vercel)
1. Push your code to GitHub.
2. Go to Vercel and import the repository.
3. Select the `client` directory as the Root Directory.
4. Vercel will automatically detect Vite. Click **Deploy**.
5. *Note: In your Vercel project settings, you'll need to configure proxy redirects or set an environment variable `VITE_API_URL` pointing to the backend.*

### Backend (Railway)
1. Push your code to GitHub.
2. Go to Railway and create a new project -> **Deploy from GitHub repo**.
3. Set the Root Directory to `/server`.
4. Add the Environment Variables from your `.env` file (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`).
5. Provision a MySQL Database within Railway and update the credentials accordingly.

---
<div align="center">
  <i>Built with ❤️ for Sri Karuna Hospital</i>
</div>
