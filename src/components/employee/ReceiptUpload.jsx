import React, { useState, useRef, useEffect } from 'react';
import { Upload, Check, AlertCircle, X } from 'lucide-react';
import AvatarFallback from '../common/AvatarFallback';

export default function ReceiptUpload({ onFile, accept = 'image/*,application/pdf' }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const processFile = (selectedFile) => {
    setError(null);

    // Validate type (must be image or pdf)
    const isImage = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
    if (!isImage && !isPdf) {
      setError('Only PDF or Image files are allowed.');
      return;
    }



    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);
    setPreview(null);

    // Create local object URL for preview immediately (Build note requirement)
    if (isImage) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    } else {
      setPreview('pdf-placeholder');
    }

    // Simulate upload progress
    const duration = 1000; // 1s total
    const intervalTime = 40;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          onFile(selectedFile);
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFile(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashMove {
          to {
            background-position: 40px 0;
          }
        }
        .drag-zone-active {
          border-color: var(--accent-green) !important;
          background-color: rgba(16, 185, 129, 0.08) !important;
          background-image: linear-gradient(90deg, var(--accent-green) 50%, transparent 50%), linear-gradient(90deg, var(--accent-green) 50%, transparent 50%), linear-gradient(0deg, var(--accent-green) 50%, transparent 50%), linear-gradient(0deg, var(--accent-green) 50%, transparent 50%) !important;
          background-repeat: repeat-x, repeat-x, repeat-y, repeat-y !important;
          background-size: 15px 2px, 15px 2px, 2px 15px, 2px 15px !important;
          background-position: 0 0, 0 100%, 0 0, 100% 0 !important;
          animation: dashMove 0.8s linear infinite !important;
        }
      ` }} />

      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
        Receipt Document <span style={{ color: '#ef4444' }}>*</span>
      </label>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />

      {!file && !isUploading && (
        <div 
          onClick={triggerFileInput}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={isDragging ? 'drag-zone-active' : ''}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '10px',
            padding: '24px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-primary)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            if (!isDragging) e.currentTarget.style.borderColor = 'var(--accent-green)';
          }}
          onMouseOut={(e) => {
            if (!isDragging) e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <Upload size={24} style={{ color: isDragging ? 'var(--accent-green)' : 'var(--text-muted)', transition: 'color 0.2s' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {isDragging ? 'Drop receipt here!' : 'Click or drag receipt here'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Images or PDF (Required)
          </span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {isUploading && (
        <div 
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
              Scanning: {file?.name}
            </span>
            <span style={{ fontWeight: '600', color: 'var(--accent-green)' }}>
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div 
            style={{
              height: '6px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                height: '100%',
                backgroundColor: 'var(--accent-green)',
                width: `${uploadProgress}%`,
                transition: 'width 0.05s linear'
              }}
            />
          </div>
        </div>
      )}

      {file && !isUploading && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          {/* Thumbnail preview - size exactly 120px x 80px */}
          <div 
            style={{
              width: '120px',
              height: '80px',
              borderRadius: '6px',
              backgroundColor: 'hsl(240, 20%, 12%)', // --receipt-preview-bg
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}
          >
            {preview === 'pdf-placeholder' ? (
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff4d4f', textTransform: 'uppercase' }}>
                PDF File
              </span>
            ) : preview ? (
              <AvatarFallback
                src={preview} 
                alt="Receipt Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
               />
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No preview</span>
            )}

            {/* Checkmark Badge */}
            <div 
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Check size={10} strokeWidth={3} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
            <span 
              style={{ 
                fontSize: '12px', 
                fontWeight: '500', 
                color: 'var(--text-primary)',
                textOverflow: 'ellipsis', 
                overflow: 'hidden', 
                whiteSpace: 'nowrap'
              }}
              title={file.name}
            >
              {file.name}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <button 
              type="button"
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-green)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                marginTop: '4px',
                width: 'fit-content'
              }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              Change receipt
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              marginLeft: 'auto',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
