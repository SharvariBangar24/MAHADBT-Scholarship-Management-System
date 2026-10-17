import fs from 'node:fs';
import path from 'node:path';

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('================================================================');
  console.log(' RUNNING END-TO-END VALIDATION: SECTION 7 LIVE EXAMINER DEMO');
  console.log('================================================================\n');

  // Step 1: Admin Login
  console.log('--- Step 1: Login as Admin ---');
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123' })
  });
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${adminLoginRes.status}`);
  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.token;
  console.log(`[PASS] Admin logged in. Name: ${adminAuth.user.name}, Role: ${adminAuth.user.role}`);

  // Step 2: Open Master Student Sheet and inspect existing records
  console.log('\n--- Step 2: Open Master Student Sheet & Inspect Pre-seeded Records ---');
  const initialMasterRes = await fetch(`${API_URL}/admin/master-sheet`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (!initialMasterRes.ok) throw new Error(`Fetch master sheet failed: ${initialMasterRes.status}`);
  const initialMaster = await initialMasterRes.json();
  console.log(`[PASS] Initial Master Sheet loaded.`);
  console.log(`       Total Students: ${initialMaster.summary.totalStudents}`);
  console.log(`       Applied: ${initialMaster.summary.appliedCount}, Pending Verif: ${initialMaster.summary.pendingVerification}, Approved: ${initialMaster.summary.approvedCount}`);
  
  const sharvari = initialMaster.records.find(r => r.studentId === 'STU2026001');
  if (!sharvari) throw new Error('STU2026001 (Sharvari Bangar) not found');
  console.log(`[PASS] Verified pre-seeded record: ${sharvari.studentId} - ${sharvari.fullName}`);
  console.log(`       Course: ${sharvari.department}, Year: ${sharvari.year}, Scheme: ${sharvari.scholarshipName}`);
  console.log(`       Documents count: ${sharvari.documents.length}, Missing: ${sharvari.missingDocuments.length}`);

  // Step 3: Register First New Student (Rahul More)
  console.log('\n--- Step 3: Register First New Student (Rahul More) ---');
  const rahulRegisterRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rahul More',
      email: 'rahul.more@demo.com',
      phone: '9823456780',
      password: 'password123',
      college: 'Government College of Engineering, Pune',
      department: 'Computer Engineering',
      year: 'Second Year',
      category: 'OBC',
      income: '180000',
      dob: '2005-06-15',
      gender: 'Male'
    })
  });
  if (!rahulRegisterRes.ok) {
    const err = await rahulRegisterRes.json();
    throw new Error(`Rahul registration failed: ${err.error}`);
  }
  const rahulAuth = await rahulRegisterRes.json();
  const rahulId = rahulAuth.user.id;
  console.log(`[PASS] First student registered: ${rahulAuth.user.name} (${rahulId})`);

  // Step 4: Register Second New Student (Pooja Patil)
  console.log('\n--- Step 4: Register Second New Student (Pooja Patil) ---');
  const poojaRegisterRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pooja Patil',
      email: 'pooja.patil@demo.com',
      phone: '9876123450',
      password: 'password123',
      college: 'Pune Institute of Computer Technology',
      department: 'Information Technology',
      year: 'Third Year',
      category: 'Open',
      income: '300000',
      dob: '2004-10-20',
      gender: 'Female'
    })
  });
  if (!poojaRegisterRes.ok) {
    const err = await poojaRegisterRes.json();
    throw new Error(`Pooja registration failed: ${err.error}`);
  }
  const poojaAuth = await poojaRegisterRes.json();
  const poojaId = poojaAuth.user.id;
  const poojaToken = poojaAuth.token;
  console.log(`[PASS] Second student registered: ${poojaAuth.user.name} (${poojaId})`);

  // Step 5: Confirm unique identifiers
  console.log('\n--- Step 5: Verify Unique Identifiers ---');
  if (rahulId === poojaId) throw new Error('Student IDs must be unique!');
  console.log(`[PASS] Rahul ID: ${rahulId}, Pooja ID: ${poojaId} (Distinct & Sequential)`);

  // Step 6: Log in as Pooja and submit scholarship application
  console.log('\n--- Step 6: Pooja Submits Scholarship Application ---');
  const appSubmitRes = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${poojaToken}`
    },
    body: JSON.stringify({
      scholarshipName: 'Post-Matric Scholarship',
      category: 'Open',
      income: '300000',
      aadhaar: '556677889900',
      bankAccount: '1122334455',
      ifsc: 'HDFC0009999'
    })
  });
  if (!appSubmitRes.ok) {
    const err = await appSubmitRes.json();
    throw new Error(`Application submission failed: ${err.error}`);
  }
  const appData = await appSubmitRes.json();
  const poojaAppId = appData.id;
  console.log(`[PASS] Application submitted successfully. ID: ${poojaAppId}`);

  // Step 7: Upload a genuine document for Pooja
  console.log('\n--- Step 7: Genuine Document Upload for Pooja ---');
  const dummyFilePath = path.join(process.cwd(), 'dummy_aadhaar.pdf');
  fs.writeFileSync(dummyFilePath, '%PDF-1.4 demo test aadhaar document content for mahadbt');

  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'application/pdf' });
  formData.append('file', fileBlob, 'Pooja_Aadhaar_Card.pdf');
  formData.append('type', 'Aadhaar Card');
  formData.append('category', 'Permanent');
  formData.append('applicationId', poojaAppId);

  const uploadRes = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${poojaToken}`
    },
    body: formData
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Upload failed: ${err.error}`);
  }
  const uploadData = await uploadRes.json();
  const poojaDocId = uploadData.document.id;
  console.log(`[PASS] Document uploaded successfully. Doc ID: ${poojaDocId}, Filename: ${uploadData.document.originalFilename}`);

  // Clean up scratch local file
  if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);

  // Step 8: Verify Document Download with Authentication
  console.log('\n--- Step 8: Verify Authenticated Document Download ---');
  const downloadRes = await fetch(`${API_URL}/documents/${poojaDocId}/file`, {
    headers: { 'Authorization': `Bearer ${poojaToken}` }
  });
  if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.status}`);
  const downloadedBuf = await downloadRes.arrayBuffer();
  console.log(`[PASS] Document downloaded securely. Size: ${downloadedBuf.byteLength} bytes.`);

  // Step 9: Verify Privacy & Access Control
  console.log('\n--- Step 9: Verify Student Cannot Access Admin Master Sheet ---');
  const unauthMasterRes = await fetch(`${API_URL}/admin/master-sheet`, {
    headers: { 'Authorization': `Bearer ${poojaToken}` }
  });
  if (unauthMasterRes.status === 403) {
    console.log(`[PASS] Access correctly denied (HTTP 403) for student accessing admin master sheet.`);
  } else {
    throw new Error(`Access control failure! Expected 403, got ${unauthMasterRes.status}`);
  }

  // Step 10: Log back in as Admin and verify Master Sheet updates
  console.log('\n--- Step 10: Admin Inspects Updated Master Sheet ---');
  const updatedMasterRes = await fetch(`${API_URL}/admin/master-sheet`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const updatedMaster = await updatedMasterRes.json();
  console.log(`[PASS] Master Sheet updated.`);
  console.log(`       Previous Student Count: ${initialMaster.summary.totalStudents}`);
  console.log(`       New Student Count:      ${updatedMaster.summary.totalStudents}`);

  if (updatedMaster.summary.totalStudents !== initialMaster.summary.totalStudents + 2) {
    throw new Error(`Expected ${initialMaster.summary.totalStudents + 2} students, found ${updatedMaster.summary.totalStudents}`);
  }
  console.log(`[PASS] Both newly registered students are counted in live KPIs!`);

  const poojaRecord = updatedMaster.records.find(r => r.studentId === poojaId);
  const rahulRecord = updatedMaster.records.find(r => r.studentId === rahulId);
  if (!poojaRecord || !rahulRecord) throw new Error('Newly registered students missing from records!');
  console.log(`[PASS] Confirmed Rahul More in Master Sheet (${rahulRecord.department})`);
  console.log(`[PASS] Confirmed Pooja Patil in Master Sheet (${poojaRecord.department}, App: ${poojaRecord.applicationId}, Scheme: ${poojaRecord.scholarshipName})`);

  const poojaUploadedDoc = poojaRecord.documents.find(d => d.id === poojaDocId);
  if (!poojaUploadedDoc) throw new Error('Uploaded document missing from Pooja master record');
  console.log(`[PASS] Pooja uploaded document found: ${poojaUploadedDoc.name} (isSample: ${poojaUploadedDoc.isSample}, hasFile: ${poojaUploadedDoc.hasFile})`);

  // Step 11: Admin Verifies Document and Approves Application
  console.log('\n--- Step 11: Admin Verifies Document & Approves Application ---');
  const verifyDocRes = await fetch(`${API_URL}/documents/${poojaDocId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'Verified',
      remark: 'Verified against Maharashtra Aadhaar UIDAI registry.'
    })
  });
  if (!verifyDocRes.ok) throw new Error('Verify document failed');
  console.log(`[PASS] Document ${poojaDocId} marked as 'Verified' with admin remark.`);

  const approveAppRes = await fetch(`${API_URL}/applications/${poojaAppId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'Approved',
      remark: 'All criteria met. Approved for scholarship disbursement.'
    })
  });
  if (!approveAppRes.ok) throw new Error('Approve application failed');
  console.log(`[PASS] Application ${poojaAppId} marked as 'Approved'.`);

  // Step 12: Verify Persistence across fresh query
  console.log('\n--- Step 12: Verify Persistence across Database Query ---');
  const persistCheckRes = await fetch(`${API_URL}/admin/master-sheet`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const persistCheck = await persistCheckRes.json();
  const reloadedPooja = persistCheck.records.find(r => r.studentId === poojaId);
  if (reloadedPooja.applicationStatus !== 'Approved') {
    throw new Error(`Expected Approved status, got ${reloadedPooja.applicationStatus}`);
  }
  const reloadedDoc = reloadedPooja.documents.find(d => d.id === poojaDocId);
  if (reloadedDoc.status !== 'Verified') {
    throw new Error(`Expected Verified document status, got ${reloadedDoc.status}`);
  }
  console.log(`[PASS] Database Persistence Confirmed:`);
  console.log(`       Pooja Application Status: ${reloadedPooja.applicationStatus}`);
  console.log(`       Pooja Aadhaar Status:     ${reloadedDoc.status}`);
  console.log(`       Admin Remark:             "${reloadedDoc.remark}"`);

  console.log('\n================================================================');
  console.log(' ALL 12 VALIDATION STEPS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTest().catch(err => {
  console.error('\n[FAIL] Test encountered error:', err);
  process.exit(1);
});
