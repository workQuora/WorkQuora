#!/bin/bash
# WorkQuora — full live API smoke test against Render backend.
# Run:  bash test_all_apis.sh
# It logs in, then hits every screen's endpoint and prints status + a short shape check.

BASE="https://workquora.onrender.com/api/v1"
EMAIL="swetapandey612@gmail.com"
PASS="@Sweta307"

echo "========================================"
echo " WorkQuora Live API Smoke Test"
echo "========================================"

# 1. LOGIN
echo -e "\n[1] POST /auth/login"
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -z "$TOKEN" ]; then echo "  ❌ LOGIN FAILED"; echo "$LOGIN" | head -c 300; exit 1; fi
echo "  ✅ token received (${#TOKEN} chars)"
AUTH="-H \"Authorization: Bearer $TOKEN\""

hit() {  # $1=method $2=path $3=label $4=extra
  local code shape
  code=$(eval curl -s -o /tmp/resp.json -w '%{http_code}' -X "$1" "\"$BASE$2\"" -H "\"Authorization: Bearer $TOKEN\"" $4)
  shape=$(python3 -c "
import sys,json
try:
  d=json.load(open('/tmp/resp.json'))
  if isinstance(d,dict):
    ks=list(d.keys())
    dd=d.get('data')
    inner='' 
    if isinstance(dd,dict): inner=' data{'+','.join(list(dd.keys())[:6])+'}'
    elif isinstance(dd,list): inner=f' data[list len={len(dd)}]'
    print('keys:'+','.join(ks[:6])+inner)
  elif isinstance(d,list): print(f'[list len={len(d)}]')
except Exception as e: print('non-json/'+str(e)[:40])
" 2>/dev/null)
  printf "  [%s] %-32s %s\n" "$code" "$3" "$shape"
}

echo -e "\n[2] Profile / Home"
hit GET "/profile/me" "profile/me"
hit GET "/auth/me" "auth/me"

echo -e "\n[3] Discover / Geo"
hit GET "/geo/nearby-freelancers?lat=23.25&lng=77.41&radius=25" "geo/nearby-freelancers"

echo -e "\n[4] Wallet"
hit GET "/wallet/balance" "wallet/balance"
hit GET "/wallet/transactions?page=1&limit=20" "wallet/transactions"

echo -e "\n[5] Messages"
hit GET "/messages/conversations" "messages/conversations"

echo -e "\n[6] Notifications"
hit GET "/notifications" "notifications"

echo -e "\n[7] Jobs"
hit GET "/jobs/my-jobs" "jobs/my-jobs"

echo -e "\n[8] Ads"
hit GET "/ads/active" "ads/active"

echo -e "\n[9] KYC"
hit GET "/kyc/status" "kyc/status"

echo -e "\n[10] Geo update-location (PUT)"
hit PUT "/geo/update-location" "geo/update-location" "-H \"Content-Type: application/json\" -d '{\"latitude\":23.25,\"longitude\":77.41,\"city\":\"Bhopal\"}'"

echo -e "\n========================================"
echo " Done. 200 = OK.  4xx/5xx or 'non-json' = investigate."
echo "========================================"
