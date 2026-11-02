import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, getDisplayName } from "@/lib/supabase/queries";
import { PreferencesForm } from "@/components/forms/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { EmailChangeForm } from "@/components/settings/email-change-form";
import { NotificationsToggle } from "@/components/settings/notifications-toggle";
import { PasswordForm } from "@/components/settings/password-form";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { PrivacyPolicy } from "@/components/settings/privacy-policy";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-400">
          Manage your profile, training goals, and account.
        </p>
      </div>

      <SettingsTabs
        tabs={[
          {
            id: "profile",
            label: "Profile",
            icon: "👤",
            content: (
              <div className="max-w-2xl space-y-8">
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-100">Name</h2>
                  <ProfileForm defaultName={getDisplayName(user) ?? ""} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-100">Email</h2>
                  <EmailChangeForm currentEmail={user.email ?? ""} />
                </div>
              </div>
            ),
          },
          {
            id: "goals",
            label: "Update training objectives",
            icon: "🎯",
            content: (
              <PreferencesForm
                defaultModalities={profile?.modalities ?? []}
                defaultGoals={profile?.goals ?? []}
              />
            ),
          },
          {
            id: "notifications",
            label: "Notifications",
            icon: "🔔",
            content: <NotificationsToggle />,
          },
          {
            id: "security",
            label: "Security",
            icon: "🔒",
            content: (
              <div className="max-w-2xl space-y-8">
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Change password
                  </h2>
                  <PasswordForm />
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-red-300">Danger zone</h2>
                  <DeleteAccountForm />
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Privacy policy
                  </h2>
                  <PrivacyPolicy />
                </div>
              </div>
            ),
          },
          {
            id: "appearance",
            label: "Appearance",
            icon: "🎨",
            content: <ThemeToggle />,
          },
        ]}
      />
    </div>
  );
}
