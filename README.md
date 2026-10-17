# MAHADBT Scholarship Management and Automation System (Prototype)

A centralized scholarship management and tracking prototype for B.Tech Information Technology, enhanced with a comprehensive **Admin Master Student Records Sheet**, **Dynamic Student Registration & Data Management**, **Persistent SQLite Database**, **Genuine Document Uploads**, and **Excel/PDF Export Reporting**.

**Academic Disclaimer:** This is an academic engineering prototype simulating scholarship operations and does not connect to the live government MAHADBT portal.

---

## 🌟 Key Features

### 1. Admin Master Student Records (Master Sheet)
- **Consolidated Records:** Complete view of each student combining Personal, Contact, Academic, Scholarship Scheme, Application Status, and Document Verification details in one consolidated sheet.
- **Document Scrutiny & Inspection:**
  - Clearly distinguishes between **Real Uploaded Files**, **Pre-seeded Sample Records**, and **Missing Documents**.
  - Displays missing document alerts for mandatory items (Aadhaar, Income Certificate, Previous Year Marksheet, Fee Receipt).
  - Secure authenticated download and preview of uploaded documents.
  - Inline administrative actions: Mark documents as Verified or flag for Correction Required with custom remarks.
- **Dynamic Search & Filtering:**
  - Search by Student ID, Name, Email, or Application ID.
  - Filter by Scholarship Scheme (Post-Matric, EBC Concession, Hostel Allowance).
  - Filter by Application Status and Document Verification Status.
  - Toggle for "Missing Docs Only" to identify incomplete submissions.
  - Sort by Student ID, Name (A-Z / Z-A), Recent Updates, or Application Status.
- **Export Reporting:**
  - **Export to Excel (.xlsx):** Generates structured multi-sheet workbooks (*Master Student Records* and *Documents Detail*) with proper column widths and complete metadata using SheetJS (`xlsx`).
  - **Export to PDF:** Generates formatted multi-page reports with repeated headers, summary KPIs, and document audit details using `jspdf` and `jspdf-autotable`.
- **Live KPI Counters:** Real-time metrics for Total Registered Students, Applications Submitted, Pending Document Verifications, Approved, and Rejected applications calculated from the live database.

### 2. Dynamic Student Registration & Authentication
- **Live Examiner Demonstration Ready:** Register new students through the UI during live examination without editing any code or configuration files.
- **Automated Identifier Generation:** System automatically generates unique sequential IDs (`STU2026009`, `STU2026010`, etc.).
- **Validation:** Enforces valid email formats, 10-digit mobile numbers, password confirmation, minimum length, and duplicate email prevention.
- **Account Association & Privacy:**
  - Newly registered students receive their own account with bcrypt password hashing and JWT authentication.
  - Students access only their personal dashboard, application details, and uploaded documents.
  - Administrative routes and Master Student Sheets are strictly protected.

### 3. Persistent SQLite Database & Express REST API
- Powered by Node.js with built-in synchronous SQLite (`node:sqlite`).
- Database schema stores `users`, `students`, `applications`, `documents`, and `notifications`.
- All newly registered students, scholarship applications, genuine document uploads, and administrative status decisions persist across server restarts, browser refreshes, and logout/login cycles.
- Pre-seeded with existing mock records (`STU2026001` through `STU2026008`, admin account, applications, and documents).

### 4. Genuine Document Storage
- Real file uploads supporting `.pdf`, `.jpg`, `.jpeg`, and `.png` up to 10MB.
- Stored on the server in a secure, controlled `backend/uploads/` directory with unique timestamped filenames.
- Accessed exclusively through authenticated API endpoints (`/api/documents/:id/file`) validating user ownership or administrative privileges.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 8, React Router DOM v7, Lucide React, Recharts
- **Styling:** Vanilla CSS Custom Design System (`design-system.css`)
- **Export Libraries:** SheetJS (`xlsx`), jsPDF, jsPDF-AutoTable
- **Backend:** Node.js, Express 4, Multer (file handling), BcryptJS (password hashing), JSONWebToken (JWT auth)
- **Database:** SQLite (via Node.js native `node:sqlite` DatabaseSync)

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@demo.com` | `admin123` | Full access to Master Student Sheet, Verification Queue, Approvals |
| **Pre-seeded Student** | `student@demo.com` | `student123` | Sharvari Bangar (`STU2026001`), Information Technology |
| **New Students** | *(Any registered email)* | *(User password)* | Dynamically created via `/register` form |

---

## 🚀 How to Run the Application

### Option A: One-Command Start (Recommended)

From the project root directory (`MAHADBT-Prototype`):

```bash
# 1. Install root, backend, and frontend dependencies (if not already installed)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Start both Backend and Frontend concurrently
npm run dev
```

* Backend server runs on: `http://localhost:5000`
* Frontend application runs on: `http://localhost:5173`

---

### Option B: Separate Terminal Windows

#### Terminal 1 — Backend API Server
```bash
cd backend
npm install
npm start
```
*Server starts and initializes SQLite database at `backend/data/mahadbt.db`.*

#### Terminal 2 — Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your web browser.*

---

## 📋 Live Examiner Demonstration Walkthrough

Follow this exact sequence to demonstrate the newly added capabilities:

1. **Start the Application:** Run `npm run dev` and open `http://localhost:5173`.
2. **Admin Portal & Pre-seeded Data:**
   - On the login screen, click the **Admin** shortcut button (`admin@demo.com` / `admin123`) and click **Login to Portal**.
   - In the sidebar, select **Master Student Sheet** (`/admin/master-sheet`).
   - Observe the 8 pre-seeded student records (e.g. Sharvari Bangar `STU2026001`, Aarav Patil `STU2026002`).
   - Click **Inspect** on any student to view their consolidated profile, application details, and documents.
3. **Export Reports:**
   - Click **Export to Excel** to download the complete `.xlsx` workbook.
   - Click **Export to PDF** to download the formatted "MAHADBT — Student Master Report".
4. **Log Out:** Click the logout icon in the header.
5. **Register First New Student:**
   - Click **Register as New Student** (or navigate to `/register`).
   - Enter:
     - Name: `Rahul More`
     - Email: `rahul.more@demo.com`
     - Phone: `9823456780`
     - Password: `password123`
     - Department: `Computer Engineering`, Year: `Second Year`
   - Click **Complete Registration & Open Dashboard**.
   - Note the assigned unique identifier (e.g., `STU2026009`) and view Rahul's personal dashboard.
6. **Register Second New Student:**
   - Log out. Click **Register as New Student**.
   - Enter:
     - Name: `Pooja Patil`
     - Email: `pooja.patil@demo.com`
     - Phone: `9876123450`
     - Password: `password123`
     - Department: `Information Technology`, Year: `Third Year`
   - Click **Complete Registration & Open Dashboard**.
   - Note the assigned unique identifier (e.g., `STU2026010`).
7. **Submit Scholarship Application (as Pooja):**
   - In Pooja's dashboard, click **My Application** in the sidebar.
   - Select scheme: **Post-Matric Scholarship**.
   - Click **Submit Application**.
   - Observe generated Application ID (e.g. `MH-SCH-2026-xxxxx`).
8. **Upload Genuine Supporting Document:**
   - Navigate to the **Documents** page (`/student/documents`).
   - Select Document Type: **Aadhaar Card**, choose a file (PDF, JPG, or PNG), and click **Upload Document**.
   - The document is saved to server storage with status **Pending Verification**.
9. **Admin Verification & Persistent Updates:**
   - Log out and log back in as Admin (`admin@demo.com` / `admin123`).
   - Open **Master Student Sheet**.
   - Verify KPI counter has increased from 8 to **10 Registered Students**.
   - Both **Rahul More** and **Pooja Patil** appear in the consolidated table.
   - Click **Inspect** on Pooja Patil:
     - Inspect her uploaded file and click **Download** to review it.
     - Click **Verify** to mark her document verified.
     - Under Application Decision, click **Approve Application**.
10. **Persistence Verification:**
    - Refresh the browser (Ctrl+F5) or restart the application.
    - Confirm that all registered students, applications, document statuses, and admin remarks persist intact in the SQLite database.
    - Click **Export to Excel** or **Export to PDF** to verify the new students and updated records appear in the exported reports.
