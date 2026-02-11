// ──────────────────────────────────────────────
// REX - Workflow Chat Assistant Panel
// Collapsible AI chatbot that reasons about the workflow
// ──────────────────────────────────────────────

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface ChatWorkflowContext {
  name: string;
  description: string;
  nodes: Array<{ id: string; type: string; label: string; config: Record<string, unknown> }>;
  edges: Array<{ id: string; source: string; target: string }>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  token: string;
  workflow: ChatWorkflowContext;
  executionStatus?: string | null;
  nodeStatuses?: Record<string, { status: string; error: string | null }>;
}

export function ChatPanel({
  token,
  workflow,
  executionStatus,
  nodeStatuses,
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Build history for context (exclude current message)
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await api.chat.send(
        token,
        trimmed,
        workflow,
        executionStatus,
        nodeStatuses,
        history
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to get response";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, token, workflow, executionStatus, nodeStatuses]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Render markdown-lite (bold, code, lists)
  function renderContent(content: string) {
    return content.split("\n").map((line, i) => {
      // Code blocks
      if (line.startsWith("```")) return null;

      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Inline code
      processed = processed.replace(/`([^`]+)`/g, '<code class="rex-chat-inline-code">$1</code>');
      // List items
      if (processed.match(/^[-*]\s/)) {
        processed = "• " + processed.slice(2);
      }
      if (processed.match(/^\d+\.\s/)) {
        // Numbered list — keep as is
      }

      return (
        <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  }

  // SVG Icons
  const BotIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );

  const ChatIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );

  return (
    <>
      {/* Toggle button */}
      <button
        className={`rex-chat-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        {isOpen ? <CloseIcon /> : (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ChatIcon />
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px" }}>REX-Bot</span>
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="rex-chat-panel">
          {/* Header */}
          <div className="rex-chat-header">
            <div className="rex-chat-header-left">
              <span className="rex-chat-header-icon"><BotIcon /></span>
              <span className="rex-chat-header-title">REX Assistant</span>
            </div>
            <div className="rex-chat-header-right">
              {messages.length > 0 && (
                <button className="rex-chat-clear" onClick={clearChat} title="Clear chat">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="rex-chat-messages">
            {messages.length === 0 && (
              <div className="rex-chat-welcome">
                <div className="rex-chat-welcome-icon"><BotIcon /></div>
                <div className="rex-chat-welcome-title">Hi! I&apos;m REX Assistant</div>
                <div className="rex-chat-welcome-desc">
                  I can see your workflow and help you debug issues, understand node behavior, or suggest improvements.
                </div>
                <div className="rex-chat-suggestions">
                  {[
                    "Why is my workflow failing?",
                    "Explain the data flow",
                    "How can I improve this workflow?",
                    "What does each node do?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      className="rex-chat-suggestion"
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`rex-chat-msg ${msg.role}`}>
                <div className="rex-chat-msg-bubble">
                  {msg.role === "assistant" ? (
                    <div className="rex-chat-msg-content">
                      {renderContent(msg.content)}
                    </div>
                  ) : (
                    <div className="rex-chat-msg-content">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="rex-chat-msg assistant">
                <div className="rex-chat-msg-bubble">
                  <div className="rex-chat-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rex-chat-error">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="rex-chat-input-area">
            <textarea
              ref={inputRef}
              className="rex-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your workflow..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="rex-chat-send"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              title="Send"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
