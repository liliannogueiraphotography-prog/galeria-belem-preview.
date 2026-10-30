#!/bin/sh
# Cold backup of the complete private volume, including originals and encryption key.
# Does not send files to a provider or delete any application data.
set -eu
umask 077
if [ "$#" -ne 1 ]; then echo 'Usage: backup.sh /absolute/private/path/backup.tar.gz' >&2; exit 1; fi
case "$1" in /*) ;; *) echo 'Use an absolute private backup path.' >&2; exit 1;; esac
output=$1
if [ -e "$output" ]; then echo 'Destination already exists; choose a new filename.' >&2; exit 1; fi
compose_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
compose() { docker compose --project-directory "$compose_dir" -f "$compose_dir/compose.yml" "$@"; }
compose config --quiet
running=$(compose ps --status running --services)
case "
$running
" in *"
app
"*) ;; *) echo 'The application must be running before the backup starts.' >&2; exit 1;; esac
(set -C; : > "$output")
complete=0
stopped=0
cleanup() {
 if [ "$stopped" -eq 1 ]; then compose start app >&2 || true; fi
 if [ "$complete" -ne 1 ]; then rm -f -- "$output"; fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
stopped=1
compose stop app
compose run --rm --no-deps --entrypoint tar app -czf - -C /var/lib/belem . > "$output"
gzip -t "$output"
complete=1
printf 'Private backup created: %s\n' "$output"

