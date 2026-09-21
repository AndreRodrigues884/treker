import Link from "next/link";
import Image from "next/image";

export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-6 py-16 text-zinc-100">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-lg font-bold tracking-tight"
        >
          <Image
            src="/logo/treker-logo.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          Treker
        </Link>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-zinc-400">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">{footer}</p>
      </div>
    </main>
  );
}
