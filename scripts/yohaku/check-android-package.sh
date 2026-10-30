#!/usr/bin/env bash
# Google Play readiness checks for an Android build output.
#
#   check-android-package.sh apk <app.apk>
#   check-android-package.sh aab <app.aab> <merged AndroidManifest.xml>
#
# Fails when targetSdk is below 36, a 64-bit native library is not aligned for
# 16 KB memory pages, or the package requests a permission Yohaku must not use:
# billing and self-install everywhere, all-files access in the Play build.
# Needs ANDROID_HOME (build-tools) and NDK_HOME (llvm-readelf).
set -euo pipefail

kind=$1
package=$2
build_tools=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
readelf=$(ls "$NDK_HOME"/toolchains/llvm/prebuilt/*/bin/llvm-readelf | head -1)
forbidden=(com.android.vending.BILLING android.permission.REQUEST_INSTALL_PACKAGES)
fail=0
error() {
  echo "::error::$*"
  fail=1
}

if [ "$kind" = apk ]; then
  badging=$("$build_tools/aapt2" dump badging "$package")
  target=$(sed -n "s/.*targetSdkVersion:'\([0-9]*\)'.*/\1/p" <<< "$badging")
  [ "${target:-0}" -ge 36 ] || error "targetSdkVersion is ${target:-unknown}; Google Play requires 36"
  for perm in "${forbidden[@]}"; do
    if grep -q "uses-permission: name='$perm'" <<< "$badging"; then error "requests $perm"; fi
  done
  "$build_tools/zipalign" -c -P 16 4 "$package" > /dev/null || error "not zip-aligned for 16 KB pages"
  lib_prefix=lib
else
  manifest=$3
  target=$(sed -n 's/.*android:targetSdkVersion="\([0-9]*\)".*/\1/p' "$manifest" | head -1)
  [ "${target:-0}" -ge 36 ] || error "targetSdkVersion is ${target:-unknown}; Google Play requires 36"
  for perm in "${forbidden[@]}" android.permission.MANAGE_EXTERNAL_STORAGE; do
    if grep -q "android:name=\"$perm\"" "$manifest"; then error "the Play build requests $perm"; fi
  done
  lib_prefix=base/lib
fi

libs=$(mktemp -d)
unzip -q -o "$package" "$lib_prefix/arm64-v8a/*" "$lib_prefix/x86_64/*" -d "$libs" 2> /dev/null || true
while IFS= read -r so; do
  while read -r align; do
    if ((align < 16384)); then
      error "$(basename "$so") has a LOAD segment aligned to $align bytes; 16 KB pages need 0x4000"
    fi
  done < <("$readelf" -lW "$so" | awk '$1 == "LOAD" { print $NF }')
done < <(find "$libs" -name '*.so')

if [ "$fail" = 0 ]; then echo "$package passed the Google Play checks."; fi
exit "$fail"
