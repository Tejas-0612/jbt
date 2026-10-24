/** "Acme Corp" → "AC", "Globex" → "G", "  " → "?". */
function companyInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  // [...word] splits by character, so a letter made of two UTF-16 units stays whole.
  const initials = words.slice(0, 2).map((word) => [...word][0] ?? '');
  return initials.join('').toUpperCase() || '?';
}

/**
 * A company's initials in a tinted square (no logo service: it would cost money and
 * tell a third party which companies the user applies to). One neutral tint for now;
 * a small set of muted tints may follow with the dashboard. Decorative: the company
 * name is always written next to it.
 */
export function CompanyAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-subtle-foreground"
    >
      {companyInitials(name)}
    </span>
  );
}
