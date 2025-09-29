// blob/main/src/data/rules/types.ts

export interface Rule {
  id: string;
  description: string;
  pattern?: RegExp;
  action: "allow" | "block" | "modify" | "validate";
  notes?: string;
}
