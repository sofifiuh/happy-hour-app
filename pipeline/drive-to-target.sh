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
LOG=/tmp/drive.log

count() { node -e "console.log(require('./venues.json').venues.length)"; }
pool()  { node -e "try{console.log(require('./pipeline/results/discovered-candidates.json').length)}catch(e){console.log(0)}"; }

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
    node pipeline/places-discover.js --max 3000 --text-pages 1 >>"$LOG" 2>&1
    p=$(pool)
    if [ "$p" -lt 20 ]; then
      echo "SUPPLY EXHAUSTED: $p candidates left, stopping at $cur venues"; break
    fi
  fi

  round=$((round+1))
  echo "=== round $round | $cur venues, need $need more, pool $p ==="
  node pipeline/daily.js --target "$need" --budget "$BUDGET" --use-pool >>"$LOG" 2>&1
  after=$(count)
  echo "=== round $round done | $cur -> $after venues ==="
  if [ "$after" -le "$cur" ]; then
    echo "NO PROGRESS this round — stopping rather than spinning"; break
  fi
done
echo "FINISHED at $(count) venues after $round rounds"
