import { Component, ReactNode } from "react";

interface Props { children: ReactNode; label?: string; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", this.props.label ?? "unknown", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <div className="text-base font-semibold text-foreground">Something went wrong</div>
          <div className="text-xs text-muted-foreground max-w-md font-mono bg-background/50 rounded p-3 text-left whitespace-pre-wrap">
            {this.state.error.message}
          </div>
          <button
            className="text-xs px-4 py-2 rounded-md bg-primary text-white font-medium"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
