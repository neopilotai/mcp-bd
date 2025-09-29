// blob/main/src/data/rules/chittagong.ts

import { Rule } from "./types";

export const chittagongRules: Rule[] = [
  {
    id: "chittagong-001",
    description: "Restrict crawls to .bd coastal region subdomains",
    pattern: /(ctg|chittagong)\.bd$/i,
    action: "validate",
    notes: "Target Chittagong-specific regional sites.",
  },
  {
    id: "chittagong-002",
    description: "Allow maritime and port authority sites",
    pattern: /(port|maritime|shipping)\.gov\.bd$/i,
    action: "allow",
    notes: "Prioritize government maritime and port resources.",
  },
  {
    id: "chittagong-003",
    description: "Block fishing/seafood scam subdomains",
    pattern: /(deal|offer|discount)[0-9]*\./i,
    action: "block",
    notes: "Reduce risk of spammy seafood export scams.",
  },
  {
    id: "chittagong-004",
    description: "Force HTTPS for trade/export sites",
    pattern: /(export|import|trade)\.bd$/i,
    action: "block",
    notes: "Ensure secure connections for trade-focused domains.",
  },
  {
    id: "chittagong-005",
    description: "Prioritize educational & technical institutes",
    pattern: /(cu|cuet|institute)\.edu\.bd$/i,
    action: "allow",
    notes: "Give high priority to Chittagong universities and institutes.",
  },
];
