#!/bin/bash
set -euo pipefail

BASE_URL="http://127.0.0.1:5002/tybeb-staging/us-central1"

http_check() {
  local name="$1"; shift
  local endpoint="$1"; shift
  local data="$1"; shift
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/$endpoint" -H 'Content-Type: application/json' -d "$data" || true)
  if [[ "$code" == "200" ]]; then
    echo "[PASS] $name ($endpoint) => $code"
  else
    echo "[FAIL] $name ($endpoint) => $code"
    return 1
  fi
}

echo "== HTTP checks =="
http_check "reportError" "reportError" '{"message":"smoke","platform":"web","appVersion":"0.0.0","environment":"development"}'
http_check "trackUserSession" "trackUserSession" '{"userId":"u1","sessionId":"s1","action":"start","platform":"web","appVersion":"0.0.0"}'
http_check "trackAnalyticsEvent" "trackAnalyticsEvent" '{"event":"smoke_event","platform":"web","appVersion":"0.0.0"}'

echo "== Firestore trigger proof =="
pushd functions >/dev/null
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 node - <<'NODE'
const admin=require('firebase-admin');admin.initializeApp({projectId:'tybeb-staging'});
const db=admin.firestore();
(async()=>{
  const fid='fsmoke', pid='psmoke', cid='csmoke', tid='tsmoke';
  await db.doc(`families/${fid}`).set({ parentIds:[pid], memberIds:[cid], counters:{ pendingTasks:1, completedTasks:0, totalPointsAwarded:0 } });
  await db.doc(`families/${fid}/members/${cid}`).set({ points:0, totalPointsEarned:0, tasksCompleted:0 });
  await db.doc(`families/${fid}/tasks/${tid}`).set({ status:'created', photoValidationStatus:'pending', assignedTo:cid, rewardPoints:5, photoValidatedBy:pid });
  await db.doc(`families/${fid}/tasks/${tid}`).update({ status:'completed', photoValidationStatus:'approved' });
  await new Promise(r=>setTimeout(r,2000));
  const fam=await db.doc(`families/${fid}`).get();
  const mem=await db.doc(`families/${fid}/members/${cid}`).get();
  const task=await db.doc(`families/${fid}/tasks/${tid}`).get();
  const ok = fam.exists && mem.exists && task.exists &&
    fam.data().counters.completedTasks===1 && task.data().pointsAwarded===5 && mem.data().points===5;
  console.log(ok?"[PASS] firestore trigger updated docs":"[FAIL] firestore trigger missing expected updates");
})();
NODE
popd >/dev/null

echo "== Storage note =="
echo "[NOTE] Storage finalize trigger runs; signed URL generation may fail without service account in emulator."
