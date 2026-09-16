"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ReactNode;
};

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

export function TextField({ label, icon, id, ...props }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-sm text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
          <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        </span>
        <input id={fieldId} {...props} className={inputClass} />
      </div>
    </div>
  );
}

export function PasswordField({
  label,
  icon,
  id,
  ...props
}: Omit<FieldProps, "type">) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-sm text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <input
          id={fieldId}
          {...props}
          type={visible ? "text" : "password"}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 transition hover:text-zinc-300"
        >
          {visible ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
