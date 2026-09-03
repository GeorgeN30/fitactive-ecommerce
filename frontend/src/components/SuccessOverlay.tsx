import { useEffect, useState } from "react";

interface SuccessOverlayProps {
  message: string;
  subtitle?: string;
  onDone: () => void;
  duration?: number;
}

export default function SuccessOverlay({
  message,
  subtitle,
  onDone,
  duration = 1800,
}: SuccessOverlayProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration - 300);
    const doneTimer = setTimeout(onDone, duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-brand-dark-bg/80 backdrop-blur-sm ${
        exiting ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-4 ${
          exiting ? "" : "animate-slide-up-fade"
        }`}
      >
        <div className="relative">
          <svg
            className="w-20 h-20"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#00E676"
              strokeWidth="4"
              className="success-circle"
              strokeDasharray="226"
              strokeDashoffset="226"
              strokeLinecap="round"
            />
            <path
              d="M24 40 L35 51 L56 30"
              stroke="#00E676"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="success-check"
              strokeDasharray="60"
              strokeDashoffset="60"
            />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {message}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
