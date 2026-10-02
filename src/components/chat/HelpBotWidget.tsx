import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Loader2, Sparkles, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { AiCopilotAvatar, CopilotVisualState } from './AiCopilotAvatar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  action?: {
    type: string;
    target?: string;
    params?: Record<string, any>;
  };
  timestamp?: number;
}

export function HelpBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copilotState, setCopilotState] = useState<CopilotVisualState>('ready');
  const [statusTelemetry, setStatusTelemetry] = useState<{
    camerasOnline: number;
    camerasTotal: number;
    latencyMs: number;
    fps: number;
  }>({
    camerasOnline: 9,
    camerasTotal: 9,
    latencyMs: 18,
    fps: 30,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll or fetch live Copilot status telemetry on mount / periodically
  const fetchStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/chat/status');
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          setStatusTelemetry({
            camerasOnline: data.snapshot.camerasOnline,
            camerasTotal: data.snapshot.camerasTotal,
            latencyMs: data.snapshot.aiHealth?.latencyMs || 18,
            fps: data.snapshot.aiHealth?.fps || 30,
          });
          if (data.snapshot.aiHealth?.status === 'DEGRADED') {
            setCopilotState('degraded');
          } else if (data.snapshot.camerasOnline === 0) {
            setCopilotState('limited_data');
          } else if (!isLoading) {
            setCopilotState('ready');
          }
        }
      }
    } catch {
      // Keep optimistic fallback
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const executeAction = (action: { type: string; target?: string; params?: any }) => {
    window.dispatchEvent(
      new CustomEvent('seemadrishti:action', {
        detail: action,
      })
    );
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: queryText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setCopilotState('analyzing');

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, text: m.text }));

      const response = await fetchWithAuth('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: historyPayload,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      const botMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: 'model', text: '', timestamp: Date.now() },
      ]);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.action) {
                  // Attach action to the message and optionally auto-execute non-destructive views
                  setMessages((prev) =>
                    prev.map((m) => (m.id === botMsgId ? { ...m, action: parsed.action } : m))
                  );
                  executeAction(parsed.action);
                }
                if (parsed.text) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, text: m.text + parsed.text } : m
                    )
                  );
                } else if (parsed.error) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, text: m.text + '\n' + parsed.error } : m
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing SSE data', e);
              }
            }
          }
        }
      }
      setCopilotState('ready');
    } catch (error) {
      console.error('Copilot request error:', error);
      setCopilotState('degraded');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "I don't have enough data from the current surveillance feed. Telemetry stream is degraded or reconnecting.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendQuery(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const SUGGESTED_QUERIES = [
    { label: 'What is happening right now?', icon: '⚡' },
    { label: 'Show active alerts', icon: '⚠' },
    { label: 'Which cameras are online?', icon: '📹' },
    { label: 'Show latest plate detections', icon: '🔍' },
    { label: 'Summarize the last 10 minutes', icon: '⏱' },
    { label: 'Check AI inference health', icon: '🧠' },
  ];

  return (
    <div className="fixed bottom-8 right-6 sm:bottom-9 sm:right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-88 sm:w-[420px] h-[550px] bg-[#030712]/95 border border-cyan-500/30 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(0,240,255,0.15)] backdrop-blur-2xl flex flex-col overflow-hidden mb-3 select-none"
          >
            {/* Command-Center Header */}
            <div className="bg-[#02050e] px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AiCopilotAvatar state={copilotState} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white font-mono tracking-wider">
                      SEEMADRISHTI COPILOT
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {copilotState.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-mono tracking-wide">
                    AI Surveillance &amp; Operations Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-all cursor-pointer"
                    title="Clear Conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={fetchStatus}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04] transition-all cursor-pointer"
                  title="Refresh Live Telemetry"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-all cursor-pointer"
                  title="Minimize Copilot"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Sub-Header Live Telemetry Bar */}
            <div className="px-3.5 py-1.5 bg-[#010309] border-b border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-slate-400 select-none">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {statusTelemetry.camerasOnline}/{statusTelemetry.camerasTotal} CAMS ONLINE
                </span>
                <span>•</span>
                <span>LATENCY: {statusTelemetry.latencyMs}ms</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Sparkles size={10} />
                <span>YOLOv8 + BYTETRACK</span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#020612]/75 font-mono text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-2">
                  <div className="mb-3">
                    <AiCopilotAvatar state={copilotState} size="xl" />
                  </div>
                  <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-1">
                    SEEMADRISHTI AI COPILOT
                  </h4>
                  <p className="text-[10px] text-cyan-400 font-mono mb-2 italic">
                    "See more. Understand faster. Act smarter."
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[320px] mb-4 font-sans leading-relaxed">
                    Grounded in real-time CCTV detections, optical tripwires, YOLO tracking, and Section 65B forensic chain of custody.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full">
                    {SUGGESTED_QUERIES.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendQuery(q.label)}
                        className="px-2.5 py-2 text-[10px] rounded-xl bg-white/[0.03] hover:bg-cyan-500/[0.12] text-slate-300 hover:text-cyan-200 border border-white/[0.08] hover:border-cyan-400/50 transition-all text-left font-mono cursor-pointer flex items-center justify-between group shadow-xs active:scale-95"
                      >
                        <span className="truncate pr-1">
                          {q.icon} {q.label}
                        </span>
                        <span className="text-slate-600 group-hover:text-cyan-400 text-[10px]">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[92%] ${
                        msg.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {msg.role === 'user' ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 flex items-center justify-center">
                            <User size={12} />
                          </div>
                        ) : (
                          <AiCopilotAvatar state="ready" size="xs" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-md ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-cyan-950/80 to-teal-950/80 text-cyan-100 border border-cyan-500/40 rounded-tr-xs shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                              : 'bg-[#050b18] text-slate-200 border border-white/[0.10] rounded-tl-xs shadow-md'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Action execution pill if returned by the Copilot */}
                        {msg.action && (
                          <div className="flex items-center gap-1.5 self-start">
                            <button
                              onClick={() => msg.action && executeAction(msg.action)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9.5px] font-mono font-bold tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                            >
                              <ExternalLink size={10} />
                              <span>
                                {msg.action.type === 'open_camera'
                                  ? `SWITCH TO ${msg.action.target?.toUpperCase()}`
                                  : 'EXECUTE ACTION'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="shrink-0 mt-0.5">
                      <AiCopilotAvatar state="analyzing" size="xs" />
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-[#050b18] border border-cyan-400/40 rounded-tl-xs flex items-center gap-2 h-[34px] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span className="text-[10px] text-cyan-300 font-mono tracking-wider">
                        ANALYZING SURVEILLANCE TELEMETRY...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-[#02050e] border-t border-white/[0.08]">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Copilot (e.g. 'What is happening right now?', 'Show CAM-03')..."
                  className="w-full bg-[#050a16] border border-white/[0.12] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 px-2.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-30 text-black font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
                  title="Send Query"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round AI-Bot Floating Launcher - Only Logo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-full p-0.5 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:shadow-[0_0_40px_rgba(0,240,255,0.75)] ${
          isOpen ? 'rotate-90' : ''
        }`}
        title="SEEMADRISHTI AI COPILOT"
      >
        {isOpen ? (
          <div className="w-13 h-13 rounded-full bg-[#030712] border-2 border-rose-500/80 text-rose-400 flex items-center justify-center shadow-lg">
            <X className="w-5 h-5" />
          </div>
        ) : (
          <AiCopilotAvatar state={copilotState} size="lg" />
        )}
      </button>
    </div>
  );
}
