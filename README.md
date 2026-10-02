# Student Attendance Management System (SAMS)

### Malnad College of Engineering, Hassan
**Department of Computer Science and Engineering**

A practical institutional web application for managing, monitoring, and auditing student attendance with role-based access for **Administrators, Faculty, and Students**.

The project is developed as a **Cloud Computing** application using **React + Vite**, with a service-layer architecture designed for **Firebase Authentication, Cloud Firestore, Firestore Security Rules, and Firebase Hosting**.

---

## 🏛️ System Features

### 1. Administration

- Student directory and enrollment management
- Add, update, and manage student records
- Faculty directory management
- Subject and curriculum management
- Assign subjects to faculty
- Institutional attendance/defaulter reports
- Attendance percentage calculations
- CSV report export
- Campus-wide attendance metrics

### 2. Faculty

- Faculty dashboard
- View assigned subjects
- Mark student attendance
- Present/Absent batch actions
- Duplicate attendance-session prevention
- Edit historical attendance
- Course attendance registers
- Student-wise attendance percentages
- Attendance compliance status

### 3. Student

- Personal attendance dashboard
- Overall attendance percentage
- Classes held vs. classes attended
- Subject-wise attendance
- Assigned faculty information
- Attendance history
- Detailed chronological attendance log
- Examination eligibility status

---

## ☁️ Cloud Architecture

The application is designed as a cloud-based web application using Firebase services.

```text
                    Internet
                       |
                       v
              +-------------------+
              |  Firebase Hosting |
              |   React Frontend  |
              +---------+---------+
                        |
                        v
              +-------------------+
              | Firebase Services |
              +---------+---------+
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
   Authentication   Cloud Firestore   Security Rules
          |             |             |
          v             v             v
       Users       Attendance Data    Role-based
       Login       Student Data       Access Control
                   Faculty Data
                   Subject Data
```

---

## 🎨 UI/UX Design Direction

Designed to look like an authentic, human-engineered institutional academic ERP portal (similar to Ellucian Banner, Canvas, or Moodle):
* Restrained Navy (`#0f172a`, `#1e3a8a`) and Neutral Slate (`#f8fafc`) aesthetic.
* Tabular number rendering (`font-variant-numeric: tabular-nums`) for aligned statistics and percentages.
* High-contrast, accessible status chips (Present / Absent / Shortage).
* Zero neon glows, zero decorative glassmorphism, and zero exaggerated animations.

---

## 🔐 Authentication & Demo Accounts

The project includes an authentication service with role-based route protection (`ProtectedRoute`), Firebase Auth integration, and graceful local session fallback.

All demo accounts use the development password: **`password123`**

| Role | Institutional Demo Email | Password | Linked Entity Profile |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@mce-sams.local` | `password123` | System Administrator (`ADM-01`) |
| **Faculty** | `faculty@mce-sams.local` | `password123` | Dr. Sarah Jenkins (`fac-104`, Dept of CSE) |
| **Student** | `student@mce-sams.local` | `password123` | Rahul Sharma (`stud-042`, B.E. CSE Sem 5) |

*(Note: The login page includes quick one-click autofill buttons for each demo account for rapid review).*

---

## 📁 Project Architecture

```text
student-attendance-management-system/
├── public/
├── src/
│   ├── components/
│   │   ├── common/           # Badge, Card, Button, Modal, AlertBanner, ProtectedRoute
│   │   └── layout/           # Institutional Header, Sidebar, AppLayout
│   ├── context/
│   │   ├── AuthContext.jsx   # Authentication context & session persistence
│   │   └── RoleContext.jsx   # Role state management
│   ├── data/
│   │   └── seedData.js       # Realistic MCE institutional seed dataset
│   ├── firebase/
│   │   ├── config.js         # Firebase Cloud SDK configuration
│   │   └── seedFirestore.js  # Controlled Firestore cloud seeding utility
│   ├── pages/
│   │   ├── admin/            # AdminDashboard, ManageStudents, ManageFaculty, etc.
│   │   ├── faculty/          # FacultyDashboard, MarkAttendance, EditAttendance, etc.
│   │   ├── student/          # StudentDashboard, SubjectAttendance, AttendanceLog
│   │   └── auth/             # LoginPage
│   ├── services/
│   │   ├── storageService.js # LocalStorage repository & CSV generator
│   │   ├── authService.js    # Firebase Auth & local fallback
│   │   ├── studentService.js # Student CRUD & Firestore synchronization
│   │   ├── facultyService.js # Faculty CRUD & Firestore synchronization
│   │   ├── subjectService.js # Curriculum catalog & faculty assignments
│   │   ├── attendanceService.js # Dynamic attendance percentage engine
│   │   └── reportService.js  # Defaulter audits & campus-wide summaries
│   ├── App.jsx               # Route definitions & ProtectedRoute tree
│   ├── index.css             # Institutional academic design system
│   └── main.jsx
├── firestore.rules           # Production-grade Firestore security rules
├── .env.example              # Environment variables template
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* npm (v9 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/Ankith-Achar-27/student-attendance-management-system.git

# Enter project directory
cd student-attendance-management-system

# Install dependencies
npm install
```

### Running Locally
```bash
# Start development server
npm run dev
```
Navigate to `http://localhost:5173/` in your browser.

### Cloud Configuration (Optional)
To connect with your live Google Cloud Firebase project:
1. Copy `.env.example` to `.env`
2. Populate the `VITE_FIREBASE_*` variables with your Firebase console project keys
3. Restart Vite (`npm run dev`)

### Production Build
```bash
npm run build
npm run preview
```
