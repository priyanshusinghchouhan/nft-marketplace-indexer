export function isStaleEvent(
  existingBlock: number | null,
  existingLogIndex: number | null,
  newBlock: number,
  newLogIndex: number,
) {
  if (existingBlock === null) return false;

  if (existingBlock > newBlock) return true;

  if (existingBlock === newBlock && (existingLogIndex ?? 0) >= newLogIndex)
    return true;

  return false;
}