"use client";

import React, { ReactNode } from "react";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 40,
          }}
          onClick={onClose}
        />
      )}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "400px",
          backgroundColor: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s",
          zIndex: 50,
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "1.5rem" }}>
          {title && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0 }}>{title}</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}>
                ✕
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
