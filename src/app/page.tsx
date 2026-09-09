import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getPostAuthPath } from "@/lib/auth/redirect";
import { LandingHero } from "@/components/landing/landing-hero";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(await getPostAuthPath(user.id));

  return <LandingHero />;
}
