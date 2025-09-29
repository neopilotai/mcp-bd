// blob/main/src/data/rules/dhaka.ts

import { Rule } from "./types";

export const dhakaRules: Rule[] = [
  {
    id: "dhaka-001",
    description: "Block non-HTTPS traffic",
    action: "block",
    notes: "Ensure crawls are secure by only allowing HTTPS.",
  },
  {
    id: "dhaka-002",
    description: "Validate .bd domains only",
    pattern: /\.bd$/,
    action: "validate",
    notes: "Crawls must be restricted to Bangladeshi domains.",
  },
  {
    id: "dhaka-003",
    description: "Allow .gov.bd priority",
    pattern: /\.gov\.bd$/,
    action: "allow",
    notes: "Prioritize government-owned Bangladeshi websites.",
  },
  {
    id: "dhaka-004",
    description: "Allow .edu.bd priority",
    pattern: /\.edu\.bd$/,
    action: "allow",
    notes: "Give higher priority to educational institutions.",
  },
  {
    id: "dhaka-005",
    description: "Block domains with suspicious subdomains (e.g., phishing)",
    pattern: /(login|secure|update|verify)[0-9]*\./i,
    action: "block",
    notes: "Helps filter common phishing subdomains in .bd space.",
  },
];
