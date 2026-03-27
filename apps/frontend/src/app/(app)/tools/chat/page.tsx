"use client";

import { Card } from "@/components/ui/Card";
import { ChatAssistantConsole } from "@/components/tools/ChatAssistantConsole";

export default function ToolsChatPage() {
  return (
    <section>
      <h1>Chat Assistant</h1>
      <p>Run guided assistant workflows for operational support.</p>

      <Card title="Assistant Console">
        <ChatAssistantConsole />
      </Card>
    </section>
  );
}
