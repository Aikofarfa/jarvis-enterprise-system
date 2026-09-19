export function normalizeBrief(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isBriefReady(value: string) {
  return normalizeBrief(value).length >= 8;
}
