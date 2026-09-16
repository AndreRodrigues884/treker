import Link from "next/link";

export function ModalityCard({
  href,
  icon,
  tint,
  label,
  children,
}: {
  href: string;
  icon: string;
  tint: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-800/40 p-4 transition hover:border-slate-500"
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${tint}`}
        >
          {icon}
        </span>
        <span className="font-semibold text-zinc-100">{label}</span>
      </div>
      <div className="text-sm text-zinc-400">{children}</div>
    </Link>
  );
}
