import { Children, type ReactNode } from "react";

/**
 * A numbered walkthrough:
 *
 *   <Steps>
 *     <Step title="Install the plugin"> … </Step>
 *     <Step title="Run /link"> … </Step>
 *   </Steps>
 *
 * Numbering comes from the child's position, so reordering steps can't
 * leave the numbers lying. `<Step>` renders nothing on its own outside a
 * `<Steps>` — the counter lives on the parent.
 */
export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children);

  return (
    <ol className="my-6 flex list-none flex-col">
      {steps.map((step, index) => (
        <li
          key={index}
          className="border-line relative border-l pb-6 pl-8 last:border-transparent last:pb-0"
        >
          <span className="border-border bg-card text-primary-ink absolute -left-[13px] top-0 flex size-[26px] items-center justify-center rounded-full border text-[0.72rem] font-semibold tabular-nums">
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="-mt-0.5">
      {title && <p className="mb-2 text-[0.95rem] font-semibold">{title}</p>}
      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </div>
  );
}
