import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InProgressWorkoutCard } from "./in-progress-workout-card";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const USER_ID = "user-1";

function storagePendingFor(muscleGroup: string, savedAt: number, setCount = 1) {
  const pending: Record<string, unknown> = {};
  for (let i = 1; i <= setCount; i++) {
    pending[`exercise-${i}:1`] = { weightKg: 40, reps: 10, executionType: "straight", difficulty: "medium" };
  }
  return JSON.stringify({ savedAt, pending });
}

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("InProgressWorkoutCard", () => {
  it("renders nothing with no staged workout", () => {
    const { container } = render(<InProgressWorkoutCard userId={USER_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for another user's staged workout", () => {
    window.localStorage.setItem(
      `treker:pending-session:other-user:chest`,
      storagePendingFor("chest", Date.now()),
    );
    const { container } = render(<InProgressWorkoutCard userId={USER_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a card for a staged workout, with the muscle group and set count", async () => {
    window.localStorage.setItem(
      `treker:pending-session:${USER_ID}:chest`,
      storagePendingFor("chest", Date.now(), 3),
    );
    render(<InProgressWorkoutCard userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText(/Chest workout in progress/)).toBeInTheDocument();
    });
    expect(screen.getByText(/3 sets staged/)).toBeInTheDocument();
  });

  it("ignores an entry with zero staged sets", () => {
    window.localStorage.setItem(
      `treker:pending-session:${USER_ID}:chest`,
      JSON.stringify({ savedAt: Date.now(), pending: {} }),
    );
    const { container } = render(<InProgressWorkoutCard userId={USER_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("Continue navigates to that muscle group's page", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      `treker:pending-session:${USER_ID}:legs`,
      storagePendingFor("legs", Date.now()),
    );
    render(<InProgressWorkoutCard userId={USER_ID} />);

    await waitFor(() => screen.getByText(/Legs workout in progress/));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(push).toHaveBeenCalledWith("/dashboard/gym/legs");
  });

  it("Discard, once confirmed, removes the card and clears the backup", async () => {
    const user = userEvent.setup();
    const storageKey = `treker:pending-session:${USER_ID}:back`;
    window.localStorage.setItem(storageKey, storagePendingFor("back", Date.now()));
    render(<InProgressWorkoutCard userId={USER_ID} />);

    await waitFor(() => screen.getByText(/Back workout in progress/));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    await user.click(screen.getByRole("button", { name: "Discard" })); // the confirm modal's button

    await waitFor(() => {
      expect(screen.queryByText(/Back workout in progress/)).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(storageKey)).toBeNull();
  });

  it("does not remove the backup when discard is cancelled", async () => {
    const user = userEvent.setup();
    const storageKey = `treker:pending-session:${USER_ID}:core`;
    window.localStorage.setItem(storageKey, storagePendingFor("core", Date.now()));
    render(<InProgressWorkoutCard userId={USER_ID} />);

    await waitFor(() => screen.getByText(/Core workout in progress/));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText(/Core workout in progress/)).toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).not.toBeNull();
  });
});
