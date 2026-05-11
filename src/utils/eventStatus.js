/**
 * Computes event status dynamically from dates.
 * @param {Object} event - Event with `date` and `endDate` (YYYY-MM-DD strings)
 * @returns {"upcoming" | "active" | "past"}
 */
export function getEventStatus(event) {
  const today = new Date().toISOString().split("T")[0];
  if (today < event.date) return "upcoming";
  if (today > event.endDate) return "past";
  return "active";
}
