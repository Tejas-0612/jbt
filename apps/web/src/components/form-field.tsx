import { WarningCircleIcon } from '@phosphor-icons/react';
import { useId, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

/** What the field passes to its control, so screen readers connect them. */
export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  label: string;
  /** Adds a quiet "(optional)" after the label. */
  optional?: boolean;
  /** Helper text under the control. */
  hint?: ReactNode;
  /** The error message, shown under the control with an icon. */
  error?: string | undefined;
  /** Renders the control (Input, NativeSelect…) with the props it needs. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * One form field: label, control, hint and error. It wires the accessibility links
 * shadcn's Field leaves to you: the label names the control, and the control points
 * at its hint and error (aria-describedby) and says when it's invalid. Errors are
 * not announced one by one; the form's summary banner does that once.
 */
export function FormField({ label, optional, hint, error, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-small text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-small text-destructive">
          <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
