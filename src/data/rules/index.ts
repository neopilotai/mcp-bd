// blob/main/src/data/rules/index.ts

import { Rule } from "./types";
import { cairoRules } from "./cairo";
import { dhakaRules } from "./dhaka";
import { chittagongRules } from "./chittagong";
import { bangladeshRules } from "./bangladesh";

export type RulesetName = "cairo" | "dhaka" | "chittagong" | "bangladesh";

export const rulesRegistry: Record<RulesetName, Rule[]> = {
  cairo: cairoRules,
  dhaka: dhakaRules,
  chittagong: chittagongRules,
  bangladesh: bangladeshRules,
};

export function getRuleset(name: RulesetName): Rule[] {
  return rulesRegistry[name] || [];
}
