const SECTION_HEADING_RE = /\n\n(?=(?:Article|Section|PART|CHAPTER|\d+\.)\s)/i;

/**
 * Split a large text into chunks suitable for Claude analysis.
 * Tries to split on natural section/article boundaries first.
 * Each chunk carries a preamble (last heading seen) for context.
 */
export function chunkText(
  text: string,
  targetSize = 30000,
  maxSize = 35000
): { text: string; heading: string | null }[] {
  if (text.length <= maxSize) {
    return [{ text, heading: null }];
  }

  const chunks: { text: string; heading: string | null }[] = [];
  let remaining = text;
  let lastHeading: string | null = null;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push({ text: remaining, heading: lastHeading });
      break;
    }

    // Find a split point within targetSize..maxSize
    const window = remaining.slice(0, maxSize);

    // 1. Try section/article boundary
    let splitIdx = findLastMatch(window, targetSize, SECTION_HEADING_RE);

    // 2. Try double newline
    if (splitIdx === -1) {
      splitIdx = window.lastIndexOf("\n\n", maxSize);
      if (splitIdx < targetSize * 0.5) splitIdx = -1;
    }

    // 3. Try single newline
    if (splitIdx === -1) {
      splitIdx = window.lastIndexOf("\n", maxSize);
      if (splitIdx < targetSize * 0.5) splitIdx = -1;
    }

    // 4. Hard split
    if (splitIdx === -1) {
      splitIdx = targetSize;
    }

    const chunk = remaining.slice(0, splitIdx).trim();
    chunks.push({ text: chunk, heading: lastHeading });

    // Track last heading for next chunk's preamble
    const headingMatch = chunk.match(
      /(?:Article|Section|PART|CHAPTER|\d+\.)[^\n]*/gi
    );
    if (headingMatch) {
      lastHeading = headingMatch[headingMatch.length - 1].trim();
    }

    remaining = remaining.slice(splitIdx).trim();
  }

  return chunks.filter((c) => c.text.length > 0);
}

function findLastMatch(text: string, minIdx: number, re: RegExp): number {
  let lastIdx = -1;
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let match: RegExpExecArray | null;
  while ((match = global.exec(text)) !== null) {
    if (match.index >= minIdx * 0.5 && match.index < text.length) {
      lastIdx = match.index;
    }
  }
  return lastIdx;
}
