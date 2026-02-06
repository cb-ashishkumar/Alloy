"use client";

import { motion } from "framer-motion";

export function JiraLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Jira"
      className={className}
      role="img"
    >
      <path
        fill="currentColor"
        d="M23.2 11.5 12.5.8a1.2 1.2 0 0 0-1.7 0l-3 3 3.7 3.7a2.6 2.6 0 0 1 3.7 0l3.7 3.7 3-3a1.2 1.2 0 0 0 0-1.7Z"
      />
      <path
        fill="currentColor"
        opacity=".85"
        d="M12 6.3 5.9.8a1.2 1.2 0 0 0-1.7 0L.8 4.2a1.2 1.2 0 0 0 0 1.7L12 17.1l3.7-3.7L12 9.6a2.6 2.6 0 0 0 0-3.3Z"
      />
      <path
        fill="currentColor"
        opacity=".7"
        d="M12 17.1 8.3 20.8l3 3a1.2 1.2 0 0 0 1.7 0l3-3Z"
      />
    </svg>
  );
}

export function ConfluenceLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Confluence"
      className={className}
      role="img"
    >
      <path
        fill="currentColor"
        d="M18.8 4.1c-1.7-1.5-4.3-1.4-5.9.2l-8 8.4c-.8.8-.8 2.1 0 2.9l4.4 4.6c.8.8 2.1.8 2.9 0l8-8.4c1.6-1.6 1.7-4.2.2-5.9l-1.6-1.8Z"
      />
      <path
        fill="currentColor"
        opacity=".75"
        d="M5.2 19.9c1.7 1.5 4.3 1.4 5.9-.2l8-8.4c.8-.8.8-2.1 0-2.9L14.7 3.8c-.8-.8-2.1-.8-2.9 0l-8 8.4c-1.6 1.6-1.7 4.2-.2 5.9l1.6 1.8Z"
      />
    </svg>
  );
}

export function LoomLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Loom"
      className={className}
      role="img"
    >
      <path
        fill="currentColor"
        d="M12 3.5c1.6 0 3.1.5 4.4 1.4-.8.2-1.5.6-2.1 1.2A6.1 6.1 0 0 0 12 5.7c-1.8 0-3.4.8-4.6 2-.2-.9-.6-1.6-1.2-2.2A8.4 8.4 0 0 1 12 3.5Z"
      />
      <path
        fill="currentColor"
        opacity=".85"
        d="M20.5 12c0 1.6-.5 3.1-1.4 4.4-.2-.8-.6-1.5-1.2-2.1.3-.7.5-1.5.5-2.3 0-1.8-.8-3.4-2-4.6.9-.2 1.6-.6 2.2-1.2 1.2 1.4 1.9 3.1 1.9 5.8Z"
      />
      <path
        fill="currentColor"
        opacity=".7"
        d="M12 20.5c-1.6 0-3.1-.5-4.4-1.4.8-.2 1.5-.6 2.1-1.2.7.3 1.5.5 2.3.5 1.8 0 3.4-.8 4.6-2 .2.9.6 1.6 1.2 2.2A8.4 8.4 0 0 1 12 20.5Z"
      />
      <path
        fill="currentColor"
        opacity=".55"
        d="M3.5 12c0-1.6.5-3.1 1.4-4.4.2.8.6 1.5 1.2 2.1-.3.7-.5 1.5-.5 2.3 0 1.8.8 3.4 2 4.6-.9.2-1.6.6-2.2 1.2A8.4 8.4 0 0 1 3.5 12Z"
      />
    </svg>
  );
}

export function AlloyLogo({ className }: { className?: string }) {
  return (
    <motion.div
      aria-label="Alloy"
      className={className}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 24 24" role="img">
        <defs>
          <linearGradient id="alloyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="0.5" stopColor="#22C55E" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path
          fill="url(#alloyGrad)"
          d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 12 2.5Zm0 3a6.5 6.5 0 1 1-6.5 6.5A6.5 6.5 0 0 1 12 5.5Z"
        />
        <path
          fill="currentColor"
          opacity=".85"
          d="M12 7.8a4.2 4.2 0 1 0 4.2 4.2A4.2 4.2 0 0 0 12 7.8Zm0 2.2a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z"
        />
      </svg>
    </motion.div>
  );
}

