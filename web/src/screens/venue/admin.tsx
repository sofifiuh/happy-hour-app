import { ExternalLink, FileText, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, API_URL, session } from "@/lib/api";
import { fmtChecked } from "@/lib/links";
import { spotPath } from "@/lib/routes";
import { Card, ErrorLine, H2, message, SignIn, useMe, VenueShell } from "./shared";

interface Queue {
  claims: {
    id: string;
    venue_id: string;
    venue_name: string;
    venue_phone: string | null;
    venue_website: string | null;
    name: string;
    role: string;
    phone: string | null;
    email: string;
    method: string;
    note: string | null;
    licence: boolean;
    created_at: string;
  }[];
  reports: { id: string; venue_id: string; venue_name: string; message: string; email: string | null; created_at: string }[];
  flagged: { venue_id: string; venue_name: string; flagged: string; updated_at: string }[];
  recent: { venue_id: string; venue_name: string; updated_at: string }[];
}

const day = (iso: string) => fmtChecked(iso.slice(0, 10)) ?? iso.slice(0, 10);

// /venue/admin: claims to decide, guest reports, edits to double-check.
export function VenueAdmin() {
  const { me, state } = useMe();
  const toast = useToast();
  const [q, setQ] = useState<Queue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api<Queue>("GET", "/admin/queue").then(setQ).catch((e) => setError(message(e)));
  }, []);
  useEffect(() => {
    if (me?.admin) load();
  }, [me, load]);

  const act = async (path: string, body: unknown, done: string) => {
    try {
      await api("POST", path, body);
      toast(done);
      load();
    } catch (e) {
      setError(message(e));
    }
  };

  const licence = async (id: string) => {
    const res = await fetch(`${API_URL}/admin/claims/${id}/licence`, { headers: { authorization: `Bearer ${session()}` } });
    if (!res.ok) return setError("Couldn't open the licence");
    window.open(URL.createObjectURL(await res.blob()), "_blank", "noopener");
  };

  if (state === "loading") return <VenueShell title="Review queue"><Skeleton className="h-60 rounded-[22px]" /></VenueShell>;
  if (state === "out") return <VenueShell title="Review queue"><SignIn next="/venue/admin" /></VenueShell>;
  if (!me?.admin) return <VenueShell title="Review queue"><Card>This page is for the A Little Hang team.</Card></VenueShell>;

  return (
    <VenueShell title="Review queue">
      <ErrorLine error={error} />
      {!q ? (
        <Skeleton className="h-60 rounded-[22px]" />
      ) : (
        <>
          <H2 className="mt-2">Claims {q.claims.length > 0 && <Badge size="sm">{q.claims.length}</Badge>}</H2>
          {q.claims.length === 0 && <Card className="text-[15px] text-muted-foreground">Nothing waiting.</Card>}
          <ul className="space-y-3">
            {q.claims.map((c) => (
              <li key={c.id}>
                <Card className="space-y-3">
                  <div>
                    <Link to={spotPath(c.venue_id)} className="font-display text-[18px] font-bold underline-offset-4 hover:underline">
                      {c.venue_name}
                    </Link>
                    <p className="text-[14px]">
                      {c.name}, {c.role} · {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Asked {day(c.created_at)}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.venue_phone && (
                      <a href={`tel:${c.venue_phone}`} className={buttonVariants({ size: "sm", variant: "secondary" })}>
                        <Phone /> Call the venue
                      </a>
                    )}
                    {c.venue_website && (
                      <a href={c.venue_website} target="_blank" rel="noopener" className={buttonVariants({ size: "sm", variant: "secondary" })}>
                        <ExternalLink /> Website
                      </a>
                    )}
                    {c.licence && (
                      <Button size="sm" variant="secondary" onClick={() => licence(c.id)}>
                        <FileText /> Licence
                      </Button>
                    )}
                  </div>
                  <Input placeholder="Note to them (optional, sent if rejected)" value={notes[c.id] ?? ""} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => act(`/admin/claims/${c.id}`, { decision: "approve", note: notes[c.id] }, "Approved")}>Approve</Button>
                    <Button variant="secondary" onClick={() => act(`/admin/claims/${c.id}`, { decision: "reject", note: notes[c.id] }, "Rejected")}>
                      Reject
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <H2>Edits to check {q.flagged.length > 0 && <Badge size="sm">{q.flagged.length}</Badge>}</H2>
          {q.flagged.length === 0 && <Card className="text-[15px] text-muted-foreground">Nothing flagged.</Card>}
          <ul className="space-y-2">
            {q.flagged.map((f) => (
              <li key={f.venue_id}>
                <Card className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/venue/${f.venue_id}`} className="font-semibold underline-offset-4 hover:underline">
                      {f.venue_name}
                    </Link>
                    <p className="text-[13px] text-muted-foreground">{f.flagged}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => act(`/admin/edits/${f.venue_id}/clear`, {}, "Cleared")}>
                    Looks fine
                  </Button>
                </Card>
              </li>
            ))}
          </ul>

          <H2>Guest reports {q.reports.length > 0 && <Badge size="sm">{q.reports.length}</Badge>}</H2>
          {q.reports.length === 0 && <Card className="text-[15px] text-muted-foreground">No open reports.</Card>}
          <ul className="space-y-2">
            {q.reports.map((r) => (
              <li key={r.id}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={spotPath(r.venue_id)} className="font-semibold underline-offset-4 hover:underline">
                        {r.venue_name}
                      </Link>
                      <p className="mt-1 text-[15px] whitespace-pre-line">{r.message}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {day(r.created_at)}
                        {r.email && (
                          <>
                            {" · "}
                            <a href={`mailto:${r.email}`} className="underline underline-offset-4">
                              {r.email}
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => act(`/admin/reports/${r.id}`, {}, "Resolved")}>
                      Done
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {q.recent.length > 0 && (
            <>
              <H2>Recent venue edits</H2>
              <ul className="rounded-[22px] bg-ink-2 px-4">
                {q.recent.map((r) => (
                  <li key={r.venue_id} className="flex min-h-12 items-center justify-between gap-3 border-b border-border text-[14px] last:border-0">
                    <Link to={spotPath(r.venue_id)} className="font-medium">
                      {r.venue_name}
                    </Link>
                    <span className="text-muted-foreground">{day(r.updated_at)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </VenueShell>
  );
}
