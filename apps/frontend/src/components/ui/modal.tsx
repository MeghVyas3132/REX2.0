'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import './modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeButton?: boolean;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      size = 'medium',
      children,
      footer,
      closeButton = true,
    },
    ref,
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isExiting, setIsExiting] = React.useState(false);

    const handleClose = useCallback(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsExiting(false);
        onClose();
      }, 150);
    }, [onClose]);

    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      const handleClickOutside = (e: MouseEvent) => {
        if (overlayRef.current === e.target) {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      overlayRef.current?.addEventListener('click', handleClickOutside);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        overlayRef.current?.removeEventListener('click', handleClickOutside);
      };
    }, [isOpen, handleClose]);

    if (!isOpen && !isExiting) return null;

    return (
      <div
        ref={overlayRef}
        className={`modal-overlay ${isExiting ? 'modal-overlay--exit' : ''}`.trim()}
      >
        <div
          ref={modalRef || ref}
          className={`modal modal--${size}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {(title || closeButton) && (
            <div className="modal__header">
              {title && (
                <h2 id="modal-title" className="modal__title">
                  {title}
                </h2>
              )}
              {closeButton && (
                <button
                  className="modal__close"
                  onClick={handleClose}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <div className="modal__body">{children}</div>
          {footer && <div className="modal__footer">{footer}</div>}
        </div>
      </div>
    );
  },
);

Modal.displayName = 'Modal';
