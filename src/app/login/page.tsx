import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getPostAuthPath } from "@/lib/auth/redirect";
import { SignInForm } from "@/components/forms/sign-in-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(await getPostAuthPath(user.id));

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthLayout>
  );
}
