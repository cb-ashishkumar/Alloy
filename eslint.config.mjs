import next from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"],
  },
  // Next 16 exports flat-config blocks directly; use them as-is.
  ...next,
];

export default config;

