"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Mic, MicOff, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/useVoice";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setValue((prev) => (prev ? `${prev} ${text}` : text));
    textareaRef.current?.focus();
  }, []);

  const { isListening, error: voiceError, startListening, stopListening } =
    useVoice(handleVoiceResult);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-zinc-800/80 p-3">
      <div className="flex items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 focus-within:border-zinc-600 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Wklej notatkę lub dyktuj…"
          rows={2}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />
        <div className="flex shrink-0 items-center gap-1 pb-0.5">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`rounded-lg p-1.5 transition ${
              isListening
                ? "animate-pulse bg-red-500/20 text-red-400"
                : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            title="Dyktuj (PL)"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <Button
            type="button"
            size="icon"
            className="h-8 w-8"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
          >
            {disabled ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
          </Button>
        </div>
      </div>

      {voiceError ? (
        <p className="mt-1.5 text-center text-[10px] text-red-400">{voiceError}</p>
      ) : (
        <p className="mt-1.5 text-center text-[10px] text-zinc-600">
          Enter = wyślij · Shift+Enter = nowa linia · 🎤 polski
        </p>
      )}
    </div>
  );
}
