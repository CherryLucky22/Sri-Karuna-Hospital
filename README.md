<div align="center">

# 🏥 Sri Karuna Hospital Management System
  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

A comprehensive hospital management system with role-based dashboards for Administrators, Doctors, Receptionists, Laboratory, and Pharmacy staff.

</div>

---

## ✨ Features

- 🔐 **Role-Based Access Control (RBAC)**: Distinct dashboards for Admin, Doctor, Reception, Laboratory, and Pharmacy.
- 👨‍⚕️ **Patient Management**: Register, admit, track visits, vitals, and complete patient medical history.
- 🧪 **Laboratory Module**: Manage catalog of lab tests, prescribe tests, process walk-in investigations, and record results.
- 💊 **Pharmacy Module**: Track inventory stock, dispense medicine prescriptions, and process point-of-sale billing.
- 📊 **Analytics Dashboard**: Daily, weekly, and monthly statistics for hospital revenue and visits.
- 🍃 **MongoDB with Mongoose**: Scalable, high-performance document database with automatic schema validation and auto-seeding.

---

## 🛠️ Requirements

Before you begin, ensure you have met the following requirements:
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or MongoDB Atlas Cloud URI)

---

## ⚙️ Setup Guide

### 1. Database Setup 🗄️

1. Configure your MongoDB connection URI in `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/hospital_management
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hospital_management?retryWrites=true&w=majority
   JWT_SECRET=supersecrethospitaljwtkey123!
   ```
2. The database will **automatically seed** with initial default users, departments, lab tests, and medicine inventory on first startup!
3. Alternatively, you can seed manually at any time:
   ```bash
   cd server && npm run seed
   ```

#### Seed Accounts (Password for all: `password123`)
| Role          | Email                        |
|---------------|------------------------------|
| **Admin**     | `admin@karuna.com`           |
| **Reception** | `reception@karuna.com`       |
| **Doctor**    | `naveen@karuna.com`          |
| **Doctor**    | `laxman@karuna.com`          |
| **Doctor**    | `sruthi@karuna.com`          |
| **Pharmacy**  | `pharmacy@karuna.com`        |
| **Laboratory**| `lab@karuna.com`             |
| **Laboratory**| `lab@srikarunahospital.com`  |

---

## 💻 Running Locally

#### Start the Backend 🟢
1. Open a terminal.
2. Navigate to the server: `cd server`
3. Install dependencies: `npm install`
4. Run the server: `npm run dev`

#### Start the Frontend 🖥️
1. Open a new terminal.
2. Navigate to the client: `cd client`
3. Install dependencies: `npm install`
4. Run the frontend: `npm run dev`
5. Open `http://localhost:3000` in your browser.

---

<div align="center">
  <i>Built with ❤️ for Sri Karuna Hospital</i>
</div>
