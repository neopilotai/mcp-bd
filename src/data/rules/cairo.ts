// blob/main/src/data/rules/cairo.ts

import { Rule } from "./types";

export const cairoRules: Rule[] = [
  {
    id: "cairo-001",
    description: "Block non-HTTPS traffic",
    action: "block",
    notes: "Enforces secure connections only for Cairo ruleset.",
  },
  {
    id: "cairo-002",
    description: "Validate .eg domains only",
    pattern: /\.eg$/,
    action: "validate",
    notes: "Ensures crawls are limited to Egyptian domains.",
  },
  {
    id: "cairo-003",
    description: "Allow .gov.eg priority",
    pattern: /\.gov\.eg$/,
    action: "allow",
    notes: "Prioritize government sites in the Cairo region.",
  },
];
