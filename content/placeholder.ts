const placeholders = new Set<string>();

/** Marks unfinished copy while returning the original string for rendering. */
export function placeholder<const T extends string>(text: T): T {
  placeholders.add(text);
  return text;
}

export function isPlaceholder(text: string): boolean {
  return placeholders.has(text);
}
