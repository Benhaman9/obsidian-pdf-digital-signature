interface ExportWebContents {
  id: number;
  isDestroyed?: () => boolean;
  getBackgroundThrottling: () => boolean;
  setBackgroundThrottling: (enabled: boolean) => void;
}

interface Activity {
  contents: ExportWebContents;
  users: number;
  previous: boolean;
}

const activities = new Map<number, Activity>();

function restore(activity: Activity): void {
  try {
    if (activity.previous && !activity.contents.isDestroyed?.() && !activity.contents.getBackgroundThrottling()) {
      activity.contents.setBackgroundThrottling(true);
    }
  } catch { /* The export's window may already have closed. */ }
}

/** Keep the renderer's task loop running while native export and signing overlap.
 * Obsidian's hidden/occluded window can suspend native preparation timers and
 * pending callbacks. Node timers alone do not keep that renderer active.
 */
export function keepExportActive(): () => void {
  let activity: Activity;
  try {
    // Optional host API, resolved through the renderer rather than a bundled library import.
    const host = (typeof window === "undefined" ? {} : window) as unknown as { require?: (name: string) => unknown };
    const electron = host.require?.("electron") as { remote?: { getCurrentWebContents?: () => ExportWebContents } } | undefined;
    const contents = electron?.remote?.getCurrentWebContents?.();
    if (!contents || !Number.isInteger(contents.id) || typeof contents.getBackgroundThrottling !== "function" ||
        typeof contents.setBackgroundThrottling !== "function" || contents.isDestroyed?.()) return () => {};
    const existing = activities.get(contents.id);
    if (existing) activity = existing;
    else {
      activity = { contents, users: 0, previous: contents.getBackgroundThrottling() };
      if (activity.previous) contents.setBackgroundThrottling(false);
      activities.set(contents.id, activity);
    }
    activity.users++;
  } catch { return () => {}; } // Older hosts retain native/manual fallback.
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (activities.get(activity.contents.id) !== activity) return;
    if (--activity.users === 0) {
      activities.delete(activity.contents.id);
      restore(activity);
    }
  };
}

export function releaseExportActivity(): void {
  for (const activity of activities.values()) restore(activity);
  activities.clear();
}
