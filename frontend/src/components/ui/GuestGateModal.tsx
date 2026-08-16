/**
 * Guest Gate Modal (Soft Wall)
 *
 * Shown when an anonymous guest taps a premium/protected feature
 * (Save story, AI generation, collaboration, etc.).
 *
 * Philosophy: "Show, don't tell" - guests can SEE and TRY core features,
 * and are only asked to sign in at the moment of value (saving their work).
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface GuestGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string; // emoji shown at the top of the card
  /**
   * Optional "Download as PDF" escape hatch (soft wall: guests keep their work).
   * When provided, an outlined PDF button is shown between Sign In and Maybe Later.
   */
  onDownloadPdf?: () => Promise<void>;
}

const GuestGateModal: React.FC<GuestGateModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon = '✨',
  onDownloadPdf,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    // NOTE: intentionally no `reason: 'auth-required'` here.
    // The guest is allowed on this page, so AuthPage's "Continue without
    // account" button can safely return them here (their work is preserved).
    navigate('/auth', { state: { from: location } });
  };

  const handleDownloadPdf = async () => {
    if (!onDownloadPdf || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await onDownloadPdf();
      onClose();
    } catch (error) {
      console.error('❌ Guest PDF export failed:', error);
      alert('Failed to create the PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #fdfaff 0%, #fff5f8 100%)',
          borderRadius: '20px',
          padding: '32px 28px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.25)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{icon}</div>
        <h2
          style={{
            margin: '0 0 10px 0',
            fontSize: '22px',
            fontWeight: 700,
            color: '#1f2937',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '15px',
            lineHeight: 1.5,
            color: '#4b5563',
          }}
        >
          {message}
        </p>
        <button
          onClick={handleSignIn}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
          }}
        >
          Sign In / Sign Up Free
        </button>
        {onDownloadPdf && (
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            style={{
              width: '100%',
              padding: '13px',
              marginBottom: '10px',
              background: '#ffffff',
              color: '#8b5cf6',
              border: '2px solid #8b5cf6',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isGeneratingPdf ? 'wait' : 'pointer',
              opacity: isGeneratingPdf ? 0.7 : 1,
            }}
          >
            {isGeneratingPdf ? '⏳ Generating PDF...' : '📄 Download as PDF'}
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: '#6b7280',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
        <p
          style={{
            margin: '16px 0 0 0',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          👁️ You're currently browsing as a guest
        </p>
      </div>
    </div>
  );
};

export default GuestGateModal;
