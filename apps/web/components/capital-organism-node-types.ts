export type OrgNodeVariant = "ai" | "reserves" | "rwa" | "outflow" | "constitution" | "shock";

export type OrgNodeData = Record<string, unknown> & {
  variant: OrgNodeVariant;
  title: string;
  sub: string;
  blockPulse?: boolean;
};
