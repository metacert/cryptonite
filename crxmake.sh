#!/bin/bash -e
#
# Purpose: Pack a Chromium extension directory into crx format
#
# as seen in http://developer.chrome.com/extensions/crx
CHROME="chrome"
FIREFOX="firefox"
EXTENSION=".crx"
DIR="src"
KEY="signing/key.pem"
MANIFEST="src/manifest.json"
VERSION_EXPR="\"version\": \"\(.*\)\","
CURRENT_VERSION=$(sed -n "s_.*${VERSION_EXPR}_\1_ p" < $MANIFEST)
DS_STORE_FILES=".DS_Store"

dir=$DIR
key=$KEY
name=$(basename "$dir")
crx="metacert-cryptonite-$CURRENT_VERSION-$CHROME$EXTENSION"
pub="$name.pub"
sig="$name.sig"
zip="metacert-cryptonite-$CURRENT_VERSION-$CHROME.zip"
xpiFirefox="metacert-cryptonite-$CURRENT_VERSION-$FIREFOX.xpi"
#trap 'rm -f "$pub" "$sig" "$zip"' EXIT
trap 'rm -f "$pub" "$sig"' EXIT

#delete annoying .DS_Store files
find . -name "$DS_STORE_FILES" -delete

# zip up the crx dir
cwd=$(pwd -P)
(cd "$dir" && zip -qr -9 -X "$cwd/$zip" .)

# signature
openssl sha1 -sha1 -binary -sign "$key" < "$zip" > "$sig"

# public key
openssl rsa -pubout -outform DER < "$key" > "$pub" 2>/dev/null

byte_swap () {
  # Take "abcdefgh" and return it as "ghefcdab"
  echo "${1:6:2}${1:4:2}${1:2:2}${1:0:2}"
}

crmagic_hex="4372 3234" # Cr24
version_hex="0200 0000" # 2
pub_len_hex=$(byte_swap $(printf '%08x\n' $(ls -l "$pub" | awk '{print $5}')))
sig_len_hex=$(byte_swap $(printf '%08x\n' $(ls -l "$sig" | awk '{print $5}')))
(
  echo "$crmagic_hex $version_hex $pub_len_hex $sig_len_hex" | xxd -r -p
  cat "$pub" "$sig" "$zip"
) > "$crx"
echo "Wrote $crx"

# zip up the src dir for Firefox
cwd=$(pwd -P)
(cd "$dir" && zip -qr -9 -X "$cwd/$xpiFirefox" .)
echo "Wrote $xpiFirefox"
