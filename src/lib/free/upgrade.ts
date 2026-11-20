import { logEvent } from "../events";
import { findSubscriberByEmail, saveSubscriber } from "./repo";
import { applyUpgradeStop, noteTrialStart, type FreePauseReason } from "./subscriber";

/**
 * Stop a free edition when the same email creates a custom page or starts a
 * trial / checkout. Parents who already chose "keep it" are not paused.
 * Never throws: a failure here must not block the app or billing.
 */
export async function pauseFreeForUpgrade(email: string, reason: FreePauseReason): Promise<void> {
  try {
    const sub = await findSubscriberByEmail(email);
    if (!sub) return;
    const at = new Date().toISOString();
    const paused = applyUpgradeStop(sub, reason, at);
    let next = paused.subscriber;
    let save = paused.changed;
    if (reason === "trial" || reason === "billing") {
      const noted = noteTrialStart(next, at);
      next = noted.subscriber;
      if (noted.log) {
        save = true;
        await logEvent({
          type: "free_to_trial_started",
          meta: { subscriberId: sub.id, editionId: sub.editionId, via: reason },
        });
      }
    }
    if (save) await saveSubscriber(next);
  } catch (e) {
    console.error("[free-editions] pause on upgrade failed", e instanceof Error ? e.message : e);
  }
}
