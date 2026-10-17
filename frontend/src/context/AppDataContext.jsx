import React, { createContext, useState, useEffect, useContext } from 'react';
import { mockApplications } from '../data/mockApplications';
import { mockDocuments } from '../data/mockDocuments';
import { mockNotifications } from '../data/mockNotifications';
import { api } from '../utils/api';
import { AuthContext } from './AuthContext';

export const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState(mockApplications);
  const [documents, setDocuments] = useState(mockDocuments);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch data whenever user logs in or changes
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [appsData, docsData, notifsData] = await Promise.all([
        api.get('/applications').catch(() => null),
        api.get('/documents').catch(() => null),
        api.get('/notifications').catch(() => null)
      ]);

      if (appsData && Array.isArray(appsData)) {
        setApplications(appsData);
      }
      if (docsData && Array.isArray(docsData)) {
        setDocuments(docsData);
      }
      if (notifsData && Array.isArray(notifsData)) {
        setNotifications(notifsData);
      }
    } catch (err) {
      console.warn('Using local state fallback:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, user?.role]);

  const addNotification = async (notif) => {
    setNotifications(prev => [{ ...notif, id: `NOTIF${Date.now()}` }, ...prev]);
  };

  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch (e) {
      // ignore
    }
  };

  const submitApplication = async (appData) => {
    try {
      const res = await api.post('/applications', {
        scholarshipName: appData.scholarshipName,
        category: appData.category,
        income: appData.income,
        aadhaar: appData.aadhaar,
        bankAccount: appData.bankAccount,
        ifsc: appData.ifsc
      });
      await fetchData();
      return res.id;
    } catch (err) {
      console.warn('API submission failed, using local fallback:', err.message);
      const newApp = {
        ...appData,
        id: `MH-SCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "Submitted",
        documentStatus: "Pending",
        paymentStatus: "Not Started",
        submittedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        adminRemarks: [],
        documents: []
      };
      setApplications(prev => [newApp, ...prev]);
      addNotification({
        userId: appData.studentId,
        message: `Your application ${newApp.id} has been submitted successfully.`,
        date: new Date().toISOString(),
        read: false,
        type: "success"
      });
      return newApp.id;
    }
  };

  const updateDocumentStatus = async (docId, status, remark) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, status, remark: remark || doc.remark };
      }
      return doc;
    }));

    try {
      await api.patch(`/documents/${docId}/status`, { status, remark });
      await fetchData();
    } catch (err) {
      console.warn('API update doc status failed, using local update:', err.message);
    }
  };

  const updateApplicationStatus = async (appId, status, remarkObj) => {
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        const updatedApp = { 
          ...app, 
          status, 
          lastUpdated: new Date().toISOString() 
        };
        if (remarkObj) {
          updatedApp.adminRemarks = [...app.adminRemarks, remarkObj];
        }
        if (status === "Approved") {
          updatedApp.paymentStatus = "Pending";
        }
        return updatedApp;
      }
      return app;
    }));

    try {
      const remarkText = remarkObj ? (typeof remarkObj === 'string' ? remarkObj : remarkObj.text) : '';
      await api.patch(`/applications/${appId}/status`, { status, remark: remarkText });
      await fetchData();
    } catch (err) {
      console.warn('API update app status failed, using local update:', err.message);
    }
  };

  const uploadRealDocument = async (formData) => {
    try {
      const res = await api.uploadFile('/documents/upload', formData);
      await fetchData();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const downloadDocumentFile = async (docId, filename) => {
    try {
      await api.downloadFile(`/documents/${docId}/file`, filename);
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  return (
    <AppDataContext.Provider value={{
      applications, setApplications,
      documents, setDocuments,
      notifications, setNotifications,
      loadingData,
      fetchData,
      addNotification,
      markNotificationRead,
      submitApplication,
      updateDocumentStatus,
      updateApplicationStatus,
      uploadRealDocument,
      downloadDocumentFile
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
