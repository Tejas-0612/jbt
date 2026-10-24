import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { listApplicationsQuerySchema } from './application-list';

const parse = (query: unknown) => listApplicationsQuerySchema.parse(query);

/** The error messages when `query` is refused (throws if it was accepted). */
function refusal(query: unknown) {
  const result = listApplicationsQuerySchema.safeParse(query);
  if (result.success) throw new Error('expected the query to be refused');
  return z.flattenError(result.error);
}

describe('listApplicationsQuerySchema', () => {
  it('fills in the defaults: page 1 of 20, last updated first, no filters', () => {
    expect(parse({})).toEqual({ page: 1, pageSize: 20, sortBy: 'updatedAt', order: 'desc' });
  });

  it('reads numbers, filters and sort from URL strings', () => {
    expect(
      parse({
        page: '3',
        pageSize: '50',
        search: '  front end ',
        status: 'APPLIED,SCREENING',
        sortBy: 'appliedOn',
        order: 'asc',
      }),
    ).toEqual({
      page: 3,
      pageSize: 50,
      search: 'front end',
      status: ['APPLIED', 'SCREENING'],
      sortBy: 'appliedOn',
      order: 'asc',
    });
  });

  it('treats a blank search or status as no filter', () => {
    expect(parse({ search: '   ', status: '' })).toEqual(parse({}));
  });

  it('sorts names A–Z and dates newest first unless an order is given', () => {
    expect(parse({ sortBy: 'company' }).order).toBe('asc');
    expect(parse({ sortBy: 'createdAt' }).order).toBe('desc');
    expect(parse({ sortBy: 'company', order: 'desc' }).order).toBe('desc');
  });

  it.each(['', '0', '-1', '1.5', ' 2', '1e3', '0x10', 'abc', '10001'])(
    'refuses page=%j',
    (page) => {
      expect(refusal({ page }).fieldErrors.page).toEqual(['Use a whole number from 1 to 10,000']);
    },
  );

  it('refuses a page size above 100', () => {
    expect(refusal({ pageSize: '101' }).fieldErrors.pageSize).toEqual([
      'Use a whole number from 1 to 100',
    ]);
  });

  it('refuses an unknown status, even next to a known one', () => {
    expect(refusal({ status: 'APPLIED,FOO' }).fieldErrors.status).toHaveLength(1);
  });

  it('refuses sort fields outside the list, so the URL never names a column', () => {
    expect(refusal({ sortBy: 'password' }).fieldErrors.sortBy).toBeDefined();
    expect(refusal({ order: 'up' }).fieldErrors.order).toEqual(['Use asc or desc']);
  });

  it('refuses a search longer than 200 characters', () => {
    expect(refusal({ search: 'a'.repeat(201) }).fieldErrors.search).toBeDefined();
  });

  it('refuses unknown parameters and repeated ones', () => {
    expect(refusal({ companyId: 'x' }).formErrors).toEqual(['Unrecognized key: "companyId"']);
    // A repeated parameter (?page=1&page=2) reaches us as an array.
    expect(refusal({ page: ['1', '2'] }).fieldErrors.page).toBeDefined();
  });
});
