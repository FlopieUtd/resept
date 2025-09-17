export const normalizeListItemPrefix = (input: string): string => {
  if (!input) return "";
  let s = input.normalize("NFKC");
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  s = s.replace(/\u00A0/g, " ");
  s = s.replace(/^\s*(?:[\-–—•●▪▢☐☑✅■◻]+|\[\s?\]|\(\s?\))\s*/u, "");
  s = s.replace(/^\s*(?:[\-–—•●▪▢☐☑✅■◻]+|\[\s?\]|\(\s?\))\s*/u, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
};
