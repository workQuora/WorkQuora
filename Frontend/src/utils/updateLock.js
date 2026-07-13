const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

// Mirrors the server-side lock in Backend/src/utils/updateLock.js — purely
// for immediate UI feedback; the real enforcement is server-side.
export const getLockInfo = (lastChangeAt) => {
  if (!lastChangeAt) return null;
  const elapsed = Date.now() - new Date(lastChangeAt).getTime();
  if (elapsed >= FOURTEEN_DAYS_MS) return null;
  const nextAvailableAt = new Date(new Date(lastChangeAt).getTime() + FOURTEEN_DAYS_MS);
  return {
    nextAvailableAt,
    formatted: nextAvailableAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
};
