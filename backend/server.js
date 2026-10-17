import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { db, initDatabase } from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mahadbt_secure_jwt_token_key_2026_prototype';
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Initialize database
initDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Multer Storage Configuration for Document Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitized}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

// Login (Student or Admin)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone
    }
  });
});

// Dynamic Student Registration
app.post('/api/auth/register', (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    college,
    department,
    year,
    dob,
    gender,
    category,
    income,
    aadhaar,
    bankAccount,
    ifsc
  } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Full name, email, password, and phone number are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Check duplicate email
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  // Generate unique Student ID (e.g., STU2026009)
  const allStudentIds = db.prepare("SELECT id FROM users WHERE role = 'student'").all();
  let maxNum = 0;
  for (const row of allStudentIds) {
    const match = row.id.match(/^STU(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  let nextId;
  if (maxNum >= 2026000) {
    nextId = `STU${maxNum + 1}`;
  } else {
    nextId = `STU2026${String(allStudentIds.length + 1).padStart(3, '0')}`;
  }

  // Double check ID uniqueness
  while (db.prepare('SELECT id FROM users WHERE id = ?').get(nextId)) {
    const numericPart = parseInt(nextId.replace('STU', ''), 10) + 1;
    nextId = `STU${numericPart}`;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  // Insert User
  db.prepare(`
    INSERT INTO users (id, role, name, email, password_hash, phone, created_at)
    VALUES (?, 'student', ?, ?, ?, ?, ?)
  `).run(nextId, name.trim(), cleanEmail, passwordHash, phone.trim(), now);

  // Insert Student Profile
  db.prepare(`
    INSERT INTO students (id, name, email, phone, dob, gender, college, department, year, marks, category, income, aadhaar, bank_account, ifsc, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nextId,
    name.trim(),
    cleanEmail,
    phone.trim(),
    dob || 'Not Provided',
    gender || 'Not Provided',
    college || 'Government College of Engineering',
    department || 'Information Technology',
    year || 'First Year',
    'Not Available',
    category || 'Open',
    income || 'Not Provided',
    aadhaar || '',
    bankAccount || '',
    ifsc || '',
    now
  );

  // Add welcome notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, ?, ?, ?, 0, 'success')
  `).run(
    `NOTIF_${Date.now()}`,
    nextId,
    `Welcome ${name}! Your registration ID is ${nextId}. You can now apply for eligible scholarships.`,
    now
  );

  // Add admin notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, 'admin', ?, ?, 0, 'info')
  `).run(
    `NOTIF_ADMIN_${Date.now()}`,
    `New student registered: ${name} (${nextId}) from ${department || 'General'}.`,
    now
  );

  const token = jwt.sign(
    { id: nextId, role: 'student', name: name.trim(), email: cleanEmail },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    message: 'Registration successful!',
    token,
    user: {
      id: nextId,
      role: 'student',
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim()
    }
  });
});

// Current User Details
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, role, name, email, phone FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = db.prepare('SELECT * FROM students WHERE id = ?').get(user.id);
  }

  return res.json({ user, studentProfile });
});

// ----------------------------------------------------
// ADMIN MASTER SHEET & STUDENT RECORDS
// ----------------------------------------------------

const STANDARD_REQUIRED_DOCUMENTS = [
  'Aadhaar Card',
  'Income Certificate',
  'Previous Year Marksheet',
  'Fee Receipt'
];

app.get('/api/admin/master-sheet', authMiddleware, requireAdmin, (req, res) => {
  // 1. Fetch all students
  const students = db.prepare(`
    SELECT s.*, u.created_at as registered_date
    FROM students s
    JOIN users u ON s.id = u.id
    ORDER BY s.id ASC
  `).all();

  // 2. Fetch all applications
  const applications = db.prepare(`SELECT * FROM applications`).all();

  // 3. Fetch all documents
  const documents = db.prepare(`SELECT * FROM documents`).all();

  // Build consolidated student records
  const masterRecords = students.map(student => {
    // Find latest or matching application for student
    const studentApps = applications.filter(a => a.student_id === student.id);
    const primaryApp = studentApps.length > 0 ? studentApps[0] : null;

    // Parse remarks
    let parsedRemarks = [];
    if (primaryApp && primaryApp.admin_remarks) {
      try {
        parsedRemarks = JSON.parse(primaryApp.admin_remarks);
      } catch (e) {
        parsedRemarks = [];
      }
    }

    // Student's documents (matching application or student ID)
    const studentDocs = documents.filter(d => 
      d.student_id === student.id || (primaryApp && d.application_id === primaryApp.id)
    );

    // Document types submitted
    const submittedTypes = studentDocs.map(d => d.type.toLowerCase().trim());

    // Check for missing mandatory documents
    const missingDocs = STANDARD_REQUIRED_DOCUMENTS.filter(
      reqDoc => !submittedTypes.some(sub => sub.includes(reqDoc.toLowerCase()) || reqDoc.toLowerCase().includes(sub))
    );

    const docCounts = {
      total: studentDocs.length,
      verified: studentDocs.filter(d => d.status === 'Verified').length,
      pending: studentDocs.filter(d => d.status === 'Pending' || d.status === 'In Progress').length,
      correctionRequired: studentDocs.filter(d => d.status === 'Correction Required').length,
      rejected: studentDocs.filter(d => d.status === 'Rejected').length,
      missingCount: primaryApp ? missingDocs.length : STANDARD_REQUIRED_DOCUMENTS.length
    };

    let overallDocStatus = 'Not Uploaded';
    if (studentDocs.length > 0) {
      if (docCounts.correctionRequired > 0) overallDocStatus = 'Correction Required';
      else if (docCounts.rejected > 0) overallDocStatus = 'Rejected';
      else if (docCounts.pending > 0) overallDocStatus = 'Pending';
      else if (docCounts.verified === studentDocs.length && missingDocs.length === 0) overallDocStatus = 'Fully Verified';
      else overallDocStatus = 'Partially Verified';
    }

    return {
      studentId: student.id,
      fullName: student.name,
      email: student.email,
      phone: student.phone || 'Not Provided',
      dob: student.dob && student.dob !== '' ? student.dob : 'Not Provided',
      gender: student.gender && student.gender !== '' ? student.gender : 'Not Provided',
      college: student.college || 'Government College of Engineering',
      department: student.department || 'Not Provided',
      year: student.year || 'Not Provided',
      marks: student.marks && student.marks !== '' ? student.marks : 'Not Available',
      category: student.category || 'Open',
      income: student.income && student.income !== '' ? student.income : 'Not Provided',
      aadhaar: student.aadhaar || 'Not Provided',
      bankAccount: student.bank_account || 'Not Provided',
      ifsc: student.ifsc || 'Not Provided',
      registeredDate: student.registered_date || student.created_at,

      // Application info
      hasApplication: !!primaryApp,
      applicationId: primaryApp ? primaryApp.id : 'No Application',
      scholarshipName: primaryApp ? primaryApp.scholarship_name : 'None Applied',
      academicYear: primaryApp ? primaryApp.academic_year : '2025-2026',
      applicationStatus: primaryApp ? primaryApp.status : 'Not Applied',
      documentStatus: primaryApp ? primaryApp.document_status : overallDocStatus,
      paymentStatus: primaryApp ? primaryApp.payment_status : 'Not Started',
      submittedDate: primaryApp && primaryApp.submitted_date ? primaryApp.submitted_date : 'Not Submitted',
      lastUpdated: primaryApp ? primaryApp.last_updated : student.created_at,
      adminRemarks: parsedRemarks,

      // Documents info
      documents: studentDocs.map(d => ({
        id: d.id,
        name: d.name,
        originalFilename: d.original_filename || d.name,
        category: d.category || 'General',
        type: d.type,
        status: d.status,
        remark: d.remark || '',
        uploadDate: d.upload_date,
        isSample: d.is_sample === 1,
        sizeBytes: d.size_bytes || 0,
        hasFile: !d.is_sample && !!d.stored_filename
      })),
      missingDocuments: primaryApp ? missingDocs : STANDARD_REQUIRED_DOCUMENTS,
      docCounts,
      overallDocStatus
    };
  });

  // Calculate live summary indicators
  const totalStudents = masterRecords.length;
  const appliedCount = masterRecords.filter(m => m.hasApplication).length;
  const pendingVerification = masterRecords.filter(m => m.applicationStatus === 'Document Verification' || m.overallDocStatus === 'Pending' || m.documentStatus === 'Pending' || m.documentStatus === 'In Progress').length;
  const approvedCount = masterRecords.filter(m => m.applicationStatus === 'Approved' || m.applicationStatus === 'Paid' || m.applicationStatus === 'Payment Processing').length;
  const rejectedCount = masterRecords.filter(m => m.applicationStatus === 'Rejected').length;

  return res.json({
    summary: {
      totalStudents,
      appliedCount,
      pendingVerification,
      approvedCount,
      rejectedCount
    },
    records: masterRecords
  });
});

// Get all students (Admin)
app.get('/api/students', authMiddleware, requireAdmin, (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY id ASC').all();
  return res.json(students);
});

// Get single student profile
app.get('/api/students/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const apps = db.prepare('SELECT * FROM applications WHERE student_id = ?').all();
  const docs = db.prepare('SELECT * FROM documents WHERE student_id = ?').all();

  return res.json({ student, applications: apps, documents: docs });
});

// Update student profile
app.patch('/api/students/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { dob, gender, college, department, year, marks, category, income, aadhaar, bankAccount, ifsc } = req.body;

  db.prepare(`
    UPDATE students SET
      dob = COALESCE(?, dob),
      gender = COALESCE(?, gender),
      college = COALESCE(?, college),
      department = COALESCE(?, department),
      year = COALESCE(?, year),
      marks = COALESCE(?, marks),
      category = COALESCE(?, category),
      income = COALESCE(?, income),
      aadhaar = COALESCE(?, aadhaar),
      bank_account = COALESCE(?, bank_account),
      ifsc = COALESCE(?, ifsc)
    WHERE id = ?
  `).run(dob, gender, college, department, year, marks, category, income, aadhaar, bankAccount, ifsc, id);

  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  return res.json(updated);
});

// ----------------------------------------------------
// APPLICATIONS
// ----------------------------------------------------

// Get applications
app.get('/api/applications', authMiddleware, (req, res) => {
  let apps;
  if (req.user.role === 'admin') {
    apps = db.prepare('SELECT * FROM applications ORDER BY last_updated DESC').all();
  } else {
    apps = db.prepare('SELECT * FROM applications WHERE student_id = ? ORDER BY last_updated DESC').all(req.user.id);
  }

  // Format admin_remarks JSON
  const formatted = apps.map(app => {
    let remarks = [];
    try {
      remarks = JSON.parse(app.admin_remarks || '[]');
    } catch (e) {
      remarks = [];
    }
    return {
      id: app.id,
      studentId: app.student_id,
      studentName: app.student_name,
      department: app.department,
      year: app.year,
      scholarshipName: app.scholarship_name,
      academicYear: app.academic_year,
      status: app.status,
      documentStatus: app.document_status,
      paymentStatus: app.payment_status,
      submittedDate: app.submitted_date,
      lastUpdated: app.last_updated,
      adminRemarks: remarks
    };
  });

  return res.json(formatted);
});

// Submit Application
app.post('/api/applications', authMiddleware, (req, res) => {
  const { scholarshipName, category, income, aadhaar, bankAccount, ifsc } = req.body;
  const studentId = req.user.id;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Check if student already has an active application
  const existing = db.prepare('SELECT id FROM applications WHERE student_id = ?').get(studentId);
  if (existing) {
    return res.status(400).json({ error: 'Application already exists for this student.' });
  }

  // Update profile details if provided in application
  db.prepare(`
    UPDATE students SET
      category = COALESCE(?, category),
      income = COALESCE(?, income),
      aadhaar = COALESCE(?, aadhaar),
      bank_account = COALESCE(?, bank_account),
      ifsc = COALESCE(?, ifsc)
    WHERE id = ?
  `).run(category, income, aadhaar, bankAccount, ifsc, studentId);

  const randNum = Math.floor(10000 + Math.random() * 90000);
  const appId = `MH-SCH-2026-${randNum}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO applications (
      id, student_id, student_name, department, year,
      scholarship_name, academic_year, status, document_status,
      payment_status, submitted_date, last_updated, admin_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', 'Pending', 'Not Started', ?, ?, '[]')
  `).run(
    appId,
    studentId,
    student.name,
    student.department,
    student.year,
    scholarshipName || 'Post-Matric Scholarship',
    '2025-2026',
    now,
    now
  );

  // Link any previously uploaded unlinked documents for this student
  db.prepare(`
    UPDATE documents SET application_id = ? WHERE student_id = ? AND (application_id IS NULL OR application_id = '')
  `).run(appId, studentId);

  // Add student notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, ?, ?, ?, 0, 'success')
  `).run(
    `NOTIF_${Date.now()}`,
    studentId,
    `Your application ${appId} has been submitted successfully.`,
    now
  );

  // Add admin notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, 'admin', ?, ?, 0, 'info')
  `).run(
    `NOTIF_ADMIN_${Date.now()}`,
    `New application ${appId} submitted by ${student.name}.`,
    now
  );

  return res.status(201).json({ id: appId, message: 'Application submitted successfully.' });
});

// Admin Update Application Status
app.patch('/api/applications/:id/status', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  let remarks = [];
  try {
    remarks = JSON.parse(app.admin_remarks || '[]');
  } catch (e) {
    remarks = [];
  }

  const now = new Date().toISOString();
  if (remark && typeof remark === 'string' && remark.trim() !== '') {
    remarks.push({
      text: remark.trim(),
      date: now,
      author: req.user.name || 'System Admin'
    });
  } else if (remark && typeof remark === 'object' && remark.text) {
    remarks.push(remark);
  }

  let paymentStatus = app.payment_status;
  if (status === 'Approved' && paymentStatus === 'Not Started') {
    paymentStatus = 'Pending';
  } else if (status === 'Payment Processing') {
    paymentStatus = 'Processing';
  } else if (status === 'Paid') {
    paymentStatus = 'Paid';
  }

  db.prepare(`
    UPDATE applications SET
      status = ?,
      payment_status = ?,
      last_updated = ?,
      admin_remarks = ?
    WHERE id = ?
  `).run(status, paymentStatus, now, JSON.stringify(remarks), id);

  // Notify student
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(
    `NOTIF_${Date.now()}`,
    app.student_id,
    `Your application ${id} status is now: ${status}.`,
    now,
    status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'info'
  );

  return res.json({ message: 'Application status updated.', status, paymentStatus, adminRemarks: remarks });
});

// ----------------------------------------------------
// DOCUMENTS & GENUINE FILE UPLOAD
// ----------------------------------------------------

// Get documents
app.get('/api/documents', authMiddleware, (req, res) => {
  let docs;
  if (req.user.role === 'admin') {
    docs = db.prepare('SELECT * FROM documents ORDER BY upload_date DESC').all();
  } else {
    docs = db.prepare('SELECT * FROM documents WHERE student_id = ? ORDER BY upload_date DESC').all(req.user.id);
  }

  const formatted = docs.map(d => ({
    id: d.id,
    applicationId: d.application_id,
    studentId: d.student_id,
    name: d.name,
    originalFilename: d.original_filename || d.name,
    category: d.category,
    type: d.type,
    status: d.status,
    remark: d.remark,
    uploadDate: d.upload_date,
    isSample: d.is_sample === 1,
    sizeBytes: d.size_bytes,
    hasFile: !d.is_sample && !!d.stored_filename
  }));

  return res.json(formatted);
});

// Genuine File Upload
app.post('/api/documents/upload', authMiddleware, upload.single('file'), (req, res) => {
  const { type, category, applicationId } = req.body;
  const studentId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Permitted formats: PDF, JPG, PNG.' });
  }

  if (!type) {
    return res.status(400).json({ error: 'Document type is required.' });
  }

  const docId = `DOC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  // Find app ID if not specified
  let targetAppId = applicationId;
  if (!targetAppId) {
    const app = db.prepare('SELECT id FROM applications WHERE student_id = ?').get(studentId);
    if (app) targetAppId = app.id;
  }

  // Insert into documents table
  db.prepare(`
    INSERT INTO documents (
      id, application_id, student_id, name, original_filename,
      stored_filename, file_path, mime_type, size_bytes,
      category, type, status, remark, upload_date, is_sample
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?, 0)
  `).run(
    docId,
    targetAppId || null,
    studentId,
    req.file.originalname,
    req.file.originalname,
    req.file.filename,
    req.file.path,
    req.file.mimetype,
    req.file.size,
    category || (type.includes('Marksheet') || type.includes('Receipt') ? 'Yearly' : 'Permanent'),
    type,
    now
  );

  // Update application documentStatus if exists
  if (targetAppId) {
    db.prepare(`
      UPDATE applications SET document_status = 'Pending', last_updated = ? WHERE id = ?
    `).run(now, targetAppId);
  }

  // Notify admin
  const student = db.prepare('SELECT name FROM students WHERE id = ?').get(studentId);
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, 'admin', ?, ?, 0, 'info')
  `).run(
    `NOTIF_ADMIN_${Date.now()}`,
    `New document '${type}' uploaded by ${student?.name || studentId}.`,
    now
  );

  return res.status(201).json({
    message: 'Document uploaded successfully.',
    document: {
      id: docId,
      applicationId: targetAppId,
      name: req.file.originalname,
      originalFilename: req.file.originalname,
      type,
      category: category || 'General',
      status: 'Pending',
      uploadDate: now,
      isSample: false,
      sizeBytes: req.file.size
    }
  });
});

// Admin Document Verification (Verify / Correction Required / Reject)
app.patch('/api/documents/:id/status', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  db.prepare(`
    UPDATE documents SET status = ?, remark = ? WHERE id = ?
  `).run(status, remark !== undefined ? remark : doc.remark, id);

  const now = new Date().toISOString();

  // If application exists, recompute overall document status
  if (doc.application_id) {
    const appDocs = db.prepare('SELECT status FROM documents WHERE application_id = ?').all(doc.application_id);
    let appDocStatus = 'Verified';
    if (appDocs.some(d => d.status === 'Correction Required')) {
      appDocStatus = 'Correction Required';
    } else if (appDocs.some(d => d.status === 'Rejected')) {
      appDocStatus = 'Rejected';
    } else if (appDocs.some(d => d.status === 'Pending' || d.status === 'In Progress')) {
      appDocStatus = 'In Progress';
    }

    db.prepare(`
      UPDATE applications SET document_status = ?, last_updated = ? WHERE id = ?
    `).run(appDocStatus, now, doc.application_id);
  }

  // Notify student
  db.prepare(`
    INSERT INTO notifications (id, user_id, message, date, read, type)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(
    `NOTIF_${Date.now()}`,
    doc.student_id,
    `Your document '${doc.type}' status has been updated to: ${status}${remark ? ` (Remark: ${remark})` : ''}.`,
    now,
    status === 'Verified' ? 'success' : status === 'Correction Required' ? 'error' : 'warning'
  );

  return res.json({ message: 'Document status updated.', status, remark });
});

// Secure Authenticated Document Download / Inspection
app.get('/api/documents/:id/file', authMiddleware, (req, res) => {
  const { id } = req.params;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Access check: must be admin or owning student
  if (req.user.role !== 'admin' && req.user.id !== doc.student_id) {
    return res.status(403).json({ error: 'Access denied to this document.' });
  }

  // If real uploaded file on disk
  if (!doc.is_sample && doc.file_path && fs.existsSync(doc.file_path)) {
    return res.download(doc.file_path, doc.original_filename || doc.name);
  }

  // If sample / demo record, deliver a generated informative text/PDF preview
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `inline; filename="DEMO_PREVIEW_${doc.name}.txt"`);
  return res.send(`=======================================================
MAHADBT SCHOLARSHIP MANAGEMENT SYSTEM - DEMO DOCUMENT PREVIEW
=======================================================
Document ID: ${doc.id}
Document Type: ${doc.type}
Category: ${doc.category || 'General'}
Student ID: ${doc.student_id}
Application ID: ${doc.application_id || 'N/A'}
Status: ${doc.status}
Upload Date: ${doc.upload_date}
Note: This is a pre-seeded demonstration placeholder document record.
For newly registered students during this demonstration, genuine file
uploads are stored in the server uploads directory and delivered here.
=======================================================`);
});

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------

// Get user notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC
  `).all(req.user.role === 'admin' ? 'admin' : req.user.id);

  const formatted = notifs.map(n => ({
    id: n.id,
    userId: n.user_id,
    message: n.message,
    date: n.date,
    read: n.read === 1,
    type: n.type
  }));

  return res.json(formatted);
});

// Mark notification read
app.patch('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  return res.json({ success: true });
});

// ----------------------------------------------------
// SERVER START
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`MAHADBT Backend API server running on http://localhost:${PORT}`);
});
