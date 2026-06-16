"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? "Nieznany błąd" };
  }

  componentDidCatch(error: Error) {
    console.error(`[OmniBrain] ${this.props.label ?? "Panel"} crash:`, error);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-2xl">⚠️</span>
        <p className="text-xs text-zinc-500">
          {this.props.label ? `${this.props.label}: ` : ""}błąd renderowania
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }
}
