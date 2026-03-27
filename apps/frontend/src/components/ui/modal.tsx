"use client";

import React, { ReactNode } from "react";
import { Button } from "./Button";

// Modal Component
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: { label: string; onClick: () => void; variant?: "primary" | "secondary" | "danger" }[];
};

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={onClose}
        >
          <div
            className="card"
            style={{
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0 }}>{title}</h2>
                <button 
                  onClick={onClose} 
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
                >
                  ✕
                </button>
              </div>
            )}
            <div style={{ marginBottom: "1.5rem" }}>{children}</div>
            {actions && (
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                {actions.map((action) => (
                  <Button key={action.label} variant={action.variant || "primary"} onClick={action.onClick}>
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Confirm Dialog Component
type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={onCancel}
        >
          <div
            className="card"
            style={{
              width: "90%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 1rem 0" }}>{title}</h2>
            <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-secondary)" }}>{message}</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant={confirmVariant} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
