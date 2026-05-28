import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.28em] text-mocha/70 dark:text-gold/80">{eyebrow}</p>}
        <h1 className="font-serif text-4xl font-extrabold leading-tight text-espresso dark:text-cream md:text-6xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-espresso/70 dark:text-cream/70 md:text-base">{description}</p>}
      </div>
      {action}
    </header>
  );
}
