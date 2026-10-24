import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { applicationSchema, createApplicationInputSchema } from './application';

const TODAY = '2026-10-22';
const schema = createApplicationInputSchema(TODAY);

const minimal = {
  companyName: 'Acme Corp',
  roleTitle: 'Backend Engineer',
  status: 'APPLIED',
  appliedOn: TODAY,
};

/** The error messages when `input` is refused (throws if it was accepted). */
function refusal(input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) throw new Error('expected the input to be refused');
  return z.flattenError(result.error);
}

const fieldErrors = (input: unknown) => refusal(input).fieldErrors;

describe('createApplicationInputSchema', () => {
  it('accepts company + role + status + date, and fills the optional fields with null', () => {
    expect(schema.parse(minimal)).toEqual({
      ...minimal,
      jobUrl: null,
      location: null,
      workMode: null,
      jobDescription: null,
    });
  });

  it('trims text and turns blank optional fields into null', () => {
    const parsed = schema.parse({
      ...minimal,
      companyName: '  Acme Corp ',
      location: '   ',
      jobUrl: '',
      jobDescription: ' Build APIs. ',
    });

    expect(parsed).toMatchObject({
      companyName: 'Acme Corp',
      location: null,
      jobUrl: null,
      jobDescription: 'Build APIs.',
    });
  });

  it('requires company and role, and refuses blank ones', () => {
    expect(fieldErrors({ ...minimal, companyName: undefined })).toHaveProperty('companyName');
    expect(fieldErrors({ ...minimal, roleTitle: '   ' })).toEqual({ roleTitle: ['Add the role'] });
  });

  it('refuses text that is too long', () => {
    expect(fieldErrors({ ...minimal, companyName: 'x'.repeat(201) })).toEqual({
      companyName: ['Use 200 characters or fewer'],
    });
    expect(fieldErrors({ ...minimal, jobDescription: 'x'.repeat(50_001) })).toEqual({
      jobDescription: ['Use 50,000 characters or fewer'],
    });
  });

  it('refuses an unknown status or work mode', () => {
    expect(fieldErrors({ ...minimal, status: 'INTERVIEW' })).toHaveProperty('status');
    expect(fieldErrors({ ...minimal, workMode: 'REMOTEISH' })).toHaveProperty('workMode');
  });

  describe('applied date', () => {
    it('is required unless the job is only saved', () => {
      expect(fieldErrors({ ...minimal, appliedOn: '' })).toEqual({
        appliedOn: ['Add the date you applied'],
      });
      expect(schema.parse({ ...minimal, status: 'SAVED', appliedOn: null })).toMatchObject({
        status: 'SAVED',
        appliedOn: null,
      });
    });

    it('must be empty for a saved job', () => {
      expect(fieldErrors({ ...minimal, status: 'SAVED' })).toHaveProperty('appliedOn');
    });

    it('can be today or earlier, but not in the future', () => {
      expect(schema.parse({ ...minimal, appliedOn: '2026-01-05' }).appliedOn).toBe('2026-01-05');
      expect(fieldErrors({ ...minimal, appliedOn: '2026-10-23' })).toEqual({
        appliedOn: ["The applied date can't be in the future"],
      });
    });

    it('must be a real calendar date', () => {
      expect(fieldErrors({ ...minimal, appliedOn: '2026-02-30' })).toEqual({
        appliedOn: ['Enter a real date, like 2026-10-22'],
      });
      // Only one message, even though "2026-13-01" also sorts after today.
      expect(fieldErrors({ ...minimal, appliedOn: '2026-13-01' })).toEqual({
        appliedOn: ['Enter a real date, like 2026-10-22'],
      });
      expect(schema.parse({ ...minimal, appliedOn: '2024-02-29' }).appliedOn).toBe('2024-02-29');
    });
  });

  it('accepts only http(s) job links, so a link can never run code', () => {
    expect(schema.parse({ ...minimal, jobUrl: 'https://jobs.example.com/42' }).jobUrl).toBe(
      'https://jobs.example.com/42',
    );
    for (const jobUrl of ['javascript:alert(1)', 'jobs.example.com/42', 'ftp://example.com']) {
      expect(fieldErrors({ ...minimal, jobUrl })).toEqual({
        jobUrl: ['Enter the full link, starting with http:// or https://'],
      });
    }
  });

  it('refuses fields it does not know, such as userId', () => {
    expect(refusal({ ...minimal, userId: 'someone-else' }).formErrors).toEqual([
      'Unrecognized key: "userId"',
    ]);
  });

  it('reports blank fields and the missing date together, so a form can show them all', () => {
    expect(fieldErrors({ ...minimal, companyName: '', appliedOn: '' })).toEqual({
      companyName: ['Add the company name'],
      appliedOn: ['Add the date you applied'],
    });
  });
});

describe('applicationSchema', () => {
  it('accepts an application as the API sends it', () => {
    const application = {
      id: '01a1639c-2848-72b2-b558-6ddb5d2b5a53',
      status: 'APPLIED',
      roleTitle: 'Backend Engineer',
      company: { id: '01a1639c-28fe-70eb-92b4-d475fc39389b', name: 'Acme Corp' },
      appliedOn: '2026-10-22',
      jobUrl: null,
      location: 'Pune',
      workMode: 'HYBRID',
      jobDescription: null,
      createdAt: '2026-10-22T12:35:40.747Z',
      updatedAt: '2026-10-22T12:35:40.747Z',
    };

    expect(applicationSchema.parse(application)).toEqual(application);
  });
});
