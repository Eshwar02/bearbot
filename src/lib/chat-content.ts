function collapseAdjacentDuplicates(items: string[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    const current = item.trim();
    if (!current) continue;
    const prev = result[result.length - 1];
    if (prev && prev === current) continue;
    result.push(current);
  }
  return result;
}

export function normalizeChatContent(content: string): string {
  const sanitized = content
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  const paragraphs = sanitized
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split('\n')
        .map((line) => line.trimEnd());
      return collapseAdjacentDuplicates(lines).join('\n').trim();
    });

  return collapseAdjacentDuplicates(paragraphs).join('\n\n').trim();
}
