"use client";

export function ToggleCard({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-2xl border text-sm font-medium transition ${
        selected
          ? "border-indigo-400 bg-indigo-500/10 text-white"
          : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
      } ${className}`}
    >
      {children}
    </button>
  );
}
