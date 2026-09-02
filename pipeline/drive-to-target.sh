#!/bin/bash
# Run discovery + extraction rounds until venues.json reaches a target count.
#
# Between rounds it re-filters the CACHED sweep (--from-raw, zero API calls),
# which drops everything the last round just screened. Only when that cache is
# exhausted does it pay for a fresh sweep — and --text-pages 1 keeps a sweep
# inside the month's free Places quota.
#
# Usage: bash pipeline/drive-to-target.sh <target-total> [budget-per-round]
set -u
cd "$(dirname "$0")/.."
TARGET=${1:?target total required}
BUDGET=${2:-35}
CAP=${3:-950}   # per-SKU Places ceiling for the month; free tier is 1000
LOG=/tmp/drive.log

count() { node -e "console.log(require('./venues.json').venues.length)"; }
# Count candidates the ledger has NOT already answered — the file itself
# stays at its original length after a round, so counting it would hide an
# exhausted pool and skip the sweep that should refill it.
pool()  { node -e "
try {
  const c = require('./pipeline/results/discovered-candidates.json');
  const s = require('./pipeline/screened.json');
  const stored = new Set(require('./venues.json').venues.map(v => v.place_id).filter(Boolean));
  const NEG = new Set(['no_happy_hour', 'hours_only', 'error']);
  console.log(c.filter(x => !(s[x.place_id] && NEG.has(s[x.place_id].verdict)) && !stored.has(x.place_id)).length);
} catch (e) { console.log(0); }"; }

round=0
while :; do
  cur=$(count)
  if [ "$cur" -ge "$TARGET" ]; then echo "TARGET REACHED: $cur venues"; break; fi
  need=$((TARGET - cur))

  # Free: re-apply filters to the cached sweep, dropping the newly screened.
  node pipeline/places-discover.js --from-raw --max 3000 >>"$LOG" 2>&1
  p=$(pool)
  if [ "$p" -lt 20 ]; then
    echo "round $((round+1)): cache down to $p candidates — paying for a fresh sweep"
    # Targeted, not a full re-sweep. The original 110 circles and the ten
    # original query terms are already in places-raw.json; re-running them
    # spends the month's quota re-finding what --from-raw reads for free.
    node pipeline/places-discover.js --max 3000 --text-pages 1 --only-gaps \
      --text-queries "italian restaurant,seafood restaurant,steakhouse" \
      --monthly-cap "$CAP" >>"$LOG" 2>&1
    p=$(pool)
    if [ "$p" -lt 20 ]; then
      echo "SUPPLY EXHAUSTED: $p candidates left, stopping at $cur venues"; break
    fi
  fi

  round=$((round+1))
  echo "=== round $round | $cur venues, need $need more, pool $p ==="
  # Small batches on purpose. Writeback runs per batch, so the batch size is
  # how much work a container restart can cost — and this one has restarted
  # three times mid-round. 25 keeps a batch under the observed uptime.
  node pipeline/daily.js --target "$need" --budget "$BUDGET" --use-pool --batch 25 >>"$LOG" 2>&1
  after=$(count)
  echo "=== round $round done | $cur -> $after venues ==="

  # Commit each round. This container is disposable and has already been
  # restarted mid-round twice; work that exists only on its disk is work that
  # can vanish. Push failures are non-fatal — the next round retries.
  if [ -n "$(git status --porcelain)" ]; then
    # Match the full key shape, not the prefix: a bare prefix appears in
    # guards like this one and would block every commit on itself.
    if git diff -- . ':!pipeline/secrets.json' | grep -qE "AIza[A-Za-z0-9_-]{30,}"; then
      echo "!! refusing to commit: possible API key in the diff"; break
    fi
    git add -A
    git commit -q -m "Discovery round: $cur -> $after venues

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0161uVuVeKr1uRN4QqkzzbQt" || true
    git push -q -u origin "$(git branch --show-current)" 2>/dev/null || echo "  (push failed, will retry next round)"
  fi
  if [ "$after" -le "$cur" ]; then
    echo "NO PROGRESS this round — stopping rather than spinning"; break
  fi
done
echo "FINISHED at $(count) venues after $round rounds"
