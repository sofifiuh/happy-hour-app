import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { remindersOn, setReminders } from "@/components/notify-drawer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { VenueRow } from "@/components/venue-row";
import { distanceKm } from "@/lib/geo";
import { occurrence } from "@/lib/hours";
import { useStore, type Row } from "@/lib/store";

// Saved spots live on the device; no account. Happening-now first.
export function Saved() {
  const { saved, byId, now, location } = useStore();
  const navigate = useNavigate();
  const [remind, setRemind] = useState(remindersOn);

  const rows = useMemo(() => {
    const rank = { live: 0, scheduled: 0, upcoming: 1, none: 2 } as const;
    return saved
      .map((id) => byId(id))
      .filter((v) => v != null)
      .map((venue): Row => ({
        venue,
        occ: occurrence(venue, now),
        km: location && venue.lat != null && venue.lng != null ? distanceKm(location, { lat: venue.lat, lng: venue.lng }) : null,
      }))
      .sort((a, b) => rank[a.occ.status] - rank[b.occ.status]);
  }, [saved, byId, now, location]);

  return (
    <div className="min-h-dvh pb-16">
      <PageHeader title="Saved spots" />
      <main className="px-4">
        <label className="mb-4 flex items-center gap-3 rounded-2xl bg-ink-2 px-4 py-3.5">
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">Happy hour reminders</span>
            <span className="block text-[13px] text-muted-foreground">30 minutes before a saved spot starts</span>
          </span>
          <Switch
            checked={remind}
            onCheckedChange={(on) => {
              setRemind(on);
              setReminders(on);
            }}
          />
        </label>
        {rows.length === 0 ? (
          <EmptyState
            emoji="🤍"
            title="No saved spots yet"
            body="Tap the heart on any spot to keep it here for next time."
            action={<Button onClick={() => navigate("/")}>Find a hang</Button>}
          />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.venue.id}>
                <VenueRow row={r} now={now} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
