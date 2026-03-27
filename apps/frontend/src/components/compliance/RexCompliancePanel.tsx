"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type RexCompliancePanelProps = {
  workflowId: string;
  scores?: {
    rScore: number;
    eScore: number;
    xScore: number;
    totalScore: number;
    isRexEnabled: boolean;
    gaps: string[];
  };
  onEnableRex?: () => void;
};

export function RexCompliancePanel({ scores, onEnableRex }: Omit<RexCompliancePanelProps, "workflowId">) {
  const defaultScores = scores || {
    rScore: 0,
    eScore: 0,
    xScore: 0,
    totalScore: 0,
    isRexEnabled: false,
    gaps: ["No REX analysis performed yet"],
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#28a745";
    if (score >= 60) return "#ffc107";
    return "#dc3545";
  };

  return (
    <Card title="REX Compliance Dashboard">
      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: "4px" }}>REX Status</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
              {defaultScores.isRexEnabled ? "✅ REX Enabled" : "⚠️ REX Not Enabled"}
            </p>
          </div>
          {!defaultScores.isRexEnabled && onEnableRex && (
            <Button onClick={onEnableRex}>
              Enable REX
            </Button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: getScoreColor(defaultScores.rScore) }}>
              {defaultScores.rScore}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Responsible</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: getScoreColor(defaultScores.eScore) }}>
              {defaultScores.eScore}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Ethical</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: getScoreColor(defaultScores.xScore) }}>
              {defaultScores.xScore}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Explainable</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#e3f2fd", borderRadius: "8px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: getScoreColor(defaultScores.totalScore) }}>
              {defaultScores.totalScore}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Total Score</div>
          </div>
        </div>

        {defaultScores.gaps.length > 0 && (
          <div>
            <h4 style={{ marginTop: 0, marginBottom: "12px" }}>Compliance Gaps</h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {defaultScores.gaps.map((gap, idx) => (
                <li key={idx} style={{ marginBottom: "8px", color: "#666" }}>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
          <strong>What is REX?</strong> Responsible, Ethical, and Explainable AI - ensuring GDPR and DPDP Act compliance.
        </div>
      </div>
    </Card>
  );
}
