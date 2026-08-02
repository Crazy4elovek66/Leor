export function formatCountdown(expiresAt?: string | null): string {
  if (!expiresAt) return '';

  const target = new Date(expiresAt).getTime();
  const now = new Date().getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return 'Истекло';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours >= 1) {
    return `${diffHours}ч`;
  }

  return `${Math.max(1, diffMinutes)}м`;
}
