import React, { useState, useEffect, useContext } from 'react';
import { Layout } from '../../components/common/Layout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppDataContext } from '../../context/AppDataContext';
import { api } from '../../utils/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Download,
  ExternalLink,
  X,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  User,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

const MasterStudentSheet = () => {
  const { updateDocumentStatus, updateApplicationStatus, downloadDocumentFile } = useContext(AppDataContext);
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    appliedCount: 0,
    pendingVerification: 0,
    approvedCount: 0,
    rejectedCount: 0
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('All');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [docStatusFilter, setDocStatusFilter] = useState('All');
  const [missingDocsOnly, setMissingDocsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('id-asc');

  // Inspection Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [adminRemarkInput, setAdminRemarkInput] = useState('');
  const [docRemarks, setDocRemarks] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/master-sheet');
      setRecords(data.records || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Failed to fetch master sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Filter and sort logic
  const filteredRecords = records.filter(r => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      r.studentId.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.applicationId.toLowerCase().includes(q);

    const matchesScheme = schemeFilter === 'All' || r.scholarshipName === schemeFilter;
    const matchesAppStatus = appStatusFilter === 'All' || r.applicationStatus === appStatusFilter;
    
    let matchesDocStatus = true;
    if (docStatusFilter === 'Verified') {
      matchesDocStatus = r.overallDocStatus === 'Fully Verified' || r.documentStatus === 'Verified';
    } else if (docStatusFilter === 'Pending') {
      matchesDocStatus = r.overallDocStatus === 'Pending' || r.documentStatus === 'Pending' || r.documentStatus === 'In Progress';
    } else if (docStatusFilter === 'Correction Required') {
      matchesDocStatus = r.overallDocStatus === 'Correction Required' || r.documentStatus === 'Correction Required';
    } else if (docStatusFilter === 'Missing') {
      matchesDocStatus = r.missingDocuments && r.missingDocuments.length > 0;
    }

    const matchesMissingOnly = !missingDocsOnly || (r.missingDocuments && r.missingDocuments.length > 0);

    return matchesSearch && matchesScheme && matchesAppStatus && matchesDocStatus && matchesMissingOnly;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.fullName.localeCompare(b.fullName);
    if (sortBy === 'name-desc') return b.fullName.localeCompare(a.fullName);
    if (sortBy === 'id-asc') return a.studentId.localeCompare(b.studentId);
    if (sortBy === 'date-desc') return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    if (sortBy === 'status') return a.applicationStatus.localeCompare(b.applicationStatus);
    return 0;
  });

  // Dynamic calculated indicators
  const displaySummary = {
    totalStudents: records.length,
    appliedCount: records.filter(r => r.hasApplication).length,
    pendingVerification: records.filter(r => r.applicationStatus === 'Document Verification' || r.documentStatus === 'Pending' || r.documentStatus === 'In Progress' || r.overallDocStatus === 'Pending').length,
    approvedCount: records.filter(r => r.applicationStatus === 'Approved' || r.applicationStatus === 'Paid' || r.applicationStatus === 'Payment Processing').length,
    rejectedCount: records.filter(r => r.applicationStatus === 'Rejected').length
  };

  // Open modal
  const openInspector = (record) => {
    setSelectedRecord(record);
    setAdminRemarkInput('');
    setActionSuccess('');
    setInspectModalOpen(true);
  };

  // Handle doc verification inside modal
  const handleVerifyDoc = async (docId, status) => {
    const remark = docRemarks[docId] || '';
    await updateDocumentStatus(docId, status, remark);
    setActionSuccess(`Document updated to ${status}.`);
    
    // Update local modal state
    setSelectedRecord(prev => {
      if (!prev) return prev;
      const updatedDocs = prev.documents.map(d => d.id === docId ? { ...d, status, remark } : d);
      return { ...prev, documents: updatedDocs };
    });

    fetchMasterData();
    setTimeout(() => setActionSuccess(''), 2500);
  };

  // Handle app status change inside modal
  const handleAppStatusChange = async (newStatus) => {
    if (!selectedRecord || !selectedRecord.hasApplication) return;
    const remarkText = adminRemarkInput.trim() || undefined;
    await updateApplicationStatus(selectedRecord.applicationId, newStatus, remarkText);
    setActionSuccess(`Application status changed to ${newStatus}.`);

    setSelectedRecord(prev => ({
      ...prev,
      applicationStatus: newStatus,
      adminRemarks: remarkText ? [{ text: remarkText, date: new Date().toISOString(), author: 'System Admin' }, ...prev.adminRemarks] : prev.adminRemarks
    }));

    setAdminRemarkInput('');
    fetchMasterData();
    setTimeout(() => setActionSuccess(''), 2500);
  };

  // ----------------------------------------------------
  // EXCEL EXPORT
  // ----------------------------------------------------
  const exportToExcel = (exportAll = false) => {
    const dataToExport = exportAll ? records : filteredRecords;

    if (dataToExport.length === 0) {
      alert('No records available to export.');
      return;
    }

    // Sheet 1: Master Student Records
    const masterRows = dataToExport.map((r, index) => ({
      'Sr. No.': index + 1,
      'Student ID': r.studentId,
      'Full Name': r.fullName,
      'Email Address': r.email,
      'Mobile Number': r.phone,
      'Date of Birth': r.dob,
      'Gender': r.gender,
      'Category': r.category,
      'Annual Income (Rs.)': r.income,
      'College / Institute': r.college,
      'Course / Branch': r.department,
      'Academic Year': r.year,
      'Academic Marks': r.marks,
      'Application ID': r.applicationId,
      'Scholarship Scheme': r.scholarshipName,
      'Application Status': r.applicationStatus,
      'Doc Verification Status': r.documentStatus,
      'Payment Status': r.paymentStatus,
      'Submission Date': r.submittedDate !== 'Not Submitted' ? new Date(r.submittedDate).toLocaleDateString() : 'Not Submitted',
      'Missing Documents': r.missingDocuments && r.missingDocuments.length > 0 ? r.missingDocuments.join(', ') : 'None (All Uploaded)',
      'Total Docs Uploaded': r.docCounts.total,
      'Verified Docs': r.docCounts.verified,
      'Pending Docs': r.docCounts.pending,
      'Aadhaar Number': r.aadhaar,
      'Bank Account': r.bankAccount,
      'IFSC Code': r.ifsc,
      'Last Updated': new Date(r.lastUpdated).toLocaleString()
    }));

    // Sheet 2: Documents Detail
    const docRows = [];
    dataToExport.forEach(r => {
      if (r.documents && r.documents.length > 0) {
        r.documents.forEach(d => {
          docRows.push({
            'Student ID': r.studentId,
            'Student Name': r.fullName,
            'Application ID': r.applicationId,
            'Document ID': d.id,
            'Document Type': d.type,
            'Category': d.category,
            'Filename': d.originalFilename || d.name,
            'Verification Status': d.status,
            'Admin Remark': d.remark || 'None',
            'Upload Date': new Date(d.uploadDate).toLocaleDateString(),
            'Record Type': d.isSample ? 'Sample / Pre-seeded Record' : 'Real Uploaded File'
          });
        });
      }
    });

    const workbook = XLSX.utils.book_new();

    const masterWorksheet = XLSX.utils.json_to_sheet(masterRows);
    masterWorksheet['!cols'] = [
      { wch: 8 },  // Sr. No
      { wch: 14 }, // Student ID
      { wch: 22 }, // Full Name
      { wch: 26 }, // Email
      { wch: 15 }, // Mobile
      { wch: 14 }, // DOB
      { wch: 10 }, // Gender
      { wch: 10 }, // Category
      { wch: 18 }, // Income
      { wch: 30 }, // College
      { wch: 24 }, // Department
      { wch: 15 }, // Year
      { wch: 14 }, // Marks
      { wch: 20 }, // App ID
      { wch: 28 }, // Scheme
      { wch: 18 }, // App Status
      { wch: 22 }, // Doc Status
      { wch: 16 }, // Payment
      { wch: 16 }, // Sub Date
      { wch: 32 }, // Missing Docs
      { wch: 18 }, // Total Docs
      { wch: 14 }, // Verified
      { wch: 14 }, // Pending
      { wch: 16 }, // Aadhaar
      { wch: 16 }, // Bank
      { wch: 14 }, // IFSC
      { wch: 22 }  // Last Updated
    ];

    XLSX.utils.book_append_sheet(workbook, masterWorksheet, 'Master Student Records');

    if (docRows.length > 0) {
      const docWorksheet = XLSX.utils.json_to_sheet(docRows);
      docWorksheet['!cols'] = [
        { wch: 14 },
        { wch: 22 },
        { wch: 20 },
        { wch: 14 },
        { wch: 24 },
        { wch: 14 },
        { wch: 26 },
        { wch: 18 },
        { wch: 30 },
        { wch: 14 },
        { wch: 24 }
      ];
      XLSX.utils.book_append_sheet(workbook, docWorksheet, 'Documents Detail');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    XLSX.writeFile(workbook, `MAHADBT_Master_Student_Records_${timestamp}.xlsx`);
  };

  // ----------------------------------------------------
  // PDF EXPORT
  // ----------------------------------------------------
  const exportToPDF = (exportAll = false) => {
    const dataToExport = exportAll ? records : filteredRecords;

    if (dataToExport.length === 0) {
      alert('No records available to export.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const generatedDate = new Date().toLocaleString();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138); // Primary dark blue
    doc.text('MAHADBT — Student Master Report', 40, 45);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${generatedDate} | Filter: ${schemeFilter} / Status: ${appStatusFilter} | Total Records: ${dataToExport.length}`, 40, 65);

    // Summary Box
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(248, 249, 251);
    doc.roundedRect(40, 75, 762, 38, 4, 4, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    const summaryText = `Total Students: ${dataToExport.length}  |  Submitted Applications: ${dataToExport.filter(r => r.hasApplication).length}  |  Pending Verification: ${dataToExport.filter(r => r.documentStatus === 'Pending' || r.documentStatus === 'In Progress').length}  |  Approved: ${dataToExport.filter(r => r.applicationStatus === 'Approved' || r.applicationStatus === 'Paid').length}  |  Rejected: ${dataToExport.filter(r => r.applicationStatus === 'Rejected').length}`;
    doc.text(summaryText, 50, 98);

    // Table Columns
    const tableColumns = [
      { header: 'ID', dataKey: 'studentId' },
      { header: 'Student Name', dataKey: 'fullName' },
      { header: 'Department & Year', dataKey: 'deptYear' },
      { header: 'Contact', dataKey: 'contact' },
      { header: 'Application ID', dataKey: 'applicationId' },
      { header: 'Scheme Name', dataKey: 'scholarshipName' },
      { header: 'App Status', dataKey: 'applicationStatus' },
      { header: 'Doc Status', dataKey: 'docStatus' },
      { header: 'Missing Docs', dataKey: 'missingDocs' }
    ];

    const tableRows = dataToExport.map(r => ({
      studentId: r.studentId,
      fullName: r.fullName,
      deptYear: `${r.department}\n(${r.year})`,
      contact: `${r.email}\n${r.phone}`,
      applicationId: r.applicationId,
      scholarshipName: r.scholarshipName,
      applicationStatus: r.applicationStatus,
      docStatus: `${r.documentStatus}\n(${r.docCounts.verified}/${r.docCounts.total} verified)`,
      missingDocs: r.missingDocuments && r.missingDocuments.length > 0 ? r.missingDocuments.join(', ') : 'None (Complete)'
    }));

    autoTable(doc, {
      startY: 125,
      columns: tableColumns,
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 6,
        overflow: 'linebreak',
        textColor: [31, 41, 55],
        lineColor: [229, 231, 235],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 249, 251]
      },
      columnStyles: {
        studentId: { cellWidth: 70 },
        fullName: { cellWidth: 100, fontStyle: 'bold' },
        deptYear: { cellWidth: 95 },
        contact: { cellWidth: 110 },
        applicationId: { cellWidth: 85 },
        scholarshipName: { cellWidth: 100 },
        applicationStatus: { cellWidth: 65 },
        docStatus: { cellWidth: 65 },
        missingDocs: { cellWidth: 72 }
      },
      didDrawPage: (data) => {
        // Page footer
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        const str = `Page ${doc.internal.getNumberOfPages()} — MAHADBT Scholarship Management Prototype (Confidential Admin Master Report)`;
        doc.text(str, 40, doc.internal.pageSize.height - 20);
      }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    doc.save(`MAHADBT_Student_Master_Report_${timestamp}.pdf`);
  };

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            Master Student Records
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Consolidated record of all registered students, scholarship schemes, application lifecycles, and submitted documents.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchMasterData} 
            title="Refresh records from database"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: '#107c41', color: 'white' }}
            onClick={() => exportToExcel(false)}
          >
            <FileSpreadsheet size={16} /> Export to Excel
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: '#b91c1c', color: 'white' }}
            onClick={() => exportToPDF(false)}
          >
            <FileText size={16} /> Export to PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Total Registered Students</p>
              <h2 style={{ fontSize: '26px', marginTop: '4px' }}>{displaySummary.totalStudents}</h2>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '50%' }}>
              <User size={22} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {displaySummary.appliedCount} have submitted applications
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Pending Doc Verification</p>
              <h2 style={{ fontSize: '26px', marginTop: '4px', color: '#b45309' }}>{displaySummary.pendingVerification}</h2>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '50%' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Require scrutiny or re-verification
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Approved Applications</p>
              <h2 style={{ fontSize: '26px', marginTop: '4px', color: '#166534' }}>{displaySummary.approvedCount}</h2>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '50%' }}>
              <CheckCircle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Eligible / Disbursed scholarships
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Rejected Applications</p>
              <h2 style={{ fontSize: '26px', marginTop: '4px', color: '#991b1b' }}>{displaySummary.rejectedCount}</h2>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '50%' }}>
              <XCircle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Ineligible or documentation failed
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Student ID, Name, Email, or App ID..." 
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Scheme Filter */}
          <div style={{ width: '220px' }}>
            <select 
              className="form-control" 
              value={schemeFilter} 
              onChange={(e) => setSchemeFilter(e.target.value)}
            >
              <option value="All">All Scholarship Schemes</option>
              <option value="Post-Matric Scholarship">Post-Matric Scholarship</option>
              <option value="EBC Concession">EBC Concession</option>
              <option value="Dr. Punjabrao Deshmukh Hostel Allowance">Hostel Allowance</option>
            </select>
          </div>

          {/* App Status Filter */}
          <div style={{ width: '180px' }}>
            <select 
              className="form-control" 
              value={appStatusFilter} 
              onChange={(e) => setAppStatusFilter(e.target.value)}
            >
              <option value="All">All App Statuses</option>
              <option value="Created">Created</option>
              <option value="Submitted">Submitted</option>
              <option value="Document Verification">Doc Verification</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Payment Processing">Payment Processing</option>
              <option value="Paid">Paid</option>
              <option value="Not Applied">Not Applied</option>
            </select>
          </div>

          {/* Doc Status Filter */}
          <div style={{ width: '180px' }}>
            <select 
              className="form-control" 
              value={docStatusFilter} 
              onChange={(e) => setDocStatusFilter(e.target.value)}
            >
              <option value="All">All Document States</option>
              <option value="Verified">Fully Verified</option>
              <option value="Pending">Pending / In Progress</option>
              <option value="Correction Required">Correction Required</option>
              <option value="Missing">Has Missing Docs</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ width: '160px' }}>
            <select 
              className="form-control" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="id-asc">Sort: Student ID</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="date-desc">Sort: Recent Update</option>
              <option value="status">Sort: App Status</option>
            </select>
          </div>

          {/* Missing Docs Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', padding: '6px 10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <input 
              type="checkbox" 
              checked={missingDocsOnly} 
              onChange={(e) => setMissingDocsOnly(e.target.checked)} 
            />
            <span>Missing Docs Only</span>
          </label>
        </div>

        {/* Active Filter Info & Reset */}
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <div>
            Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> consolidated student records
          </div>
          {(searchTerm || schemeFilter !== 'All' || appStatusFilter !== 'All' || docStatusFilter !== 'All' || missingDocsOnly) && (
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '12px', padding: '2px 8px' }}
              onClick={() => {
                setSearchTerm('');
                setSchemeFilter('All');
                setAppStatusFilter('All');
                setDocStatusFilter('All');
                setMissingDocsOnly(false);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Consolidated Master Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name & Contact</th>
                <th>Academic Profile</th>
                <th>Application Details</th>
                <th>App Status</th>
                <th>Document Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => {
                const hasMissing = record.missingDocuments && record.missingDocuments.length > 0;
                return (
                  <tr key={record.studentId} style={{ transition: 'background-color 0.15s' }}>
                    
                    {/* Student ID */}
                    <td style={{ fontWeight: '600', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                      {record.studentId}
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Reg: {record.registeredDate ? new Date(record.registeredDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>

                    {/* Full Name & Contact */}
                    <td>
                      <div style={{ fontWeight: '600' }}>{record.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{record.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ph: {record.phone}</div>
                    </td>

                    {/* Academic Profile */}
                    <td>
                      <div>{record.department}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {record.year} • Cat: <strong>{record.category}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Income: ₹{record.income !== 'Not Provided' ? Number(record.income).toLocaleString() : 'N/A'}
                      </div>
                    </td>

                    {/* Application Details */}
                    <td>
                      {record.hasApplication ? (
                        <>
                          <div style={{ fontWeight: '500', color: 'var(--color-primary)' }}>{record.applicationId}</div>
                          <div style={{ fontSize: '12px' }}>{record.scholarshipName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Sub: {record.submittedDate !== 'Not Submitted' ? new Date(record.submittedDate).toLocaleDateString() : 'Draft'}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          No Application Submitted
                        </span>
                      )}
                    </td>

                    {/* App Status */}
                    <td>
                      <StatusBadge status={record.applicationStatus} />
                      {record.paymentStatus && record.paymentStatus !== 'Not Started' && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Payment: </span>
                          <StatusBadge status={record.paymentStatus} />
                        </div>
                      )}
                    </td>

                    {/* Document Verification & Missing Indicator */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StatusBadge status={record.documentStatus} />
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          ({record.docCounts.verified}/{record.docCounts.total})
                        </span>
                      </div>

                      {hasMissing ? (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontSize: '11px' }}>
                          <AlertTriangle size={13} />
                          <span>Missing {record.missingDocuments.length} doc(s)</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '11px' }}>
                          <FileCheck size={13} />
                          <span>All Required Present</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => openInspector(record)}
                      >
                        <Eye size={15} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
                      No student records found matching your filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DETAILED STUDENT INSPECTOR MODAL */}
      {/* ---------------------------------------------------- */}
      {inspectModalOpen && selectedRecord && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedRecord.fullName}</h2>
                  <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: 'bold' }}>
                    {selectedRecord.studentId}
                  </span>
                  <StatusBadge status={selectedRecord.applicationStatus} />
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  {selectedRecord.college} • {selectedRecord.department} ({selectedRecord.year})
                </p>
              </div>

              <button 
                onClick={() => setInspectModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={22} />
              </button>
            </div>

            {actionSuccess && (
              <div style={{ padding: '10px 14px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} /> {actionSuccess}
              </div>
            )}

            {/* Profile Grid */}
            <div className="grid grid-cols-3 gap-4" style={{ backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Email Address:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Mobile Number:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Date of Birth:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.dob}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Gender & Category:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.gender} • {selectedRecord.category}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Annual Family Income:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>₹{selectedRecord.income !== 'Not Provided' ? Number(selectedRecord.income).toLocaleString() : 'Not Provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Academic Marks:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.marks}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Aadhaar Number:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.aadhaar}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Bank Account & IFSC:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedRecord.bankAccount} ({selectedRecord.ifsc})</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Registration Date:</span>
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{new Date(selectedRecord.registeredDate).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Application Information Box */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--color-primary)' }}>Scholarship Application Summary</h3>
                <StatusBadge status={selectedRecord.applicationStatus} />
              </div>

              {selectedRecord.hasApplication ? (
                <div className="grid grid-cols-3 gap-4" style={{ fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Application ID:</span>
                    <div style={{ fontWeight: '600' }}>{selectedRecord.applicationId}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Scheme Applied:</span>
                    <div style={{ fontWeight: '500' }}>{selectedRecord.scholarshipName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Academic Year:</span>
                    <div style={{ fontWeight: '500' }}>{selectedRecord.academicYear}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Submission Date:</span>
                    <div style={{ fontWeight: '500' }}>{selectedRecord.submittedDate !== 'Not Submitted' ? new Date(selectedRecord.submittedDate).toLocaleString() : 'Draft'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Payment Disbursal:</span>
                    <div><StatusBadge status={selectedRecord.paymentStatus} /></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Last Record Update:</span>
                    <div style={{ fontWeight: '500' }}>{new Date(selectedRecord.lastUpdated).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '6px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  Student has registered but has not yet submitted a scholarship application.
                </div>
              )}
            </div>

            {/* Missing Documents Alert */}
            {selectedRecord.missingDocuments && selectedRecord.missingDocuments.length > 0 && (
              <div style={{ padding: '14px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>
                  <AlertTriangle size={18} /> Missing Required Documents
                </div>
                <p style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>
                  The following mandatory documents have not been uploaded by the student:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedRecord.missingDocuments.map(docType => (
                    <span key={docType} style={{ padding: '3px 8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                      ✕ {docType}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Documents Inspection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--color-primary)' }}>
                  Submitted Documents ({selectedRecord.documents.length})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Distinguishes real uploads from pre-seeded sample records
                </span>
              </div>

              {selectedRecord.documents.length === 0 ? (
                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No documents have been submitted yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedRecord.documents.map(doc => (
                    <div 
                      key={doc.id}
                      style={{
                        padding: '12px 16px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--color-surface)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{doc.type}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: 'var(--color-bg)', borderRadius: '4px', color: 'var(--color-text-muted)' }}>
                            {doc.category}
                          </span>
                          {doc.isSample ? (
                            <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '4px', border: '1px dashed #9ca3af' }}>
                              Sample Record
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '4px', fontWeight: 'bold' }}>
                              ✓ Real Uploaded File
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          File: <strong>{doc.originalFilename}</strong> • Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                          {doc.sizeBytes > 0 && ` • ${(doc.sizeBytes / 1024).toFixed(1)} KB`}
                        </div>
                        {doc.remark && (
                          <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '4px' }}>
                            <strong>Remark:</strong> {doc.remark}
                          </div>
                        )}
                      </div>

                      {/* Right Action side */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <StatusBadge status={doc.status} />

                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => downloadDocumentFile(doc.id, doc.originalFilename)}
                          title="Secure view/download"
                        >
                          <Download size={13} /> {doc.isSample ? 'View Preview' : 'Download'}
                        </button>

                        {/* Inline Document Verification buttons */}
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '5px 8px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '12px' }}
                            onClick={() => handleVerifyDoc(doc.id, 'Verified')}
                            title="Verify document"
                          >
                            <CheckCircle size={14} /> Verify
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '5px 8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '12px' }}
                            onClick={() => handleVerifyDoc(doc.id, 'Correction Required')}
                            title="Reject / Request correction"
                          >
                            <AlertCircle size={14} /> Flag
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Application Action & Admin Remarks Section */}
            {selectedRecord.hasApplication && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Application Decision & Admin Remarks</h4>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '13px' }}
                    onClick={() => handleAppStatusChange('Approved')}
                  >
                    <CheckCircle size={15} /> Approve Application
                  </button>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '13px' }}
                    onClick={() => handleAppStatusChange('Under Review')}
                  >
                    Move to Under Review
                  </button>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' }}
                    onClick={() => handleAppStatusChange('Rejected')}
                  >
                    <XCircle size={15} /> Reject Application
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter admin remarks to attach to this decision..." 
                    value={adminRemarkInput}
                    onChange={(e) => setAdminRemarkInput(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary" 
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => handleAppStatusChange(selectedRecord.applicationStatus)}
                  >
                    Save Remark
                  </button>
                </div>

                {/* Past Remarks */}
                {selectedRecord.adminRemarks && selectedRecord.adminRemarks.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Remarks History:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {selectedRecord.adminRemarks.map((rem, idx) => (
                        <div key={idx} style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg)', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--color-primary)' }}>
                          <strong>"{rem.text}"</strong>
                          <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>— {rem.author} on {new Date(rem.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setInspectModalOpen(false)}>
                Close Record
              </button>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
};

export default MasterStudentSheet;
