export const resolveSelectedId = (candidate: string | undefined, availableIds: string[]): string | null => {
  if (candidate && availableIds.includes(candidate)) {
    return candidate;
  }

  return availableIds[0] ?? null;
};
