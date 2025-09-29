// blob/main/src/data/rules/bangladesh.ts

import { Rule } from "./types";
import { dhakaRules } from "./dhaka";
import { chittagongRules } from "./chittagong";

export const bangladeshRules: Rule[] = [
  {
    id: "bd-000",
    description: "Global Bangladesh restriction",
    pattern: /\.bd$/,
    action: "validate",
    notes: "Only allow domains under the Bangladeshi TLD.",
  },
  {
    id: "bd-001",
    description: "Block non-HTTPS traffic nationwide",
    action: "block",
    notes: "Bangladesh-wide HTTPS enforcement.",
  },
  {
    id: "bd-002",
    description: "Prioritize national government sites",
    pattern: /\.gov\.bd$/,
    action: "allow",
    notes: "Give highest priority to central government portals.",
  },
  {
    id: "bd-003",
    description: "Prioritize national educational sites",
    pattern: /\.edu\.bd$/,
    action: "allow",
    notes: "Give priority to education institutions across Bangladesh.",
  },
  {
    id: "bd-004",
    description: "Block common phishing-style subdomains",
    pattern: /(login|secure|update|verify)[0-9]*\./i,
    action: "block",
    notes: "Nationwide phishing filter for .bd domains.",
  },
  // Merge Dhaka & Chittagong region rules
  ...dhakaRules,
  ...chittagongRules,
];
