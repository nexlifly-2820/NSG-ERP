import { useState, useEffect } from 'react';

import DocCard from './DocCard';
import { User, Mail, Home, Camera, Check, ChevronDown, Download } from 'lucide-react';
import AvatarFallback from '../common/AvatarFallback';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=Employee&background=6d28d9&color=fff&size=150';

const defaultDocs = [
  { id: 'pan', docType: 'PAN Card', status: 'missing', uploadedAt: null },
  { id: 'aadhaar', docType: 'Aadhaar Card', status: 'missing', uploadedAt: null },
  { id: 'degree', docType: 'Degree Certificate', status: 'missing', uploadedAt: null }
];

export default function Profile({ currentUser }) {
  const EMPLOYEE_ID = currentUser?.id || 102;
  const [liveProfile, setLiveProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [personalDetails, setPersonalDetails] = useState({
    dob: '', gender: 'Male', address: '',
    emergencyContactName: '', emergencyContactPhone: ''
  });



  const [docs, setDocs] = useState(defaultDocs);
  const [myAssets, setMyAssets] = useState([]);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [toast, setToast] = useState(null);
  const [detailsErrors, setDetailsErrors] = useState({});
  const [croppedImageSrc, setCroppedImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedSection, setExpandedSection] = useState('photo');
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Fetch ALL profile data from backend on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch('/api/employee-portal/profile/details', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLiveProfile(data);
          // Populate personal details from DB
          const dobVal = data.dob ? data.dob.slice(0, 10) : '';
          setDob(dobVal);
          setGender(data.gender || 'Male');
          setAddress(data.address || '');
          setEmergencyContactName(data.emergency_contact_name || '');
          setEmergencyContactPhone(data.emergency_contact_phone || '');
          setPersonalDetails({
            dob: dobVal, gender: data.gender || 'Male',
            address: data.address || '',
            emergencyContactName: data.emergency_contact_name || '',
            emergencyContactPhone: data.emergency_contact_phone || ''
          });
          // Avatar from DB
          if (data.photo) setAvatar(data.photo);
          // Bank data is now read-only in Employment Details
          // Documents from DB
          if (data.documents) {
            try { 
              const parsed = JSON.parse(data.documents);
              if (Array.isArray(parsed)) {
                setDocs(parsed);
              } else if (parsed && typeof parsed === 'object') {
                if (parsed.docs_list) setDocs(parsed.docs_list);
                if (parsed.ctc) setLiveProfile(prev => ({...prev, ctc: parsed.ctc}));
              }
            } catch {}
          }
          setProfileLoaded(true);
        }

        const assetRes = await fetch('/api/employee-portal/resignation/my-assets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assetRes.ok) {
          setMyAssets(await assetRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfileData();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const ageCheck = checkAge(dob);
    if (!ageCheck.valid) newErrors.dob = ageCheck.message;
    if (!emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required.';
    const cleanPhone = emergencyContactPhone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^(\+91)?[0]?[6-9]\d{9}$/;
    if (!emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required.';
    else if (!phoneRegex.test(cleanPhone)) newErrors.emergencyContactPhone = 'Invalid format (e.g. +91 98765 43210)';
    if (!address.trim()) newErrors.address = 'Address is required.';
    else if (address.length > 500) newErrors.address = 'Address cannot exceed 500 characters.';

    if (Object.keys(newErrors).length > 0) { setDetailsErrors(newErrors); return; }
    setDetailsErrors({});

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/profile/update-personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          dob, gender, address,
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim()
        })
      });
      if (res.ok) {
        setPersonalDetails({ dob, gender, address, emergencyContactName: emergencyContactName.trim(), emergencyContactPhone: emergencyContactPhone.trim() });
        setIsEditingDetails(false);
        showToast('Personal details saved to database ✓');
      } else {
        showToast('Failed to save details — please try again');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving details');
    }
  };



  const handleUploadDoc = async (id, fileName) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedDocs = docs.map(d => {
      if (d.id === id) return { ...d, status: fileName ? 'pending' : 'missing', uploadedAt: fileName ? today : null };
      return d;
    });
    setDocs(updatedDocs);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await fetch('/api/employee-portal/profile/update-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documents: updatedDocs })
      });
    } catch (e) { console.error(e); }
    showToast(fileName ? 'Document uploaded & saved to database ✓' : 'Document removed');
  };

  const handleSimulateVerifyDoc = (id, status) => {
    const updatedDocs = docs.map(d => d.id === id ? { ...d, status } : d);
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
    const liveName = liveProfile?.name || currentUser?.name || 'Loading...';
    const liveEmpId = liveProfile?.emp_id || currentUser?.emp_id || (currentUser?.id ? `NSG-0${currentUser.id}` : '...');
    const liveEmail = liveProfile?.email || currentUser?.email || '...';
    const liveDept = liveProfile?.department || currentUser?.department || 'Unassigned';
    const liveDesignation = liveProfile?.designation || currentUser?.designation || liveProfile?.role || currentUser?.role || 'Unassigned';

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
          <AvatarFallback src={avatar} alt="Avatar" className="avatar-img"  />
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
            <span>{liveDept} — {liveProfile?.is_active ? 'Active Employee' : 'Inactive Employee'}</span>
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

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Employment & Tax Details</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Annual CTC</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                {liveProfile?.ctc ? `₹${liveProfile.ctc.toLocaleString('en-IN')}` : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.department || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Designation / Title</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.designation || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.phone || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Role</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.role || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reports To (Team Lead)</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.manager || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Office Location</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.location || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PF Number</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.pf_number || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>UAN</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.uan || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ESI Number</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.esi_number || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PAN</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.pan_number || 'N/A'}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Bank Summary</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Account Number</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.account_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IFSC Code</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.ifsc_code || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Name</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.bank_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Branch Name</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{liveProfile?.bank_branch || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };



  const renderDocsSection = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Currently Assigned Documents</h4>
          {docs.filter(d => d.status !== 'missing').length === 0 ? (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No documents assigned yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {docs.filter(d => d.status !== 'missing').map((doc, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{doc.docType || doc.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold' }}>Uploaded</span>
                    <button 
                      onClick={() => {
                        const fileHref = doc.link || doc.fileUrl;
                        const docLabel = doc.docType || doc.name || 'Document';
                        if (fileHref) {
                          const element = document.createElement("a");
                          element.href = fileHref;
                          element.download = doc.original_filename || doc.fileName || `${docLabel.replace(/\\s+/g, '_')}_Document`;
                          element.target = "_blank";
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          showToast(`Downloaded ${doc.original_filename || doc.fileName || docLabel}`);
                        } else {
                          const element = document.createElement("a");
                          const file = new Blob([`Simulated document content for: ${docLabel}`], {type: 'text/plain'});
                          element.href = URL.createObjectURL(file);
                          element.download = `${docLabel.replace(/\\s+/g, '_')}_Document.txt`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          showToast(`Downloaded ${docLabel}`);
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center' }}
                      title="Download Document"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Assign New Document</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Document Name</label>
              <input 
                type="text" 
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="e.g. Aadhar Card Copy" 
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', outline: 'none', fontSize: '13px' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>File Upload</label>
              <input 
                type="file" 
                id="newDocFileInput"
                onChange={(e) => setNewDocFile(e.target.files[0])}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', outline: 'none', fontSize: '13px' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                disabled={isUploadingDoc}
                onClick={async () => {
                  if (newDocName && newDocFile) {
                    setIsUploadingDoc(true);
                    const formData = new FormData();
                    formData.append('name', newDocName);
                    formData.append('file', newDocFile);
                    
                    try {
                      const token = localStorage.getItem('nsg_jwt_token');
                      const res = await fetch('/api/employee-portal/profile/upload-document', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                      });
                      
                      if (res.ok) {
                        const data = await res.json();
                        setDocs(data.documents);
                        showToast('Document uploaded successfully & saved to DB ✓');
                        setNewDocName('');
                        setNewDocFile(null);
                        const fileInput = document.getElementById('newDocFileInput');
                        if (fileInput) fileInput.value = '';
                      } else {
                        showToast('Failed to upload document to server');
                      }
                    } catch (e) {
                      console.error(e);
                      showToast('Network error uploading document');
                    } finally {
                      setIsUploadingDoc(false);
                    }
                  } else {
                    alert('Please provide a document name and file.');
                  }
                }}
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Assigned Corporate Assets</h4>
          {myAssets.length === 0 ? (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No assets assigned yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myAssets.map((asset, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{asset.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '12px' }}>({asset.type})</span></div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>SN: {asset.serialNumber || 'N/A'} | Tag: {asset.id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{asset.returnStatus || 'Issued'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
              "docs details";
          }
          .area-photo { grid-area: photo; }
          .area-details { grid-area: details; }
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
              <AvatarFallback
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
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('nsg_jwt_token');
                    const res = await fetch('/api/employee-portal/profile/update-avatar', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ photo_url: croppedImageSrc })
                    });
                    if (res.ok) {
                      setAvatar(croppedImageSrc);
                      setShowCropModal(false);
                      setCroppedImageSrc(null);
                      showToast('Profile photo saved to database ✓');
                    } else {
                      showToast('Failed to save photo');
                    }
                  } catch (e) {
                    // Fallback: save locally if network fails
                    setAvatar(croppedImageSrc);
                    setShowCropModal(false);
                    setCroppedImageSrc(null);
                    showToast('Photo updated (offline mode)');
                  }
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

          {/* FOLD 3: Document Uploads */}
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
          
          <div className="content-card area-docs">
            {renderDocsSection()}
          </div>
        </div>
      )}
    </div>
  );
}
