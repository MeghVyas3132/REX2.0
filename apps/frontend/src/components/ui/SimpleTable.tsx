import React from "react";

type TableProps = {
  columns: string[];
  rows: string[][];
};

export function Table({ columns, rows }: TableProps) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.875rem",
      }}
    >
      <thead>
        <tr style={{ borderBottom: "2px solid var(--border)" }}>
          {columns.map((col) => (
            <th
              key={col}
              style={{
                padding: "0.75rem",
                textAlign: "left",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
            {row.map((cell, cellIdx) => (
              <td key={cellIdx} style={{ padding: "0.75rem" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
