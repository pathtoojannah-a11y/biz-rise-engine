export interface BookingWindow {
  key: string;
  label: string;
  range_label: string;
  value: string;
  scheduled_at: string;
}

export interface BookingWindowGroup {
  day_label: string;
  date_value: string;
  windows: BookingWindow[];
}

export interface BookingReplyResult {
  action: "confirm" | "cancel" | "invalid";
  arrivalText: string | null;
}

export function parseBookingConfirmationReply(reply: string): BookingReplyResult {
  const trimmed = reply.trim();
  if (!trimmed) {
    return { action: "invalid", arrivalText: null };
  }

  if (/^cancel$/i.test(trimmed)) {
    return { action: "cancel", arrivalText: null };
  }

  const confirmMatch = trimmed.match(/^confirm(?:\s+(.+))?$/i);
  if (!confirmMatch) {
    return { action: "invalid", arrivalText: null };
  }

  const arrivalText = confirmMatch[1]?.trim() || null;
  return { action: "confirm", arrivalText };
}

export function buildWindowOccupancyMap(scheduledAts: string[]) {
  return scheduledAts.reduce<Record<string, number>>((acc, scheduledAt) => {
    acc[scheduledAt] = (acc[scheduledAt] || 0) + 1;
    return acc;
  }, {});
}

export function filterWindowGroupsByCapacity(
  groups: BookingWindowGroup[],
  occupancyByScheduledAt: Record<string, number>,
  capacityPerWindow = 1,
) {
  return groups
    .map((group) => ({
      ...group,
      windows: group.windows.filter((window) => (occupancyByScheduledAt[window.scheduled_at] || 0) < capacityPerWindow),
    }))
    .filter((group) => group.windows.length > 0);
}
