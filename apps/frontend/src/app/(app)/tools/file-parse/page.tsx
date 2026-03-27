"use client";

import { Card } from "@/components/ui/Card";
import { FileParseUploader } from "@/components/tools/FileParseUploader";
import { ParsedFilePreview } from "@/components/tools/ParsedFilePreview";

export default function ToolsFileParsePage() {
  return (
    <section>
      <h1>File Parser</h1>
      <p>Upload and inspect parsed output for supported files.</p>

      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Upload">
          <FileParseUploader />
        </Card>
        <Card title="Parsed Preview">
          <ParsedFilePreview />
        </Card>
      </div>
    </section>
  );
}
