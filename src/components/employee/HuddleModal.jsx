import { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { useCompany } from '../common/CompanyContext';

export default function HuddleModal({ peer, onClose }) {
  const { companyName } = useCompany();
  const [connecting, setConnecting] = useState(true);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // 1. Dynamically load Jitsi Meet iframe API
  useEffect(() => {
    const scriptId = 'jitsi-meet-external-api';
    let script = document.getElementById(scriptId);
    
    const handleScriptLoad = () => {
      setJitsiLoaded(true);
      // Premium connection delay simulation for smooth transition
      const timer = setTimeout(() => setConnecting(false), 1500);
      return () => clearTimeout(timer);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://meet.element.io/external_api.js';
      script.async = true;
      script.onload = handleScriptLoad;
      document.body.appendChild(script);
    } else {
      if (window.JitsiMeetExternalAPI) {
        handleScriptLoad();
      } else {
        script.onload = handleScriptLoad;
      }
    }
  }, []);

  // 2. Initialize Jitsi meeting iframe once loaded and visible
  useEffect(() => {
    if (jitsiLoaded && !connecting && containerRef.current) {
      // Create a unique, highly sanitized room name based on channel ID
      const rawRoomName = peer.channelId ? `NSG-ERP-Room-${peer.channelId}` : `NSG-ERP-Room-${peer.roomName || 'General'}`;
      const sanitizedRoomName = rawRoomName
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .substring(0, 80);

      const domain = 'meet.element.io';
      const options = {
        roomName: sanitizedRoomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: peer.displayName || (
            peer.name === 'HR / Management' || peer.name === 'HR Interview'
              ? 'Sarah Jenkins (HR Manager)'
              : 'Jane Smith (Employee)'
          )
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false, // Skip prejoin configuration screen for speed
          disableDeepLinking: true  // Stop Jitsi from showing native app install popups
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          HIDE_DEEP_LINKING_LOGO: true,
          SHOW_POWERED_BY: false,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'settings', 
            'raisehand', 'tileview', 'videobackgroundblur'
          ]
        }
      };

      try {
        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        // Auto-terminate modal when employee hangs up inside the frame
        api.addEventListener('videoConferenceLeft', () => {
          onClose();
        });
      } catch (err) {
        console.error('Failed to initialize Jitsi Meet iframe API:', err);
      }

      return () => {
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
      };
    }
  }, [jitsiLoaded, connecting, peer, onClose]);

  // Premium loading ring screen during handshake
  if (connecting) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.98)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          gap: '24px'
        }}
      >
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div className="huddle-loading-ring" />
          <div className="huddle-loading-ring-inner" />
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={20} color="white" />
          </div>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            Launching {companyName || 'HMNS'} ERP Huddle...
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Establishing direct client-side video link for {peer.name || 'Workspace'}
          </p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulseRing {
            0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
          }
          .huddle-loading-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            border: 2px solid rgba(16, 185, 129, 0.4);
            border-radius: 50%;
            animation: pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
          .huddle-loading-ring-inner {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            border: 2px solid rgba(16, 185, 129, 0.2);
            border-radius: 50%;
            animation: pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            animation-delay: 0.6s;
          }
        ` }} />
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#070a13',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        color: '#f9fafb',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden'
      }}
    >
      {/* Top Header Bar */}
      <div 
        style={{
          height: '60px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#10b981' }}>
            {companyName || 'HMNS'} ERP Live Meeting
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>|</span>
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
            Room: {peer.roomName || 'Sarah\'s Workspace Huddle'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            height: '34px',
            padding: '0 16px',
            borderRadius: '17px',
            border: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          Leave Meeting
        </button>
      </div>

      {/* Embedded Jitsi Meeting Iframe Container */}
      <div 
        ref={containerRef} 
        id="jitsi-container-root" 
        style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#070a13' }} 
      />
    </div>
  );
}
