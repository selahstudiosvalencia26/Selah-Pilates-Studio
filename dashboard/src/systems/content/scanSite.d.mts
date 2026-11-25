export function scanSource(text: string): {
  slots: string[];
  prefixes: string[];
  raws: { line: number; text: string }[];
};
export function websiteRoot(cwd?: string): string | null;
export function scanWebsite(root: string): {
  slots: Map<string, string[]>;
  prefixes: Map<string, string[]>;
  fixed: { file: string; line: number; text: string }[];
};
