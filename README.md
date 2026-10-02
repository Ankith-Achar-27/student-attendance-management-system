# Student Attendance Management System (SAMS)
### Malnad College of Engineering, Hassan
**Department of Computer Science and Engineering**

A practical, institutional web application designed for **Malnad College of Engineering (MCE), Hassan** to monitor, record, and audit student attendance with role-based access control for **Administrators**, **Faculty**, and **Students**.

Built as a college **Cloud Computing** project foundation using React and Vite, structured with an abstract service layer designed for seamless integration with Firebase Authentication and Cloud Firestore.

---

## 🏛️ System Features & Role Capabilities

### 1. Administration (Academic Affairs & Records)
* **Student Directory & Enrollment:** Register new students, update batch details, toggle active/inactive status, and export rosters to CSV.
* **Faculty Directory:** Maintain instructional staff records, departments, and course load assignments.
* **Curriculum Subjects Catalog:** Configure course offerings, credit allocations, and assign faculty instructors.
* **Institutional Defaulter Audit:** Live calculation of student attendance against institutional examination thresholds (e.g. $<75\%$) with customizable filters and CSV report export.
* **Campus-Wide Metrics:** Aggregated attendance metrics across all engineering departments.

### 2. Faculty (Instructional Staff - Department of CSE)
* **Instructional Dashboard:** Overview of allocated semester subjects, enrollment counts, and batch averages.
* **Mark Attendance Roll Call:** Select assigned subject, date, and lecture slot (Periods 1–5 or Lab) to mark students Present or Absent with batch action shortcuts. Duplicate prevention prevents accidental double submissions for the same slot.
* **Edit Historical Attendance:** Rectify attendance records for past sessions with change tracking.
* **Course Registers:** Cumulative attendance registers calculating individual student attendance percentages and compliance statuses (`Satisfactory`, `Borderline`, `Shortage`).

### 3. Student (Self-Service Portal)
* **Attendance Overview:** Overall cumulative attendance percentage, classes held vs. attended, and statutory examination eligibility badge.
* **Subject-Wise Breakdown:** Per-course metrics including credits, assigned faculty, held/attended count, and compliance indicators.
* **Chronological Attendance Log:** Detailed historical log of all past lecture roll calls with subject-wise filtering.

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
│   │   └── AuthContext.jsx   # Authentication context & session persistence
│   ├── data/
│   │   └── seedData.js       # Realistic institutional seed dataset
│   ├── pages/
│   │   ├── admin/            # AdminDashboard, ManageStudents, ManageFaculty, etc.
│   │   ├── faculty/          # FacultyDashboard, MarkAttendance, EditAttendance, etc.
│   │   ├── student/          # StudentDashboard, SubjectAttendance, AttendanceLog
│   │   └── auth/             # LoginPage
│   ├── services/
│   │   ├── storageService.js # LocalStorage repository & CSV generator
│   │   ├── authService.js    # Local authentication layer
│   │   ├── studentService.js # Student CRUD & validation
│   │   ├── facultyService.js # Faculty CRUD & uniqueness validation
│   │   ├── subjectService.js # Curriculum catalog & faculty assignments
│   │   ├── attendanceService.js # Dynamic percentage calculations & sessions
│   │   └── reportService.js  # Defaulter audits & campus-wide summaries
│   ├── App.jsx               # Route definitions & ProtectedRoute tree
│   ├── index.css             # Institutional academic design system
│   └── main.jsx
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

### Production Build
```bash
npm run build
npm run preview
```
