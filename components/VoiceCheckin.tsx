"use client";
import { useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Loader2, Mic, Square } from "lucide-react";

type Line = { role: "user" | "agent"; text: string };
type Props = { dynamicVariables: Record<string, string>; onDone: (transcript: string) => Promise<void> };

export default function VoiceCheckin(props: Props) {
  return (
    <ConversationProvider>
      <Voice {...props} />
    </ConversationProvider>
  );
}

function Voice({ dynamicVariables, onDone }: Props) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const [lines, setLines] = useState<Line[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linesRef = useRef<Line[]>([]);

  const conversation = useConversation({
    onMessage: (m) => {
      linesRef.current = [...linesRef.current, { role: m.role, text: m.message }];
      setLines(linesRef.current);
    },
    onDisconnect: async () => {
      const transcript = linesRef.current.map((l) => `${l.role === "user" ? "Patient" : "Companion"}: ${l.text}`).join("\n");
      if (!linesRef.current.some((l) => l.role === "user")) return;
      setProcessing(true);
      await onDone(transcript);
      setProcessing(false);
      linesRef.current = [];
      setLines([]);
    },
    onError: (e) => setError(String(e)),
  });

  if (!agentId) {
    return <p className="rounded-2xl bg-accent-soft p-3 text-sm">Set <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> in <code>.env.local</code> to enable voice check-ins. Writing and quick tap still work.</p>;
  }

  const connected = conversation.status === "connected";
  const start = async () => {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      linesRef.current = [];
      setLines([]);
      conversation.startSession({ agentId, connectionType: "webrtc", dynamicVariables });
    } catch (e) {
      setError(`Microphone access is needed for voice: ${e}`);
    }
  };

  const status = processing
    ? "Writing up your check-in…"
    : conversation.status === "connecting"
      ? "Saying hello…"
      : connected
        ? conversation.isSpeaking ? "Your companion is talking" : "I'm listening. Take your time."
        : "Tap to start talking";

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-5">
        <div className="relative">
          {connected && <span className="absolute inset-0 animate-breathe rounded-full bg-accent" aria-hidden />}
          <button onClick={connected ? () => conversation.endSession() : start} disabled={processing || conversation.status === "connecting"}
            aria-label={connected ? "Finish check-in" : "Start voice check-in"}
            className={`relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 disabled:opacity-60 ${connected ? "bg-accent-strong" : "bg-gradient-to-br from-[#d9774f] to-accent-strong"}`}>
            {processing || conversation.status === "connecting" ? <Loader2 size={36} className="animate-spin" /> : connected ? <Square size={30} fill="currentColor" /> : <Mic size={40} strokeWidth={1.8} />}
          </button>
        </div>
        <p className="text-sm text-muted">{status}</p>
        {connected && <p className="text-xs text-muted">Tap the button when you&apos;re done</p>}
      </div>
      {error && <p className="rounded-xl bg-rose-soft p-3 text-sm text-rose">{error}</p>}
      {lines.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-background p-3 text-sm">
          {lines.map((l, i) => (
            <p key={i} className={l.role === "user" ? "text-right" : ""}>
              <span className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-left ${l.role === "user" ? "rounded-br-md bg-accent-soft" : "rounded-bl-md bg-card shadow-soft"}`}>{l.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
