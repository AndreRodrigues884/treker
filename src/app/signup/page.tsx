import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getPostAuthPath } from "@/lib/auth/redirect";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect(await getPostAuthPath(user.id));

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking your training in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthLayout>
  );
}
