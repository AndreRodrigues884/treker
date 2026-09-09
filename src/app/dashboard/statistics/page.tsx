import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getAllExercises, getAllExerciseSets } from "@/lib/gym/queries";
import {
  averageSessionsPerWeek,
  bestOneRepMaxPerExercise,
  plateauExercises,
  setsPerMuscleGroup,
  totalStrength,
} from "@/lib/gym/derive";
import { MuscleGroupVolumeChart } from "@/components/gym/muscle-group-volume-chart";

export default async function StatisticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes("gym")) redirect("/dashboard");

  const [exercises, sets] = await Promise.all([
    getAllExercises(user.id),
    getAllExerciseSets(user.id),
  ]);

  const oneRepMaxes = bestOneRepMaxPerExercise(exercises, sets);
  const strength = totalStrength(oneRepMaxes);
  const volumeByGroup = setsPerMuscleGroup(exercises, sets, 8);
  const plateaued = plateauExercises(exercises, sets, 3);
  const avgSessionsPerWeek = averageSessionsPerWeek(sets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-zinc-400">Your Gym numbers, across every exercise.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Força Total"
          subtitle="Soma dos 1RM acumulados · todos os exercícios"
        >
          <p className="text-3xl font-bold text-zinc-100">{formatKg(strength)}</p>
        </StatCard>

        <StatCard
          title="Treinos por semana"
          subtitle={`Média: ${avgSessionsPerWeek.toFixed(1)} sessões/sem`}
          note="Segunda-feira = início de semana"
        >
          <p className="text-3xl font-bold text-zinc-100">
            {avgSessionsPerWeek.toFixed(1)}
          </p>
        </StatCard>

        <StatCard
          title="1RM Estimado"
          subtitle="Fórmula Epley · peso × (1 + reps/30)"
          className="sm:col-span-2"
        >
          {oneRepMaxes.length === 0 ? (
            <EmptyNote>Log some weighted sets to see this.</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {oneRepMaxes.slice(0, 6).map((e) => (
                <li
                  key={e.exerciseId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-300">{e.exerciseName}</span>
                  <span className="font-semibold tabular-nums text-zinc-100">
                    {formatKg(e.oneRepMax)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </StatCard>

        <StatCard
          title="Volume por grupo muscular"
          subtitle="Séries registadas por grupo muscular · últimas 8 semanas"
          className="sm:col-span-2"
        >
          <MuscleGroupVolumeChart data={volumeByGroup} />
        </StatCard>

        <StatCard
          title="Análise de Deload"
          subtitle="Exercícios em plateau há 3+ sessões"
          className="sm:col-span-2"
        >
          {plateaued.length === 0 ? (
            <EmptyNote>No plateaus detected — keep it up.</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {plateaued.map((e) => (
                <li
                  key={e.exerciseId}
                  className="flex items-center gap-2 text-sm text-amber-300"
                >
                  <span aria-hidden>⚠️</span>
                  {e.exerciseName}
                </li>
              ))}
            </ul>
          )}
        </StatCard>
      </div>
    </div>
  );
}

function formatKg(value: number) {
  return `${value.toFixed(1)}kg`;
}

function StatCard({
  title,
  subtitle,
  note,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ${className}`}
    >
      <div>
        <h2 className="font-semibold text-zinc-100">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
        {note && <p className="text-xs text-zinc-500">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}
