export CSC_LINK=$(cat ./scripts/secrets/csc.b64)
export CSC_KEY_PASSWORD="Loveyouall123"
export API_KEY_ID="JD348FXHMN"
export API_KEY_ISSUER_ID=""

export GH_TOKEN="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"
export ADBLOCK=true

echo "Building..."

yarn build:desktop

echo "Notarizing..."

mkdir -p ~/private_keys/
cat ./scripts/secrets/AuthKey_$API_KEY_ID.b64 > ~/private_keys/AuthKey_$API_KEY_ID.p8

echo "Building & releasing electrong app..."

electron-builder --mac --publish always 