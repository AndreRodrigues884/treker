"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExerciseCard } from "@/components/gym/exercise-card";
import { reorderExercisesAction } from "@/lib/actions/gym";
import type { Exercise, ExerciseSet } from "@/types/gym";
import type { MuscleGroup } from "@/lib/constants/gym";

type Item = { exercise: Exercise; sets: ExerciseSet[] };

export function SortableExerciseList({
  routineId,
  muscleGroup,
  items,
  routines,
}: {
  routineId: string;
  muscleGroup: MuscleGroup;
  items: Item[];
  routines: { id: string; name: string }[];
}) {
  const [order, setOrder] = useState(() => items.map((i) => i.exercise.id));
  const byId = new Map(items.map((i) => [i.exercise.id, i]));

  // Touch needs a short hold before it starts dragging (so a plain tap or
  // scroll doesn't get hijacked); the pointer/mouse sensor can start on a
  // small move instead, since there's no scroll-gesture to conflict with.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      const next = arrayMove(prev, oldIndex, newIndex);
      // Fire-and-forget: the list already reordered itself optimistically.
      void reorderExercisesAction(routineId, muscleGroup, next);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-zinc-500">
        No exercises in this workout yet.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {order.map((id) => {
            const item = byId.get(id);
            if (!item) return null;
            return (
              <SortableItem key={id} id={id}>
                {(dragHandle) => (
                  <ExerciseCard
                    exercise={item.exercise}
                    sets={item.sets}
                    muscleGroup={muscleGroup}
                    routines={routines}
                    dragHandle={dragHandle}
                  />
                )}
              </SortableItem>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

type DragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: DragHandle) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}
