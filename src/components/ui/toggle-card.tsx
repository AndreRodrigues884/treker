"use client";

export function ToggleCard({
  selected,
  onClick,
  icon,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border text-sm font-medium transition ${
        selected
          ? "border-indigo-400 bg-indigo-500/10 text-white"
          : "border-slate-700 text-zinc-400 hover:border-slate-500"
      } ${className}`}
    >
      {icon && <span className="text-xl leading-none">{icon}</span>}
      {children}
    </button>
  );
}
