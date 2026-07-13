const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

// Returns null when the field is free to change, or { message, nextAvailableAt }
// when it's still within the 14-day cooldown since the last change.
const checkUpdateLock = (lastChangeAt, fieldLabel) => {
  if (!lastChangeAt) return null;
  const elapsed = Date.now() - new Date(lastChangeAt).getTime();
  if (elapsed >= FOURTEEN_DAYS_MS) return null;

  const nextAvailableAt = new Date(new Date(lastChangeAt).getTime() + FOURTEEN_DAYS_MS);
  const formatted = nextAvailableAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return {
    message: `You recently updated your ${fieldLabel}. Next update available on ${formatted}.`,
    nextAvailableAt,
  };
};

module.exports = { checkUpdateLock, FOURTEEN_DAYS_MS };
