import type { MuscleGroup } from "@/lib/constants/gym";

const SRC: Record<MuscleGroup, string> = {
  back: "/muscle-icons/back.svg",
  chest: "/muscle-icons/chest.svg",
  legs: "/muscle-icons/legs.svg",
  shoulders: "/muscle-icons/shoulders.svg",
  biceps: "/muscle-icons/biceps.svg",
  triceps: "/muscle-icons/triceps.svg",
  core: "/muscle-icons/core.svg",
  quads: "/muscle-icons/quads.png",
  hamstrings: "/muscle-icons/hamstrings.png",
  glutes: "/muscle-icons/glutes.png",
  forearms: "/muscle-icons/forearms.png",
  calves: "/muscle-icons/calves.png",
  // No dedicated diagram for these two yet — each reuses its broader
  // parent's silhouette (still the right body region, just not zoomed
  // into the specific muscle) rather than showing nothing. Drop a real
  // lats.svg/traps.svg into public/muscle-icons and point these at it
  // whenever one's made.
  lats: "/muscle-icons/back.svg",
  traps: "/muscle-icons/back.svg",
};

/**
 * The real muscle-activation diagrams (gray body silhouette, the trained
 * region highlighted in red) — static SVGs served from
 * public/muscle-icons. Every call site already shows the group's label
 * as visible text right next to this, so the image is purely decorative
 * (empty alt) rather than needing its own description.
 */
export function MuscleGroupIcon({
  group,
  className = "h-6 w-6",
}: {
  group: MuscleGroup;
  className?: string;
}) {
  // Small static local SVGs in a badge don't need next/image's optimizer
  // (which also can't optimize SVGs without extra config) — plain <img>
  // is simplest.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={SRC[group]} alt="" className={className} />;
}
