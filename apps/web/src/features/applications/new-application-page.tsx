import { zodResolver } from '@hookform/resolvers/zod';
import { CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  APPLICATION_LIMITS,
  APPLICATION_STATUSES,
  createApplicationInputSchema,
  validationErrorDetailsSchema,
  WORK_MODES,
  type CreateApplicationFormValues,
  type CreateApplicationInput,
} from '@jbt/shared';
import { useId, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { todayInBrowser } from '@/lib/dates';
import { useCreateApplication } from './api';
import { STATUS_LABELS, WORK_MODE_LABELS } from './labels';
import { StatusDot } from './status-badge';

const FIELD_NAMES = [
  'companyName',
  'roleTitle',
  'status',
  'appliedOn',
  'jobUrl',
  'location',
  'workMode',
  'jobDescription',
] as const satisfies readonly (keyof CreateApplicationFormValues)[];
type FieldName = (typeof FIELD_NAMES)[number];
const isFieldName = (name: string): name is FieldName =>
  (FIELD_NAMES as readonly string[]).includes(name);

const FIX_FIELDS = 'Some fields need attention. Check the messages under each field.';
const KEPT = 'Nothing was saved, but your entries are still here.';

/**
 * Add an application. Checked in the browser with the same shared rules the API uses,
 * so most mistakes show up before anything is sent. The API still has the last word
 * (e.g. "today" in your settings' timezone), and its messages land on the same fields.
 */
export function NewApplicationPage() {
  const navigate = useNavigate();
  const createApplication = useCreateApplication();
  // One "today" for this visit: the default date and the rules use the same value.
  const [today] = useState(todayInBrowser);
  const schema = useMemo(() => createApplicationInputSchema(today), [today]);
  const [problem, setProblem] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateApplicationFormValues, unknown, CreateApplicationInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      roleTitle: '',
      status: 'APPLIED',
      appliedOn: today,
      jobUrl: '',
      location: '',
      workMode: '',
      jobDescription: '',
    },
  });
  const status = useWatch({ control, name: 'status' });

  // A saved job hasn't been applied to yet: clear the date. Back to another status:
  // put today in again, unless a date is already there.
  function onStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    if (event.target.value === 'SAVED') setValue('appliedOn', '');
    else if (!getValues('appliedOn')) setValue('appliedOn', today);
  }

  /** Puts the API's per-field messages on the fields; returns the banner text. */
  function explain(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.code === 'VALIDATION_ERROR') {
        const details = validationErrorDetailsSchema.safeParse(error.details);
        if (details.success) {
          let first = true;
          for (const [name, messages] of Object.entries(details.data.fieldErrors)) {
            const message = messages[0];
            if (!isFieldName(name) || !message) continue;
            setError(name, { type: 'server', message }, { shouldFocus: first });
            first = false;
          }
          return details.data.formErrors[0] ?? FIX_FIELDS;
        }
      }
      if (error.code === 'NETWORK_ERROR' || error.code === 'API_UNREACHABLE') {
        return `Couldn't reach the server. ${KEPT} Try again in a moment.`;
      }
      // Other 4xx messages are written for people (e.g. "Run pnpm db:seed…" in development).
      if (error.status >= 400 && error.status < 500) return `${error.message} ${KEPT}`;
    }
    return `Something went wrong on our side. ${KEPT} Please try again.`;
  }

  const onSubmit = handleSubmit(
    async (input) => {
      setProblem(null);
      let id: string;
      try {
        id = (await createApplication.mutateAsync(input)).id;
      } catch (error) {
        setProblem(explain(error));
        return;
      }
      // Replace the form in the browser history, so Back doesn't return to a
      // filled-in form that could be saved twice.
      await navigate(`/applications/${id}`, { replace: true, state: { justCreated: true } });
    },
    () => setProblem(FIX_FIELDS),
  );

  return (
    <div className="max-w-3xl py-6 md:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Add an application</h1>
      <p className="mt-1 text-subtle-foreground">
        Company, role and date are enough. You can add the rest later.
      </p>

      {/* noValidate: our own messages instead of the browser's pop-ups. */}
      <form
        noValidate
        onSubmit={(event) => void onSubmit(event)}
        className="mt-6 flex flex-col gap-6"
      >
        <FormSection title="The job" description="What you applied for, and where it stands.">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Company" error={errors.companyName?.message}>
              {(field) => (
                <Input
                  {...field}
                  {...register('companyName')}
                  autoComplete="organization"
                  maxLength={APPLICATION_LIMITS.companyName}
                />
              )}
            </FormField>
            <FormField label="Role" error={errors.roleTitle?.message}>
              {(field) => (
                <Input
                  {...field}
                  {...register('roleTitle')}
                  autoComplete="off"
                  maxLength={APPLICATION_LIMITS.roleTitle}
                />
              )}
            </FormField>
            <FormField label="Status" error={errors.status?.message}>
              {(field) => (
                <div className="relative">
                  <StatusDot
                    status={status}
                    className="absolute top-1/2 left-3 z-10 -translate-y-1/2"
                  />
                  <NativeSelect
                    {...field}
                    {...register('status', { onChange: onStatusChange })}
                    className="pl-7"
                  >
                    {APPLICATION_STATUSES.map((value) => (
                      <NativeSelectOption key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </FormField>
            {status !== 'SAVED' && (
              <FormField label="Applied on" error={errors.appliedOn?.message}>
                {(field) => <Input {...field} {...register('appliedOn')} type="date" max={today} />}
              </FormField>
            )}
          </div>
        </FormSection>

        <FormSection
          title="More details"
          description="Optional, but handy later: when a recruiter calls, you'll have the context."
        >
          <FormField
            label="Job link"
            optional
            hint="The posting itself, so you can reread it."
            error={errors.jobUrl?.message}
          >
            {(field) => (
              <Input
                {...field}
                {...register('jobUrl')}
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={APPLICATION_LIMITS.jobUrl}
              />
            )}
          </FormField>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Location" optional error={errors.location?.message}>
              {(field) => (
                <Input
                  {...field}
                  {...register('location')}
                  maxLength={APPLICATION_LIMITS.location}
                />
              )}
            </FormField>
            <FormField label="Work mode" optional error={errors.workMode?.message}>
              {(field) => (
                <NativeSelect {...field} {...register('workMode')}>
                  <NativeSelectOption value="">Not specified</NativeSelectOption>
                  {WORK_MODES.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {WORK_MODE_LABELS[value]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            </FormField>
          </div>
          <FormField
            label="Job description"
            optional
            hint="Paste the ad: postings often disappear once the role is filled."
            error={errors.jobDescription?.message}
          >
            {(field) => (
              <Textarea
                {...field}
                {...register('jobDescription')}
                maxLength={APPLICATION_LIMITS.jobDescription}
              />
            )}
          </FormField>
        </FormSection>

        {problem && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
            {problem}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <CircleNotchIcon aria-hidden className="animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Save application'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

/** A white card on the ivory page with a title and a one-line description. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card p-5 shadow-card md:p-6">
      <h2 id={id} className="font-semibold">
        {title}
      </h2>
      <p className="mt-0.5 text-small text-muted-foreground">{description}</p>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
