import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract section/article references from text (e.g. "Article 3", "Section 4.2", "Clause 7.1(a)")
 */
export function extractSectionRefs(text: string): string[] {
  const pattern =
    /\b((?:Article|Section|Clause|Schedule|Exhibit|Appendix|Part|Recital)\s+(?:\d+(?:\.\d+)*(?:\([a-z]\))?|[A-Z]))/gi;
  const seen = new Map<string, string>();
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(key)) {
      seen.set(key, match[1]);
    }
  }
  return Array.from(seen.values());
}
