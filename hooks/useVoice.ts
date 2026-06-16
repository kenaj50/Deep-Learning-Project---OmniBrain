"use client";

import { useState, useCallback, useRef } from "react";

export function useVoice(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    setError(null);

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Przeglądarka nie obsługuje dyktowania. Użyj Chrome lub Safari.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pl-PL";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errCode = (event as any).error as string;
      if (errCode === "not-allowed" || errCode === "permission-denied") {
        setError("Brak uprawnień do mikrofonu. Zezwól w ustawieniach przeglądarki.");
      } else if (errCode === "network") {
        setError("Brak połączenia — dyktowanie wymaga internetu.");
      } else if (errCode === "no-speech") {
        setError(null); // silent, user just didn't speak
      } else {
        setError(`Błąd mikrofonu: ${errCode}`);
      }
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setError("Nie można uruchomić mikrofonu. Strona musi być na HTTPS lub localhost.");
    }
  }, [onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, error, startListening, stopListening };
}
