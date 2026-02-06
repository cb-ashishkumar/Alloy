export function safeForLog(value: unknown, maxChars = 8000): unknown {
  try {
    const s = JSON.stringify(value);
    if (s.length <= maxChars) return value;
    return {
      truncated: true,
      maxChars,
      actualChars: s.length,
      preview: `${s.slice(0, maxChars)}…(truncated)`,
    };
  } catch {
    return String(value);
  }
}

export function logJsonLine(label: string, obj: unknown) {
  // Always multi-line JSON with stable readability in terminal logs
  console.log(`${label}\n${JSON.stringify(obj, null, 2)}`);
}

