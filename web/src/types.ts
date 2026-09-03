export const roles = ["top", "jungle", "mid", "bot", "support"] as const;
export type Role = (typeof roles)[number];
export type Color = "blue" | "white" | "black" | "red" | "green" | "colorless";
export type Capability = "engage" | "frontline" | "wave_clear";
export interface Profile {
  champion_name: string;
  role: Role;
  capabilities: Capability[];
}
export interface Strategy {
  main_colors: Color[];
  off_colors: Color[];
  reasoning: string;
  source_name: string;
  source_url: string | null;
  patch: string | null;
  review_status: "unreviewed" | "provisional" | "reviewed" | "outdated";
}
export interface Report {
  schema_version: 1;
  analysis_type: "baseline_capability_check";
  is_demo: boolean;
  limitations: string[];
  champions: (Profile & {
    capability_source: string;
    strategy: Strategy | null;
  })[];
  capability_assessments: {
    capability: Capability;
    providers: string[];
    is_missing: boolean;
  }[];
}
