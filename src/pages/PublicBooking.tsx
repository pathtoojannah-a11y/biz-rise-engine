import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookingSlot {
  label: string;
  value: string;
}

interface BookingSlotGroup {
  day_label: string;
  date_value: string;
  slots: BookingSlot[];
}

interface BookingSettings {
  duration_minutes: number;
  buffer_minutes: number;
  timezone: string;
  start_time: string;
  end_time: string;
}

interface LoadResponse {
  workspace_name: string;
  workspace_slug: string;
  industry: string | null;
  booking_link: string;
  booking_settings: BookingSettings;
  slot_groups: BookingSlotGroup[];
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function PublicBooking() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [bookingData, setBookingData] = useState<LoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<{ customerName: string; scheduledAt: string } | null>(null);

  useEffect(() => {
    if (!workspaceSlug) {
      setError("Missing booking page.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadBooking = async () => {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke("public-booking", {
        body: { action: "load", slug: workspaceSlug },
      });

      if (cancelled) return;

      if (invokeError) {
        setError(invokeError.message || "Could not load this booking page.");
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setBookingData(data as LoadResponse);
      setLoading(false);
    };

    void loadBooking();

    return () => {
      cancelled = true;
    };
  }, [workspaceSlug]);

  const selectedSlotLabel = (() => {
    if (!selectedSlot || !bookingData) return "";
    for (const group of bookingData.slot_groups) {
      const match = group.slots.find((slot) => slot.value === selectedSlot);
      if (match) return `${group.day_label} at ${match.label}`;
    }
    return "";
  })();

  const handleBook = async () => {
    if (!bookingData) return;
    if (!selectedSlot) {
      setError("Choose a time slot first.");
      return;
    }
    if (!customerName.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!normalizePhone(customerPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke("public-booking", {
      body: {
        action: "create",
        slug: bookingData.workspace_slug,
        customer_name: customerName.trim(),
        customer_phone: normalizePhone(customerPhone),
        scheduled_at: selectedSlot,
      },
    });

    setSaving(false);

    if (invokeError) {
      setError(invokeError.message || "Could not save the booking.");
      return;
    }

    if (data?.error) {
      setError(data.error);
      return;
    }

    setConfirmation({
      customerName: customerName.trim(),
      scheduledAt: selectedSlotLabel,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#ecfdf5_0%,#f8fafc_48%,#f8fafc_100%)] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Card className="border-emerald-100 bg-white/95 shadow-xl shadow-emerald-100/60">
            <CardContent className="flex min-h-[240px] items-center justify-center">
              <div className="flex items-center gap-3 text-slate-700">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                Loading booking page...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !bookingData) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#ecfdf5_0%,#f8fafc_48%,#f8fafc_100%)] px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Card className="border-red-200 bg-white">
            <CardHeader>
              <CardTitle>Booking page unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#ecfdf5_0%,#f8fafc_48%,#f8fafc_100%)] px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] shadow-xl shadow-emerald-100/60">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              NexaOS Booking
            </div>
            <div>
              <CardTitle className="text-4xl tracking-[-0.05em] text-slate-950">{bookingData.workspace_name}</CardTitle>
              <CardDescription className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                Pick the time that works best for your service request. NexaOS will lock it in and send it straight to the business.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Real time slots</p>
                <p className="mt-1 text-sm text-slate-600">Choose an actual appointment time instead of waiting for a callback.</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                <Clock3 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Timezone aware</p>
                <p className="mt-1 text-sm text-slate-600">{bookingData.booking_settings.timezone}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                <Phone className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Fast follow-up</p>
                <p className="mt-1 text-sm text-slate-600">Your booking goes straight into the contractor's NexaOS workflow.</p>
              </div>
            </div>

            {confirmation ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-lg font-semibold text-emerald-950">Booking confirmed</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                      {confirmation.customerName}, you're booked for {confirmation.scheduledAt}. The business will see this in NexaOS right away.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-600">
                  Choose a slot, enter your contact details, and submit the booking in one step.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95 shadow-xl shadow-emerald-100/60">
          <CardHeader>
            <CardTitle className="text-3xl tracking-[-0.04em] text-slate-950">Choose a time</CardTitle>
            <CardDescription className="text-base text-slate-600">
              Appointment length: {bookingData.booking_settings.duration_minutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {bookingData.slot_groups.map((group) => (
                <div key={group.date_value} className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{group.day_label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setSelectedSlot(slot.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selectedSlot === slot.value
                            ? "border-emerald-500 bg-emerald-100 text-emerald-950"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Your name</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone number</Label>
                <Input
                  id="customer-phone"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(formatPhoneInput(event.target.value))}
                  placeholder="(313) 555-1234"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleBook}
                disabled={saving || !!confirmation}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
