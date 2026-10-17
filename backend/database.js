import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'mahadbt.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_FILE);

// Initialize schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      dob TEXT,
      gender TEXT,
      college TEXT,
      department TEXT,
      year TEXT,
      marks TEXT,
      category TEXT,
      income TEXT,
      aadhaar TEXT,
      bank_account TEXT,
      ifsc TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      department TEXT,
      year TEXT,
      scholarship_name TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      status TEXT NOT NULL,
      document_status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      submitted_date TEXT,
      last_updated TEXT NOT NULL,
      admin_remarks TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      original_filename TEXT,
      stored_filename TEXT,
      file_path TEXT,
      mime_type TEXT,
      size_bytes INTEGER,
      category TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      remark TEXT,
      upload_date TEXT NOT NULL,
      is_sample INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      date TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      type TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial demo data into SQLite database...');

  const studentHash = bcrypt.hashSync('student123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);

  // 1. Seed Admin
  const insertUser = db.prepare(`
    INSERT INTO users (id, role, name, email, password_hash, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin', 'System Admin', 'admin@demo.com', adminHash, '9999999999', new Date().toISOString());

  // 2. Seed Mock Students
  const initialStudents = [
    {
      id: "STU2026001",
      name: "Sharvari Bangar",
      email: "student@demo.com",
      department: "Information Technology",
      year: "Third Year",
      phone: "9876543210",
      college: "Government College of Engineering",
      category: "OBC",
      income: "150000",
      dob: "2004-05-14",
      gender: "Female",
      marks: "86.5%",
      aadhaar: "123456789012",
      bank_account: "1234567890",
      ifsc: "SBIN0001234"
    },
    {
      id: "STU2026002",
      name: "Aarav Patil",
      email: "aarav@demo.com",
      department: "Computer Engineering",
      year: "Final Year",
      phone: "9876543211",
      college: "Pune Institute of Computer Technology",
      category: "Open",
      income: "200000",
      dob: "2003-08-21",
      gender: "Male",
      marks: "91.2%",
      aadhaar: "987654321012",
      bank_account: "9876543210",
      ifsc: "HDFC0001234"
    },
    {
      id: "STU2026003",
      name: "Ananya Kulkarni",
      email: "ananya@demo.com",
      department: "ENTC",
      year: "Second Year",
      phone: "9876543212",
      college: "COEP Technological University",
      category: "OBC",
      income: "180000",
      dob: "2005-02-10",
      gender: "Female",
      marks: "78.4%",
      aadhaar: "456789012345",
      bank_account: "4567890123",
      ifsc: "BKID0005678"
    },
    {
      id: "STU2026004",
      name: "Rohan Deshmukh",
      email: "rohan@demo.com",
      department: "Mechanical",
      year: "First Year",
      phone: "9876543213",
      college: "Government College of Engineering",
      category: "EBC",
      income: "120000",
      dob: "2006-11-05",
      gender: "Male",
      marks: "82.0%",
      aadhaar: "789012345678",
      bank_account: "7890123456",
      ifsc: "MAHB0001111"
    },
    {
      id: "STU2026005",
      name: "Priya Sharma",
      email: "priya@demo.com",
      department: "Information Technology",
      year: "Final Year",
      phone: "9876543214",
      college: "VJTI Mumbai",
      category: "Open",
      income: "220000",
      dob: "2003-04-18",
      gender: "Female",
      marks: "89.0%",
      aadhaar: "321654987123",
      bank_account: "3216549870",
      ifsc: "ICIC0002222"
    },
    {
      id: "STU2026006",
      name: "Vikram Singh",
      email: "vikram@demo.com",
      department: "Computer Engineering",
      year: "Second Year",
      phone: "9876543215",
      college: "Government College of Engineering",
      category: "EBC",
      income: "350000",
      dob: "2005-09-30",
      gender: "Male",
      marks: "74.2%",
      aadhaar: "654987321456",
      bank_account: "6549873210",
      ifsc: "PUNB0003333"
    },
    {
      id: "STU2026007",
      name: "Neha Gupta",
      email: "neha@demo.com",
      department: "ENTC",
      year: "Third Year",
      phone: "9876543216",
      college: "Walchand College of Engineering",
      category: "OBC",
      income: "160000",
      dob: "2004-12-12",
      gender: "Female",
      marks: "88.1%",
      aadhaar: "852963741258",
      bank_account: "8529637410",
      ifsc: "BARB0004444"
    },
    {
      id: "STU2026008",
      name: "Amit Kumar",
      email: "amit@demo.com",
      department: "Mechanical",
      year: "Final Year",
      phone: "9876543217",
      college: "Government College of Engineering",
      category: "SC",
      income: "95000",
      dob: "2003-07-04",
      gender: "Male",
      marks: "79.8%",
      aadhaar: "963852741123",
      bank_account: "9638527410",
      ifsc: "CNRB0005555"
    }
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (id, name, email, phone, dob, gender, college, department, year, marks, category, income, aadhaar, bank_account, ifsc, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of initialStudents) {
    insertUser.run(s.id, 'student', s.name, s.email, studentHash, s.phone, new Date().toISOString());
    insertStudent.run(
      s.id, s.name, s.email, s.phone, s.dob, s.gender, s.college,
      s.department, s.year, s.marks, s.category, s.income,
      s.aadhaar, s.bank_account, s.ifsc, new Date().toISOString()
    );
  }

  // 3. Seed Mock Applications
  const initialApplications = [
    {
      id: "MH-SCH-2026-00124",
      studentId: "STU2026001",
      studentName: "Sharvari Bangar",
      department: "Information Technology",
      year: "Third Year",
      scholarshipName: "Post-Matric Scholarship",
      academicYear: "2025-2026",
      status: "Under Review",
      documentStatus: "In Progress",
      paymentStatus: "Not Started",
      submittedDate: "2026-08-15T10:00:00Z",
      lastUpdated: "2026-08-20T14:30:00Z",
      adminRemarks: JSON.stringify([
        { text: "Application received and preliminary checks passed.", date: "2026-08-18T09:00:00Z", author: "System Admin" }
      ])
    },
    {
      id: "MH-SCH-2026-00125",
      studentId: "STU2026002",
      studentName: "Aarav Patil",
      department: "Computer Engineering",
      year: "Final Year",
      scholarshipName: "Post-Matric Scholarship",
      academicYear: "2025-2026",
      status: "Approved",
      documentStatus: "Verified",
      paymentStatus: "Processing",
      submittedDate: "2026-07-10T11:00:00Z",
      lastUpdated: "2026-08-22T10:15:00Z",
      adminRemarks: JSON.stringify([
        { text: "All documents verified.", date: "2026-08-20T10:00:00Z", author: "Verifier 1" },
        { text: "Approved for payment.", date: "2026-08-22T10:00:00Z", author: "Approver" }
      ])
    },
    {
      id: "MH-SCH-2026-00126",
      studentId: "STU2026003",
      studentName: "Ananya Kulkarni",
      department: "ENTC",
      year: "Second Year",
      scholarshipName: "Post-Matric Scholarship",
      academicYear: "2025-2026",
      status: "Document Verification",
      documentStatus: "Correction Required",
      paymentStatus: "Not Started",
      submittedDate: "2026-08-25T09:30:00Z",
      lastUpdated: "2026-09-05T16:45:00Z",
      adminRemarks: JSON.stringify([
        { text: "Income certificate is blurred. Please re-upload.", date: "2026-09-05T16:40:00Z", author: "Verifier 1" }
      ])
    },
    {
      id: "MH-SCH-2026-00127",
      studentId: "STU2026004",
      studentName: "Rohan Deshmukh",
      department: "Mechanical",
      year: "First Year",
      scholarshipName: "EBC Concession",
      academicYear: "2025-2026",
      status: "Submitted",
      documentStatus: "Pending",
      paymentStatus: "Not Started",
      submittedDate: "2026-09-10T08:20:00Z",
      lastUpdated: "2026-09-10T08:20:00Z",
      adminRemarks: JSON.stringify([])
    },
    {
      id: "MH-SCH-2026-00128",
      studentId: "STU2026005",
      studentName: "Priya Sharma",
      department: "Information Technology",
      year: "Final Year",
      scholarshipName: "Post-Matric Scholarship",
      academicYear: "2025-2026",
      status: "Payment Processing",
      documentStatus: "Verified",
      paymentStatus: "Pending",
      submittedDate: "2026-06-15T10:00:00Z",
      lastUpdated: "2026-09-15T14:30:00Z",
      adminRemarks: JSON.stringify([])
    },
    {
      id: "MH-SCH-2026-00129",
      studentId: "STU2026006",
      studentName: "Vikram Singh",
      department: "Computer Engineering",
      year: "Second Year",
      scholarshipName: "EBC Concession",
      academicYear: "2025-2026",
      status: "Rejected",
      documentStatus: "Rejected",
      paymentStatus: "Not Started",
      submittedDate: "2026-07-20T10:00:00Z",
      lastUpdated: "2026-08-10T14:30:00Z",
      adminRemarks: JSON.stringify([
        { text: "Not eligible based on income criteria.", date: "2026-08-10T14:20:00Z", author: "Approver" }
      ])
    },
    {
      id: "MH-SCH-2026-00130",
      studentId: "STU2026007",
      studentName: "Neha Gupta",
      department: "ENTC",
      year: "Third Year",
      scholarshipName: "Post-Matric Scholarship",
      academicYear: "2025-2026",
      status: "Paid",
      documentStatus: "Verified",
      paymentStatus: "Paid",
      submittedDate: "2026-05-15T10:00:00Z",
      lastUpdated: "2026-08-01T14:30:00Z",
      adminRemarks: JSON.stringify([])
    },
    {
      id: "MH-SCH-2026-00131",
      studentId: "STU2026008",
      studentName: "Amit Kumar",
      department: "Mechanical",
      year: "Final Year",
      scholarshipName: "Post-Matric Scholarship",
      academicYear: "2025-2026",
      status: "Created",
      documentStatus: "Pending",
      paymentStatus: "Not Started",
      submittedDate: null,
      lastUpdated: "2026-09-20T14:30:00Z",
      adminRemarks: JSON.stringify([])
    }
  ];

  const insertApp = db.prepare(`
    INSERT INTO applications (id, student_id, student_name, department, year, scholarship_name, academic_year, status, document_status, payment_status, submitted_date, last_updated, admin_remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const app of initialApplications) {
    insertApp.run(
      app.id, app.studentId, app.studentName, app.department, app.year,
      app.scholarshipName, app.academicYear, app.status, app.documentStatus,
      app.paymentStatus, app.submittedDate, app.lastUpdated, app.adminRemarks
    );
  }

  // 4. Seed Mock Documents (marked as is_sample = 1)
  const initialDocuments = [
    { id: "DOC001", applicationId: "MH-SCH-2026-00124", studentId: "STU2026001", name: "Aadhaar Card.pdf", category: "Permanent", type: "Aadhaar Card", status: "Verified", uploadDate: "2026-08-10T10:00:00Z", remark: "" },
    { id: "DOC002", applicationId: "MH-SCH-2026-00124", studentId: "STU2026001", name: "Income_Cert.pdf", category: "Permanent", type: "Income Certificate", status: "Verified", uploadDate: "2026-08-11T11:00:00Z", remark: "" },
    { id: "DOC003", applicationId: "MH-SCH-2026-00124", studentId: "STU2026001", name: "Marksheet_2ndYear.pdf", category: "Yearly", type: "Previous Year Marksheet", status: "Pending", uploadDate: "2026-08-12T12:00:00Z", remark: "" },
    { id: "DOC004", applicationId: "MH-SCH-2026-00124", studentId: "STU2026001", name: "Fee_Receipt_3rdYear.pdf", category: "Yearly", type: "Fee Receipt", status: "Pending", uploadDate: "2026-08-13T13:00:00Z", remark: "" },

    { id: "DOC005", applicationId: "MH-SCH-2026-00125", studentId: "STU2026002", name: "Aadhaar Card.pdf", category: "Permanent", type: "Aadhaar Card", status: "Verified", uploadDate: "2026-07-05T10:00:00Z", remark: "" },
    { id: "DOC006", applicationId: "MH-SCH-2026-00125", studentId: "STU2026002", name: "Caste_Cert.pdf", category: "Permanent", type: "Caste Certificate", status: "Verified", uploadDate: "2026-07-05T11:00:00Z", remark: "" },
    { id: "DOC007", applicationId: "MH-SCH-2026-00125", studentId: "STU2026002", name: "Marksheet_3rdYear.pdf", category: "Yearly", type: "Previous Year Marksheet", status: "Verified", uploadDate: "2026-07-06T12:00:00Z", remark: "" },
    { id: "DOC008", applicationId: "MH-SCH-2026-00125", studentId: "STU2026002", name: "Fee_Receipt_FinalYear.pdf", category: "Yearly", type: "Fee Receipt", status: "Verified", uploadDate: "2026-07-07T13:00:00Z", remark: "" },

    { id: "DOC009", applicationId: "MH-SCH-2026-00126", studentId: "STU2026003", name: "Aadhaar Card.pdf", category: "Permanent", type: "Aadhaar Card", status: "Verified", uploadDate: "2026-08-20T10:00:00Z", remark: "" },
    { id: "DOC010", applicationId: "MH-SCH-2026-00126", studentId: "STU2026003", name: "Income_Cert.pdf", category: "Permanent", type: "Income Certificate", status: "Correction Required", uploadDate: "2026-08-21T11:00:00Z", remark: "Income certificate is blurred. Please re-upload." },
    { id: "DOC011", applicationId: "MH-SCH-2026-00126", studentId: "STU2026003", name: "Marksheet_1stYear.pdf", category: "Yearly", type: "Previous Year Marksheet", status: "Verified", uploadDate: "2026-08-22T12:00:00Z", remark: "" },
    { id: "DOC012", applicationId: "MH-SCH-2026-00126", studentId: "STU2026003", name: "Bonafide_Cert.pdf", category: "Yearly", type: "Bonafide Certificate", status: "Pending", uploadDate: "2026-08-23T13:00:00Z", remark: "" },

    { id: "DOC013", applicationId: "MH-SCH-2026-00127", studentId: "STU2026004", name: "Aadhaar Card.pdf", category: "Permanent", type: "Aadhaar Card", status: "Pending", uploadDate: "2026-09-08T10:00:00Z", remark: "" },
    { id: "DOC014", applicationId: "MH-SCH-2026-00127", studentId: "STU2026004", name: "Domicile_Cert.pdf", category: "Permanent", type: "Domicile Certificate", status: "Pending", uploadDate: "2026-09-08T11:00:00Z", remark: "" },
    { id: "DOC015", applicationId: "MH-SCH-2026-00127", studentId: "STU2026004", name: "Marksheet_HSC.pdf", category: "Yearly", type: "Previous Year Marksheet", status: "Pending", uploadDate: "2026-09-09T12:00:00Z", remark: "" },
    { id: "DOC016", applicationId: "MH-SCH-2026-00127", studentId: "STU2026004", name: "Fee_Receipt_1stYear.pdf", category: "Yearly", type: "Fee Receipt", status: "Pending", uploadDate: "2026-09-09T13:00:00Z", remark: "" }
  ];

  const insertDoc = db.prepare(`
    INSERT INTO documents (id, application_id, student_id, name, original_filename, stored_filename, file_path, mime_type, size_bytes, category, type, status, remark, upload_date, is_sample)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const doc of initialDocuments) {
    insertDoc.run(
      doc.id, doc.applicationId, doc.studentId, doc.name, doc.name,
      null, null, 'application/pdf', 245000, doc.category, doc.type,
      doc.status, doc.remark || '', doc.uploadDate
    );
  }

  // 5. Seed Mock Notifications
  const initialNotifications = [
    { id: "NOTIF001", userId: "STU2026001", message: "Your application MH-SCH-2026-00124 has been submitted successfully.", date: "2026-08-15T10:05:00Z", read: 1, type: "success" },
    { id: "NOTIF002", userId: "STU2026001", message: "Application MH-SCH-2026-00124 has passed preliminary checks.", date: "2026-08-18T09:05:00Z", read: 0, type: "info" },
    { id: "NOTIF003", userId: "STU2026002", message: "Congratulations! Your application MH-SCH-2026-00125 has been approved.", date: "2026-08-22T10:05:00Z", read: 0, type: "success" },
    { id: "NOTIF004", userId: "STU2026003", message: "Correction required for document: Income Certificate in application MH-SCH-2026-00126.", date: "2026-09-05T16:45:00Z", read: 0, type: "error" },
    { id: "NOTIF_ADMIN1", userId: "admin", message: "New application MH-SCH-2026-00127 submitted by Rohan Deshmukh.", date: "2026-09-10T08:25:00Z", read: 0, type: "info" },
    { id: "NOTIF_ADMIN2", userId: "admin", message: "System maintenance scheduled for next weekend.", date: "2026-09-01T10:00:00Z", read: 1, type: "warning" }
  ];

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const n of initialNotifications) {
    insertNotif.run(n.id, n.userId, n.message, n.date, n.read, n.type);
  }

  console.log('Seeding complete. Initial data populated.');
}
