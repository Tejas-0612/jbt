/**
 * The form of a company name used to match it, so "Acme Corp", "acme corp " and
 * "ACME  Corp" are one company. NFKC first turns look-alike characters into one form
 * (e.g. an "é" typed as "e" + accent, or full-width "Ａ") so they match too.
 */
export function normalizeCompanyName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}
