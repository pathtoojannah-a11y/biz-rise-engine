import { describe, expect, it } from "vitest";
import {
  buildWindowOccupancyMap,
  filterWindowGroupsByCapacity,
  parseBookingConfirmationReply,
} from "@/lib/booking-flow";

describe("booking flow helpers", () => {
  it("parses contractor confirm replies with and without arrival text", () => {
    expect(parseBookingConfirmationReply("CONFIRM")).toEqual({
      action: "confirm",
      arrivalText: null,
    });

    expect(parseBookingConfirmationReply("CONFIRM 10AM")).toEqual({
      action: "confirm",
      arrivalText: "10AM",
    });
  });

  it("parses contractor cancel replies", () => {
    expect(parseBookingConfirmationReply("cancel")).toEqual({
      action: "cancel",
      arrivalText: null,
    });
  });

  it("filters out windows that are already at capacity", () => {
    const groups = [
      {
        day_label: "Monday, Mar 30",
        date_value: "2026-03-30",
        windows: [
          {
            key: "morning",
            label: "Morning",
            range_label: "8am - 12pm",
            value: "2026-03-30:morning",
            scheduled_at: "2026-03-30T12:00:00.000Z",
          },
          {
            key: "afternoon",
            label: "Afternoon",
            range_label: "12pm - 5pm",
            value: "2026-03-30:afternoon",
            scheduled_at: "2026-03-30T16:00:00.000Z",
          },
        ],
      },
    ];

    const occupancy = buildWindowOccupancyMap(["2026-03-30T12:00:00.000Z"]);
    const filtered = filterWindowGroupsByCapacity(groups, occupancy, 1);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].windows).toHaveLength(1);
    expect(filtered[0].windows[0].label).toBe("Afternoon");
  });
});
