# shellcheck shell=bash
# Pick JDK 17+ for Android Gradle (AGP 8+). Source from android-cli.sh / cap.sh.

android_java_major() {
  local java_bin="$1/bin/java"
  local version_line

  if [[ ! -x "$java_bin" ]]; then
    echo 0
    return
  fi

  version_line="$("$java_bin" -version 2>&1 | head -1)"
  if [[ "$version_line" =~ version\ \"([0-9]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return
  fi

  echo 0
}

configure_java_for_android() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    if [[ "$(android_java_major "$JAVA_HOME")" -ge 17 ]]; then
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  fi

  local candidates=()

  if [[ -d /snap/android-studio ]]; then
    local snap_jbr
    snap_jbr="$(find /snap/android-studio -maxdepth 2 -type d -name jbr 2>/dev/null | sort -V | tail -1)"
    [[ -n "$snap_jbr" ]] && candidates+=("$snap_jbr")
    candidates+=("/snap/android-studio/current/jbr")
  fi

  candidates+=(
    "/usr/lib/jvm/java-21-openjdk-amd64"
    "/usr/lib/jvm/java-17-openjdk-amd64"
    "/usr/lib/jvm/java-17-oracle"
  )

  local jdk
  for jdk in "${candidates[@]}"; do
    if [[ -x "$jdk/bin/java" && "$(android_java_major "$jdk")" -ge 17 ]]; then
      export JAVA_HOME="$jdk"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done

  echo "Android Gradle requires Java 17+. Current: $(java -version 2>&1 | head -1)" >&2
  echo "Install JDK 17: sudo apt install openjdk-17-jdk" >&2
  echo "Or set JAVA_HOME in .env.capacitor.local (Android Studio JBR works):" >&2
  echo "  JAVA_HOME=/snap/android-studio/current/jbr" >&2
  return 1
}
