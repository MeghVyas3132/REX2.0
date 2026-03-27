"use client";

type NodeDeletionWarningProps = {
  nodeName: string;
  deleteScheduledFor: Date;
  affectedWorkflows: number;
  onMigrate?: () => void;
  onCancel?: () => void;
};

export function NodeDeletionWarning({
  nodeName,
  deleteScheduledFor,
  affectedWorkflows,
  onMigrate,
  onCancel,
}: NodeDeletionWarningProps) {
  const daysRemaining = Math.ceil((deleteScheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      style={{
        padding: "16px",
        background: "#fff3cd",
        border: "2px solid #ffc107",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
        <div style={{ fontSize: "24px" }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, marginBottom: "8px", color: "#856404" }}>
            Node Scheduled for Deletion
          </h4>
          <p style={{ margin: 0, marginBottom: "8px", color: "#856404" }}>
            <strong>{nodeName}</strong> will be deleted in <strong>{daysRemaining} days</strong> on{" "}
            {deleteScheduledFor.toLocaleDateString()}.
          </p>
          <p style={{ margin: 0, marginBottom: "12px", color: "#856404" }}>
            This affects <strong>{affectedWorkflows} workflow{affectedWorkflows !== 1 ? "s" : ""}</strong>.
            Please migrate to an alternative node before deletion.
          </p>
          {(onMigrate || onCancel) && (
            <div style={{ display: "flex", gap: "8px" }}>
              {onMigrate && (
                <button
                  onClick={onMigrate}
                  style={{
                    padding: "6px 12px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  View Migration Guide
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  style={{
                    padding: "6px 12px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Request Extension
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
