import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getAllExercises, getAllExerciseSets } from "@/lib/gym/queries";
import {
  averageSessionsPerWeek,
  bestOneRepMaxPerExercise,
  oneRepMaxHistory,
  plateauExercises,
  setsPerMuscleGroup,
  totalStrength,
  totalStrengthHistory,
} from "@/lib/gym/derive";
import { MuscleGroupVolumeChart } from "@/components/gym/muscle-group-volume-chart";
import { ProgressChart } from "@/components/gym/progress-chart";
import { OneRepMaxCard } from "@/components/statistics/one-rep-max-card";

const VIOLET = "#a78bfa";

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
  const strengthHistory = totalStrengthHistory(exercises, sets);
  const strengthGain =
    strengthHistory.length > 1 ? strength - strengthHistory[0].value : 0;

  const track1rmById = new Map(exercises.map((e) => [e.id, e.track_1rm]));
  const oneRepMaxExercises = oneRepMaxes
    .filter((e) => track1rmById.get(e.exerciseId) !== false)
    .map((e) => ({
    exerciseId: e.exerciseId,
    exerciseName: e.exerciseName,
    history: oneRepMaxHistory(
      sets.filter((s) => s.exercise_id === e.exerciseId),
    ),
  }));

  const volumeByGroup = setsPerMuscleGroup(exercises, sets, 8);
  const plateaued = plateauExercises(exercises, sets, 3);
  const avgSessionsPerWeek = averageSessionsPerWeek(sets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-zinc-400">Your Gym numbers, across every exercise.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-zinc-100">Força Total</h2>
              <p className="text-xs text-zinc-500">
                Soma dos 1RM acumulados · todos os exercícios
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-400">
                {formatKg(strength)}
              </p>
              {strengthGain > 0 && (
                <p className="text-xs font-medium text-emerald-400">
                  +{formatKg(strengthGain)} ganhos
                </p>
              )}
            </div>
          </div>
          {strengthHistory.length < 2 ? (
            <EmptyNote>Log at least two sessions to see your progress.</EmptyNote>
          ) : (
            <ProgressChart points={strengthHistory} unit="kg" color={VIOLET} />
          )}
        </div>

        <OneRepMaxCard exercises={oneRepMaxExercises} />

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
          title="Volume por grupo muscular"
          subtitle="Séries registadas por grupo muscular · últimas 8 semanas"
        >
          <MuscleGroupVolumeChart data={volumeByGroup} />
        </StatCard>

        <StatCard
          title="Análise de Deload"
          subtitle="Exercícios em plateau há 3+ sessões"
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
  children,
}: {
  title: string;
  subtitle: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
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
