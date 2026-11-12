import type { ReactNode } from "react";

interface AuthFieldFeedbackProps {
  id: string;
  tone: "error" | "success" | "hint";
  children: ReactNode;
}

export default function AuthFieldFeedback({ id, tone, children }: AuthFieldFeedbackProps) {
  return (
    <p
      id={id}
      aria-live="polite"
      aria-atomic="true"
      className={`mt-2 flex items-start gap-2 text-sm leading-5 ${
        tone === "error"
          ? "text-red-700 dark:text-red-300"
          : tone === "success"
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-slate-600 dark:text-slate-300"
      }`}
    >
      <i
        aria-hidden="true"
        className={`fa-solid mt-0.5 shrink-0 ${
          tone === "error" ? "fa-circle-exclamation" : tone === "success" ? "fa-circle-check" : "fa-circle-info"
        }`}
      />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
