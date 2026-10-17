import React, { useContext, useState, useRef } from 'react';
import { Layout } from '../../components/common/Layout';
import { AppDataContext } from '../../context/AppDataContext';
import { AuthContext } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CloudRain, CheckCircle, AlertCircle, FileText, DownloadCloud, Upload, Download } from 'lucide-react';

const STANDARD_DOC_TYPES = [
  { type: 'Aadhaar Card', category: 'Permanent' },
  { type: 'Income Certificate', category: 'Permanent' },
  { type: 'Caste Certificate', category: 'Permanent' },
  { type: 'Domicile Certificate', category: 'Permanent' },
  { type: 'Previous Year Marksheet', category: 'Yearly' },
  { type: 'Fee Receipt', category: 'Yearly' },
  { type: 'Bonafide Certificate', category: 'Yearly' },
  { type: 'Bank Passbook', category: 'Permanent' }
];

const Documents = () => {
  const { documents, updateDocumentStatus, uploadRealDocument, downloadDocumentFile, applications } = useContext(AppDataContext);
  const { user } = useContext(AuthContext);
  
  const myApp = applications.find(a => a.studentId === user.id);
  const myDocs = documents.filter(d => d.applicationId === myApp?.id || d.studentId === user.id);

  const [digiModal, setDigiModal] = useState(false);
  const [digiState, setDigiState] = useState('idle');

  // Genuine upload state
  const [selectedType, setSelectedType] = useState('Aadhaar Card');
  const [selectedCategory, setSelectedCategory] = useState('Permanent');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  if (!myApp) {
    return (
      <Layout>
        <div className="card">
          <h2>Documents</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Please submit your scholarship application first before uploading supporting documents.
          </p>
        </div>
      </Layout>
    );
  }

  const handleSimulateUpload = (docId) => {
    updateDocumentStatus(docId, "Pending", "");
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setSelectedType(val);
    const found = STANDARD_DOC_TYPES.find(d => d.type === val);
    if (found) setSelectedCategory(found.category);
  };

  const handleRealUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) {
      setUploadMessage({ text: 'Please select a file to upload.', type: 'error' });
      return;
    }

    setUploadLoading(true);
    setUploadMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('type', selectedType);
    formData.append('category', selectedCategory);
    formData.append('applicationId', myApp.id);

    try {
      await uploadRealDocument(formData);
      setUploadMessage({
        text: `Successfully uploaded ${fileToUpload.name} as ${selectedType}. Status: Pending Verification.`,
        type: 'success'
      });
      setFileToUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadMessage({ text: err.message || 'File upload failed.', type: 'error' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDigiLocker = () => {
    setDigiState('loading');
    setTimeout(() => {
      setDigiState('success');
    }, 1500);
  };

  const renderDocRow = (doc) => (
    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FileText size={24} color="var(--color-primary)" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '500' }}>{doc.type}</span>
            {doc.isSample ? (
              <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#f3f4f6', color: '#6b7280', borderRadius: '4px' }}>
                Sample Record
              </span>
            ) : (
              <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '4px', fontWeight: 'bold' }}>
                ✓ Uploaded File
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {doc.originalFilename || doc.name} • {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Recent'}
            {doc.sizeBytes > 0 && ` • ${(doc.sizeBytes / 1024).toFixed(1)} KB`}
          </div>
          {doc.remark && doc.status === 'Correction Required' && (
            <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>
              <strong>Admin Remark:</strong> {doc.remark}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StatusBadge status={doc.status} />

        {/* View / Download Button */}
        <button 
          className="btn btn-secondary" 
          style={{ fontSize: '12px', padding: '5px 10px' }}
          onClick={() => downloadDocumentFile(doc.id, doc.originalFilename || doc.name)}
          title="Download or preview document"
        >
          <Download size={13} /> {doc.isSample ? 'Preview' : 'Download'}
        </button>

        {/* Retain simulate upload button */}
        {doc.status !== 'Verified' && (
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '5px 10px' }} 
            onClick={() => handleSimulateUpload(doc.id)}
            title="Simulate re-upload"
          >
            <CloudRain size={13} /> Simulate
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Document Upload & Verification</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Upload genuine documents (PDF, JPG, PNG) or view existing submission records.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setDigiModal(true)}>
          <DownloadCloud size={16} /> Fetch from DigiLocker
        </button>
      </div>

      {/* Real File Upload Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} /> Upload Supporting Document (Genuine File Upload)
        </h3>

        {uploadMessage.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            backgroundColor: uploadMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: uploadMessage.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {uploadMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {uploadMessage.text}
          </div>
        )}

        <form onSubmit={handleRealUpload}>
          <div className="grid grid-cols-3 gap-4" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Document Type *</label>
              <select className="form-control" value={selectedType} onChange={handleTypeChange}>
                {STANDARD_DOC_TYPES.map(d => (
                  <option key={d.type} value={d.type}>{d.type} ({d.category})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Choose File (PDF, JPG, PNG) *</label>
              <input 
                type="file" 
                ref={fileInputRef}
                className="form-control" 
                accept=".pdf,.png,.jpg,.jpeg" 
                onChange={(e) => setFileToUpload(e.target.files[0])}
                required 
              />
            </div>

            <div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '38px' }}
                disabled={uploadLoading}
              >
                <Upload size={16} /> {uploadLoading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', marginBottom: 0 }}>
            Files are saved to the server backend and become immediately available for administrator verification.
          </p>
        </form>
      </div>

      {/* Permanent Documents List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Permanent Documents</h3>
        </div>
        {myDocs.filter(d => d.category === 'Permanent').map(renderDocRow)}
        {myDocs.filter(d => d.category === 'Permanent').length === 0 && <div style={{padding:'16px', color:'var(--color-text-muted)'}}>No permanent documents uploaded yet.</div>}
      </div>

      {/* Yearly/Academic Documents List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Yearly / Academic Documents</h3>
        </div>
        {myDocs.filter(d => d.category === 'Yearly').map(renderDocRow)}
        {myDocs.filter(d => d.category === 'Yearly').length === 0 && <div style={{padding:'16px', color:'var(--color-text-muted)'}}>No academic documents uploaded yet.</div>}
      </div>

      {/* DigiLocker Simulation Modal */}
      {digiModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '16px' }}>DigiLocker Integration (Simulated)</h3>
            
            {digiState === 'idle' && (
              <>
                <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  Connect to DigiLocker to securely fetch your permanent documents like Aadhaar, Domicile, and Income Certificates.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setDigiModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleDigiLocker}>Connect DigiLocker</button>
                </div>
              </>
            )}

            {digiState === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
                <div style={{ border: '4px solid var(--color-bg)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <p>Authenticating with DigiLocker...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {digiState === 'success' && (
              <>
                <div style={{ padding: '16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle size={20} />
                  Demo DigiLocker connection successful!
                </div>
                <p style={{ fontSize: '14px', marginBottom: '12px' }}>The following documents could be fetched:</p>
                <ul style={{ fontSize: '14px', marginBottom: '24px', paddingLeft: '20px', color: 'var(--color-text-muted)' }}>
                  <li>Aadhaar Card (UIDAI)</li>
                  <li>Income Certificate (Revenue Dept)</li>
                  <li>HSC Marksheet (State Board)</li>
                </ul>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => {setDigiModal(false); setDigiState('idle');}}>Close</button>
                  <button className="btn btn-primary" disabled>Import Documents (Demo)</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Documents;
