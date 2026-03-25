import Link from "next/link";

interface ActionTileProps {
  href: string;
  label: string;
}

export function ActionTile({ href, label }: ActionTileProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        borderRadius: "8px",
        border: "1px solid rgba(59, 130, 246, 0.5)",
        background: "rgba(59, 130, 246, 0.1)",
        padding: "12px 16px",
        textAlign: "center",
        fontSize: "14px",
        fontWeight: 600,
        color: "#93c5fd",
      }}
    >
      {label}
    </Link>
  );
}
