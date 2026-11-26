#!/usr/bin/env bash
# 측정용 WebView 셸 APK를 Gradle 없이 만든다(aapt2, javac, d8, apksigner). Android SDK와 JDK 17이 있어야 한다.
# 사용: android/webview-shell/build.sh <출력 apk 경로>
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="${1:?출력 apk 경로가 필요하다}"
sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:?ANDROID_HOME이 필요하다}}"
bt="${sdk}/build-tools/$(ls "${sdk}/build-tools" | sort -V | tail -1)"
jar="${sdk}/platforms/$(ls "${sdk}/platforms" | grep -E '^android-[0-9]+$' | sort -V | tail -1)/android.jar"
work="$(mktemp -d)"
trap 'rm -rf "${work}"' EXIT
"${bt}/aapt2" link -o "${work}/base.apk" --manifest "${here}/AndroidManifest.xml" -I "${jar}"
mkdir -p "${work}/classes" "${work}/dex"
javac --release 11 -classpath "${jar}" -d "${work}/classes" $(find "${here}/src" -name '*.java')
"${bt}/d8" --min-api 24 --lib "${jar}" --output "${work}/dex" $(find "${work}/classes" -name '*.class')
(cd "${work}/dex" && zip -q "${work}/base.apk" classes.dex)
"${bt}/zipalign" -f 4 "${work}/base.apk" "${work}/aligned.apk"
keytool -genkeypair -keystore "${work}/debug.jks" -storepass android -keypass android -alias shell \
  -keyalg RSA -validity 2 -dname CN=webview-shell > /dev/null 2>&1
"${bt}/apksigner" sign --ks "${work}/debug.jks" --ks-pass pass:android --out "${out}" "${work}/aligned.apk"
echo "${out}"
