import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  User,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Video,
  Zap,
  Activity,
  Clock,
  Cpu,
  ChevronRight,
  Terminal,
} from 'lucide-react';
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

interface QuickCommand {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  query: string;
  badgeColor: string;
  glowColor: string;
}

const QUICK_COMMANDS: QuickCommand[] = [
  {
    id: 'sitrep',
    icon: Zap,
    tag: 'SITREP',
    title: 'Current situation overview',
    query: 'What is happening right now? Give me a full tactical sitrep.',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    glowColor: 'group-hover:border-amber-400/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  },
  {
    id: 'alerts',
    icon: ShieldAlert,
    tag: 'ALERTS',
    title: 'Active threats & breaches',
    query: 'Show active security alerts and breaches.',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    glowColor: 'group-hover:border-rose-400/50 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  },
  {
    id: 'cameras',
    icon: Video,
    tag: 'MATRIX',
    title: 'Camera status & feeds',
    query: 'Which cameras are currently online and streaming?',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    glowColor: 'group-hover:border-cyan-400/50 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]',
  },
  {
    id: 'anpr',
    icon: Cpu,
    tag: 'ANPR',
    title: 'Vehicle license plate log',
    query: 'Show latest plate detections and unauthorized vehicles.',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    glowColor: 'group-hover:border-emerald-400/50 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  },
  {
    id: 'summary',
    icon: Clock,
    tag: 'BRIEF',
    title: 'Summarize last 10 minutes',
    query: 'Summarize the last 10 minutes of surveillance activity.',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    glowColor: 'group-hover:border-indigo-400/50 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]',
  },
  {
    id: 'health',
    icon: Activity,
    tag: 'SYSTEM',
    title: 'Inference latency & FPS',
    query: 'Check AI inference health, pipeline FPS and latency.',
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    glowColor: 'group-hover:border-teal-400/50 group-hover:shadow-[0_0_15px_rgba(20,184,166,0.2)]',
  },
];

function formatMessageContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const cleanLine = isBullet ? trimmed.replace(/^([•\-\*]\s*)/, '') : line;

    // Detect keywords to highlight
    const parts = cleanLine.split(/(\bCAM-\d+\b|\bALERT\b|\bCRITICAL\b|\bNORMAL\b|\bVERIFIED\b|\bBREACH\b|\b\d{1,3}ms\b|\b\d+\s?FPS\b)/gi);

    const formattedContent = parts.map((part, pIdx) => {
      const upper = part.toUpperCase();
      if (/^CAM-\d+$/i.test(part)) {
        return (
          <span
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30 shadow-xs"
          >
            {part}
          </span>
        );
      }
      if (upper === 'ALERT' || upper === 'CRITICAL' || upper === 'BREACH') {
        return (
          <span
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono font-bold text-[10px] border border-rose-500/30 shadow-xs"
          >
            {part}
          </span>
        );
      }
      if (upper === 'NORMAL' || upper === 'VERIFIED') {
        return (
          <span
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30 shadow-xs"
          >
            {part}
          </span>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lIdx} className="flex items-start gap-1.5 my-1 pl-1">
          <span className="text-cyan-400 text-[10px] mt-0.5 select-none">▸</span>
          <span className="flex-1 text-slate-200">{formattedContent}</span>
        </div>
      );
    }

    return (
      <div key={lIdx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
        {formattedContent}
      </div>
    );
  });
}

export function HelpBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copilotState, setCopilotState] = useState<CopilotVisualState>('ready');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll or fetch live Copilot status telemetry on mount / periodically
  const fetchStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/chat/status');
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <div className="fixed bottom-8 right-6 sm:bottom-9 sm:right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] bg-[#020612]/98 border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(0,240,255,0.18)] backdrop-blur-2xl flex flex-col overflow-hidden mb-3 select-none"
          >
            {/* Top Cyan Cyber Accent Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Command-Center Header */}
            <div className="bg-[#030816]/90 px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AiCopilotAvatar state={copilotState} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white font-mono tracking-wider">
                      SEEMADRISHTI COPILOT
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-mono tracking-wide mt-0.5">
                    AI Surveillance &amp; Operations Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Clear Conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={fetchStatus}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
                  title="Sync Live Telemetry"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-all cursor-pointer ml-1"
                  title="Close Copilot"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#02050f]/80 font-mono text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-between text-center px-1 py-1">
                  {/* Hero Hologram Section */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3 flex items-center justify-center">
                      <div className="absolute -inset-2.5 rounded-full border border-cyan-500/25 border-t-cyan-400/80 animate-spin [animation-duration:8s] pointer-events-none" />
                      <div className="absolute -inset-1 rounded-full border border-dashed border-cyan-400/30 animate-spin [animation-duration:12s] [animation-direction:reverse] pointer-events-none" />
                      <AiCopilotAvatar state={copilotState} size="lg" />
                    </div>

                    <h4 className="text-white font-mono font-black text-xs tracking-widest uppercase mb-1 flex items-center gap-1.5">
                      <span>SEEMADRISHTI AI COPILOT</span>
                    </h4>
                    <p className="text-[10px] text-cyan-400 font-mono mb-3 italic">
                      "See more. Understand faster. Act smarter."
                    </p>
                  </div>

                  {/* Tactical Quick Actions Grid - Clean, No Truncation */}
                  <div className="w-full">
                    <div className="w-full flex items-center justify-between mb-2 px-1">
                      <span className="text-[9.5px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        Tactical Actions
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-500">
                        Click to dispatch
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full">
                      {QUICK_COMMANDS.map((cmd) => (
                        <button
                          key={cmd.id}
                          onClick={() => sendQuery(cmd.query)}
                          className={`group relative p-2 rounded-xl bg-[#050c1b]/80 hover:bg-[#071329] border border-white/[0.08] transition-all duration-200 text-left cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs active:scale-[0.98] ${cmd.glowColor}`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className={`p-1 rounded-md border ${cmd.badgeColor}`}>
                                <cmd.icon className="w-3 h-3" />
                              </div>
                              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-200 group-hover:text-cyan-300 transition-colors">
                                {cmd.tag}
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-[10px] font-sans text-slate-400 group-hover:text-slate-300 leading-tight">
                            {cmd.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[94%] ${
                        msg.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {msg.role === 'user' ? (
                          <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                            <User size={13} />
                          </div>
                        ) : (
                          <AiCopilotAvatar state="ready" size="xs" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 max-w-full">
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-xs shadow-md transition-all ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-cyan-950/90 to-teal-950/90 text-cyan-100 border border-cyan-500/40 rounded-tr-xs shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                              : 'bg-[#060e1d]/95 text-slate-200 border border-white/[0.12] rounded-tl-xs shadow-lg'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          ) : (
                            <div>{formatMessageContent(msg.text)}</div>
                          )}
                        </div>

                        {/* Interactive message bar: Action dispatch & copy */}
                        <div className="flex items-center gap-2 px-1">
                          {msg.action && (
                            <button
                              onClick={() => msg.action && executeAction(msg.action)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 text-cyan-300 border border-cyan-400/50 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                            >
                              <ExternalLink size={11} className="text-cyan-400" />
                              <span>
                                {msg.action.type === 'open_camera'
                                  ? `SWITCH TO ${msg.action.target?.toUpperCase() || 'TARGET'}`
                                  : 'EXECUTE TACTICAL ACTION'}
                              </span>
                              <ChevronRight size={11} className="text-cyan-400 ml-0.5" />
                            </button>
                          )}

                          {msg.role === 'model' && msg.text && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="text-[9.5px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer py-0.5"
                              title="Copy Intel Report"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400">COPIED</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>COPY</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="shrink-0 mt-0.5">
                      <AiCopilotAvatar state="analyzing" size="xs" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#060e1d] border border-cyan-400/40 rounded-tl-xs flex items-center gap-2.5 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
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

            {/* Futuristic Input Bar */}
            <div className="p-3 bg-[#02050e]/95 border-t border-white/[0.08] flex flex-col gap-1.5">
              <form onSubmit={handleSubmit} className="relative flex items-center group">
                <div className="absolute left-3 flex items-center pointer-events-none text-cyan-400/80 group-focus-within:text-cyan-300 transition-colors">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Copilot or query CCTV telemetry..."
                  className="w-full bg-[#050b18] border border-white/[0.12] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 rounded-xl pl-9 pr-18 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-all duration-200 shadow-inner"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  {input.trim() && (
                    <span className="hidden sm:inline-block text-[9px] font-mono text-slate-500 px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                      ↵
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-25 text-black font-bold rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:shadow-none"
                    title="Send Query"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round AI-Bot Floating Launcher - Only Logo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-full p-0.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:shadow-[0_0_40px_rgba(0,240,255,0.75)] ${
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
