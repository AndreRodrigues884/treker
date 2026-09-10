import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getProfile,
  getDisplayName,
  getNotificationsEnabled,
} from "@/lib/supabase/queries";
import { PreferencesForm } from "@/components/forms/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { NotificationsToggle } from "@/components/settings/notifications-toggle";
import { PasswordForm } from "@/components/settings/password-form";
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
              <ProfileForm
                defaultName={getDisplayName(user) ?? ""}
                email={user.email ?? ""}
              />
            ),
          },
          {
            id: "goals",
            label: "Atualizar objetivos de treino",
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
            content: (
              <NotificationsToggle
                defaultEnabled={getNotificationsEnabled(user)}
              />
            ),
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
