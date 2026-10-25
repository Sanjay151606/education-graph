/**
 * engagementService.js
 *
 * Sends derived engagement events to the FastAPI backend via the v2Api client.
 * Only sends { session_id, state, confidence, timestamp } — never raw video.
 */

import v2Api from "./v2_api";

const VALID_STATES = new Set([
  "focused",
  "possibly_confused",
  "possibly_disengaged",
  "no_face",
  "camera_off",
  "unknown",
  // Legacy
  "mild_confusion",
  "lost",
  "disengaged",
]);

/**
 * Post a derived camera engagement event to the backend.
 * Non-fatal — failures are logged but do not interrupt the learning session.
 */
export async function postEngagementEvent({ session_id, state, confidence, timestamp }) {
  if (!VALID_STATES.has(state)) {
    console.warn("[engagementService] Skipping invalid state:", state);
    return;
  }
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    console.warn("[engagementService] Skipping invalid confidence:", confidence);
    return;
  }
  try {
    return await v2Api.postCameraEngagementEvent({ session_id, state, confidence, timestamp });
  } catch (err) {
    console.warn(
      "[engagementService] Failed to post event (non-fatal):",
      err?.response?.status,
      err?.message
    );
  }
}

export default { postEngagementEvent };
