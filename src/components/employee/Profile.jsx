import { useState, useEffect } from 'react';
import BankSection from './BankSection';
import DocCard from './DocCard';
import { User, Mail, Home, Camera, Check, ChevronDown } from 'lucide-react';

const defaultDetails = {
  dob: '1994-08-16',
  gender: 'Female',
  address: '121 Bakers Street, Tech City, BLR',
  emergencyContactName: 'Robert Jenkins',
  emergencyContactPhone: '+91 98765 43210'
};

const defaultBank = {
  bankName: 'HDFC Bank Ltd',
  holderName: 'Sarah Jenkins',
  accountNumber: '50100482938128',
  ifscCode: 'HDFC0000104',
  status: 'verified'
};

const defaultDocs = [
  { id: 'pan', docType: 'PAN Card', status: 'verified', uploadedAt: '2026-04-12' },
  { id: 'aadhaar', docType: 'Aadhaar Card', status: 'verified', uploadedAt: '2026-04-12' },
  { id: 'degree', docType: 'Degree Certificate', status: 'missing', uploadedAt: null }
];

export default function Profile({ db, onUpdateDb, currentUser }) {
  // The logged-in employee ID is derived dynamically
  const EMPLOYEE_ID = currentUser?.id || 102;
  const empRecord = db?.employees?.find(e => e.id === EMPLOYEE_ID) || null;

  // --- Derive initial states from db.employees if available, else localStorage/defaults ---
  const getInitialPersonal = () => {
    if (empRecord) {
      return {
        dob: empRecord.dob || defaultDetails.dob,
        gender: empRecord.gender || defaultDetails.gender,
        address: empRecord.address || defaultDetails.address,
        emergencyContactName: empRecord.emergencyContactName || defaultDetails.emergencyContactName,
        emergencyContactPhone: empRecord.emergencyContactPhone || defaultDetails.emergencyContactPhone
      };
    }
    const saved = localStorage.getItem('nsg_employee_profile_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          dob: parsed.dob || defaultDetails.dob,
          gender: parsed.gender || defaultDetails.gender,
          address: parsed.address || defaultDetails.address,
          emergencyContactName: parsed.emergencyContactName || parsed.emergencyContact_name || 'Robert Jenkins',
          emergencyContactPhone: parsed.emergencyContactPhone || parsed.emergencyContact || '+91 98765 43210'
        };
      } catch { return defaultDetails; }
    }
    return defaultDetails;
  };

  const [personalDetails, setPersonalDetails] = useState(getInitialPersonal);

  // Bank data: from db.employees bank fields
  const getInitialBank = () => {
    if (empRecord && empRecord.bank_name) {
      return {
        bankName: empRecord.bank_name,
        holderName: empRecord.name || defaultBank.holderName,
        accountNumber: empRecord.account_number || defaultBank.accountNumber,
        ifscCode: empRecord.ifsc_code || defaultBank.ifscCode,
        status: empRecord.bank_status || 'verified'
      };
    }
    const saved = localStorage.getItem('nsg_employee_profile_bank');
    return saved ? JSON.parse(saved) : defaultBank;
  };

  const [bankData, setBankData] = useState(getInitialBank);

  // Docs: from db.documents if available, else localStorage/defaults
  const getInitialDocs = () => {
    if (db?.documents) {
      const empDocs = db.documents.filter(d => d.employee_id === EMPLOYEE_ID);
      if (empDocs.length > 0) return empDocs;
    }
    const saved = localStorage.getItem('nsg_employee_profile_docs');
    return saved ? JSON.parse(saved) : defaultDocs;
  };

  const [docs, setDocs] = useState(getInitialDocs);

  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('nsg_employee_profile_avatar') || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  // Details form fields
  const [dob, setDob] = useState(personalDetails.dob);
  const [gender, setGender] = useState(personalDetails.gender);
  const [address, setAddress] = useState(personalDetails.address);
  const [emergencyContactName, setEmergencyContactName] = useState(personalDetails.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(personalDetails.emergencyContactPhone);

  const [toast, setToast] = useState(null);
  const [detailsErrors, setDetailsErrors] = useState({});

  // Image Cropping Dialog states
  const [croppedImageSrc, setCroppedImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Responsive / Viewport states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedSection, setExpandedSection] = useState('photo'); // 'photo', 'details', 'bank', 'docs'

  // --- Resize Listener ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Sync to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('nsg_employee_profile_details', JSON.stringify(personalDetails));
  }, [personalDetails]);

  useEffect(() => {
    localStorage.setItem('nsg_employee_profile_bank', JSON.stringify(bankData));
  }, [bankData]);

  useEffect(() => {
    localStorage.setItem('nsg_employee_profile_docs', JSON.stringify(docs));
  }, [docs]);

  // --- DOB Age Validator ---
  const checkAge = (dobString) => {
    if (!dobString) return { valid: false, message: 'Date of Birth is required.' };
    const birthDate = new Date(dobString);
    const today = new Date();
    
    if (birthDate > today) {
      return { valid: false, message: 'Date of birth cannot be in the future.' };
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      return { valid: false, message: 'Employee must be at least 18 years old.' };
    }
    return { valid: true };
  };

  // --- Handlers ---
  const handleSaveDetails = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate DOB
    const ageCheck = checkAge(dob);
    if (!ageCheck.valid) {
      newErrors.dob = ageCheck.message;
    }

    // Validate Emergency Contact Name
    if (!emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required.';
    }

    // Validate Emergency Phone (Indian Mobile standard: ^(\+91[-\s]?)?[0]?[6-9]\d{9}$)
    const cleanPhone = emergencyContactPhone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^(\+91)?[0]?[6-9]\d{9}$/;
    if (!emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required.';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.emergencyContactPhone = 'Invalid format (e.g. +91 98765 43210 or 9876543210).';
    }

    // Validate Address
    if (!address.trim()) {
      newErrors.address = 'Address is required.';
    } else if (address.length > 500) {
      newErrors.address = 'Address cannot exceed 500 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setDetailsErrors(newErrors);
      return;
    }

    setDetailsErrors({});
    const updatedPersonal = {
      dob,
      gender,
      address,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim()
    };
    setPersonalDetails(updatedPersonal);

    // Write back to shared db.employees so HR portal sees the update
    if (db && onUpdateDb) {
      const updatedEmployees = (db.employees || []).map(e =>
        e.id === EMPLOYEE_ID ? { ...e, ...updatedPersonal } : e
      );
      onUpdateDb({ ...db, employees: updatedEmployees });
    } else {
      // Fallback to localStorage if db not available
      localStorage.setItem('nsg_employee_profile_details', JSON.stringify(updatedPersonal));
    }

    setIsEditingDetails(false);
    showToast('Personal details updated successfully');
  };

  const handleUpdateBank = async (updatedBank) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('http://localhost:8000/employee-portal/profile/update-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          bank_name: updatedBank.bankName,
          account_number: updatedBank.accountNumber,
          ifsc_code: updatedBank.ifscCode
        })
      });
      if (res.ok) {
        setBankData(updatedBank);
        showToast('Bank details submitted for verification');
      }
    } catch (e) { console.error(e); }
  };

  const handleSimulateBankVerify = (status) => {
    const updated = { ...bankData, status };
    setBankData(updated);
    if (db && onUpdateDb) {
      const updatedEmployees = (db.employees || []).map(e =>
        e.id === EMPLOYEE_ID ? { ...e, bank_status: status } : e
      );
      onUpdateDb({ ...db, employees: updatedEmployees });
    }
    showToast(`Bank account status: ${status}`);
  };

  const handleUploadDoc = (id, fileName) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedDocs = docs.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: fileName ? 'pending' : 'missing',
          uploadedAt: fileName ? today : null
        };
      }
      return d;
    });
    setDocs(updatedDocs);
    showToast(fileName ? 'Document uploaded for verification' : 'Document removed');
  };

  const handleSimulateVerifyDoc = (id, status) => {
    const updatedDocs = docs.map(d => {
      if (d.id === id) {
        return { ...d, status };
      }
      return d;
    });
    setDocs(updatedDocs);
    showToast(`Document status updated to ${status}`);
  };

  // Canvas-based 1:1 Avatar center cropping
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 300; // Output square dimensions
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          // Draw center cropped square to canvas
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          const croppedDataUrl = canvas.toDataURL('image/jpeg');
          setCroppedImageSrc(croppedDataUrl);
          setShowCropModal(true);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // clear input
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSection = (sectionName) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName);
  };

  // --- Sub-renderers to keep code clean and modular ---

  const renderPhotoSection = () => {
    // Live data from db.employees — falls back to hardcoded if db not available
    const liveName = empRecord?.name || 'Jane Smith';
    const liveEmpId = empRecord?.emp_id || 'NSG-0102';
    const liveEmail = empRecord?.email || 'jane.smith@hnms.com';
    const liveDept = empRecord?.department || 'IT';
    const liveDesignation = empRecord?.designation || 'Systems Executive';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', position: 'relative' }}>
        <span className="badge-pill" style={{ position: 'absolute', top: '0', right: '0', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '11px' }}>
          {liveDept}
        </span>

        <label className="avatar-uploader-wrapper">
          <input 
            type="file" 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          <img src={avatar} alt="Avatar" className="avatar-img" />
          <div className="avatar-overlay">
            <Camera size={20} />
          </div>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 className="emp-name-text">{liveName}</h2>
          <span className="emp-id-text">{liveEmpId}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{liveDesignation}</span>
        </div>

        <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{liveEmail}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{liveDept} — {empRecord?.status === 'active' ? 'Active Employee' : empRecord?.status || 'Active Employee'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsSection = () => {
    return (
      <>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Personal Details Form</h3>
          <button
            type="button"
            className="card-action-btn"
            onClick={() => {
              if (isEditingDetails) {
                // Cancel edits
                setDob(personalDetails.dob);
                setGender(personalDetails.gender);
                setAddress(personalDetails.address);
                setEmergencyContactName(personalDetails.emergencyContactName);
                setEmergencyContactPhone(personalDetails.emergencyContactPhone);
                setDetailsErrors({});
              }
              setIsEditingDetails(!isEditingDetails);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-green)',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {isEditingDetails ? 'Cancel' : 'Edit Details'}
          </button>
        </div>

        <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="details-form-row">
            {/* DOB */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Date of Birth</label>
              <input 
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={!isEditingDetails}
                required
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: detailsErrors.dob ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  backgroundColor: isEditingDetails ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              {detailsErrors.dob && (
                <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{detailsErrors.dob}</span>
              )}
            </div>

            {/* Gender radio group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Gender</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                  <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-primary)', cursor: isEditingDetails ? 'pointer' : 'default' }}>
                    <input 
                      type="radio" 
                      name="gender" 
                      value={option} 
                      checked={gender === option} 
                      onChange={(e) => setGender(e.target.value)} 
                      disabled={!isEditingDetails}
                      style={{ accentColor: 'var(--accent-green)' }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="details-form-row">
            {/* Emergency Contact Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Emergency Contact Name</label>
              <input 
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                disabled={!isEditingDetails}
                required
                placeholder="Robert Jenkins"
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: detailsErrors.emergencyContactName ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  backgroundColor: isEditingDetails ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              {detailsErrors.emergencyContactName && (
                <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{detailsErrors.emergencyContactName}</span>
              )}
            </div>

            {/* Emergency Contact Phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Emergency Contact Phone</label>
              <input 
                type="text"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                disabled={!isEditingDetails}
                required
                placeholder="+91 98765 43210"
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: detailsErrors.emergencyContactPhone ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  backgroundColor: isEditingDetails ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              {detailsErrors.emergencyContactPhone && (
                <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{detailsErrors.emergencyContactPhone}</span>
              )}
            </div>
          </div>

          {/* Home Address (max 500 chars) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Home Address</label>
              {isEditingDetails && (
                <span style={{ fontSize: '10px', color: address.length > 500 ? '#ef4444' : 'var(--text-muted)' }}>
                  {address.length}/500
                </span>
              )}
            </div>
            <textarea 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditingDetails}
              required
              rows="2"
              maxLength={500}
              placeholder="Enter your home address (max 500 characters)"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: detailsErrors.address ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: isEditingDetails ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            />
            {detailsErrors.address && (
              <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{detailsErrors.address}</span>
            )}
          </div>

          {isEditingDetails && (
            <button 
              type="submit"
              style={{
                backgroundColor: 'var(--accent-green)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                width: 'fit-content',
                alignSelf: 'flex-end',
                paddingLeft: '24px',
                paddingRight: '24px'
              }}
            >
              Save Details
            </button>
          )}
        </form>
      </>
    );
  };

  const renderBankSection = () => {
    return (
      <BankSection 
        bankData={bankData} 
        onUpdateBank={handleUpdateBank} 
        onSimulateVerify={handleSimulateBankVerify}
      />
    );
  };

  const renderDocsSection = () => {
    return (
      <>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Document Upload Section</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            PAN, Aadhaar, and Degree certificates. Click on missing cards to simulate uploads.
          </p>
        </div>

        <div className="doc-cards-grid">
          {docs.map((doc) => (
            <DocCard 
              key={doc.id}
              docType={doc.docType}
              status={doc.status}
              uploadedAt={doc.uploadedAt}
              onUpload={(fileName) => handleUploadDoc(doc.id, fileName)}
              onSimulateVerify={(status) => handleSimulateVerifyDoc(doc.id, status)}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="component-container">
      {/* Local Styles for Profile Layout Grid & Design Tokens */}
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .profile-layout-grid {
            grid-template-columns: 1.2fr 2fr;
            grid-template-areas: 
              "photo details"
              "bank docs";
          }
          .area-photo { grid-area: photo; }
          .area-details { grid-area: details; }
          .area-bank { grid-area: bank; }
          .area-docs { grid-area: docs; }
        }

        .avatar-uploader-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          cursor: pointer;
        }

        .avatar-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid hsl(265, 70%, 60%); /* --profile-avatar-ring token HSL */
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .avatar-uploader-wrapper:hover .avatar-overlay {
          opacity: 1;
        }

        .emp-name-text {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .emp-id-text {
          font-size: 12px;
          font-weight: 600;
          font-family: monospace;
          color: var(--text-muted);
          margin: 0;
        }

        .doc-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }

        .details-form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 600px) {
          .details-form-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Slide-up animations */
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-up-modal {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      ` }} />

      {/* Success Toast */}
      {toast && (
        <div className="toast-notify">
          <Check size={16} style={{ color: 'var(--accent-green)' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Profile Photo Confirmation Modal */}
      {showCropModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div className="slide-up-modal" style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Confirm Profile Photo
            </h3>
            
            {/* Renders cropped image inside clean circular display without crossing lines */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid hsl(265, 70%, 60%)', // --profile-avatar-ring HSL
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img 
                src={croppedImageSrc} 
                alt="Cropped Preview" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowCropModal(false);
                  setCroppedImageSrc(null);
                }}
                style={{
                  flex: 1,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setAvatar(croppedImageSrc);
                  localStorage.setItem('nsg_employee_profile_avatar', croppedImageSrc);
                  setShowCropModal(false);
                  setCroppedImageSrc(null);
                  showToast('Avatar photo updated successfully');
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'var(--accent-green)',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="component-header">
        <div>
          <h1>Employee Profile</h1>
          <p>Review personal details, manage banking payroll setup, and upload verification credentials.</p>
        </div>
      </div>

      {/* Responsive layout viewport switch */}
      {isMobile ? (
        /* Accordion Stack under 768px - Only one open at a time with smooth max-height transitions */
        <div className="profile-accordion-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* FOLD 1: Profile Photo */}
          <div className="accordion-item" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => toggleSection('photo')}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} style={{ color: 'hsl(265, 70%, 60%)' }} />
                <span>Profile Photo & Card</span>
              </div>
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: expandedSection === 'photo' ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  color: 'var(--text-muted)'
                }} 
              />
            </button>
            <div style={{
              maxHeight: expandedSection === 'photo' ? '800px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              borderTop: expandedSection === 'photo' ? '1px solid var(--border-color)' : 'none'
            }}>
              <div style={{ padding: '20px' }}>
                {renderPhotoSection()}
              </div>
            </div>
          </div>

          {/* FOLD 2: Personal Details */}
          <div className="accordion-item" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => toggleSection('details')}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--accent-blue)' }} />
                <span>Personal Details Form</span>
              </div>
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: expandedSection === 'details' ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  color: 'var(--text-muted)'
                }} 
              />
            </button>
            <div style={{
              maxHeight: expandedSection === 'details' ? '800px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              borderTop: expandedSection === 'details' ? '1px solid var(--border-color)' : 'none'
            }}>
              <div style={{ padding: '20px' }}>
                {renderDetailsSection()}
              </div>
            </div>
          </div>

          {/* FOLD 3: Bank Account */}
          <div className="accordion-item" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => toggleSection('bank')}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Bank Account Section</span>
              </div>
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: expandedSection === 'bank' ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  color: 'var(--text-muted)'
                }} 
              />
            </button>
            <div style={{
              maxHeight: expandedSection === 'bank' ? '800px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              borderTop: expandedSection === 'bank' ? '1px solid var(--border-color)' : 'none'
            }}>
              <div style={{ padding: '20px' }}>
                {renderBankSection()}
              </div>
            </div>
          </div>

          {/* FOLD 4: Document Uploads */}
          <div className="accordion-item" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => toggleSection('docs')}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--accent-pink)' }} />
                <span>Document Upload Section</span>
              </div>
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: expandedSection === 'docs' ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  color: 'var(--text-muted)'
                }} 
              />
            </button>
            <div style={{
              maxHeight: expandedSection === 'docs' ? '800px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              borderTop: expandedSection === 'docs' ? '1px solid var(--border-color)' : 'none'
            }}>
              <div style={{ padding: '20px' }}>
                {renderDocsSection()}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Standard View (768px-1279px) and 2x2 Grid View (>= 1280px) */
        <div className="profile-layout-grid">
          <div className="content-card area-photo">
            {renderPhotoSection()}
          </div>
          
          <div className="content-card area-details">
            {renderDetailsSection()}
          </div>
          
          <div className="area-bank">
            {renderBankSection()}
          </div>
          
          <div className="content-card area-docs">
            {renderDocsSection()}
          </div>
        </div>
      )}
    </div>
  );
}
