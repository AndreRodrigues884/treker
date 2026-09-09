import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getPostAuthPath } from "@/lib/auth/redirect";
import { SignUpForm } from "@/components/forms/sign-up-form";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect(await getPostAuthPath(user.id));

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-6 text-zinc-100">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-zinc-400">
            Start tracking your training in minutes.
          </p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
