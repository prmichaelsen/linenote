export const matchFirstGroupAll = (input: string, regex: RegExp): string[] => {
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    matches.push(match);
  }
  return matches.map(m => m[1]).filter(m => m !== null && m !== undefined);
};