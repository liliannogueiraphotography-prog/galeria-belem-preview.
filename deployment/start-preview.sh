#!/bin/sh
set -eu
# Fail closed instead of issuing insecure cookies or broken individual links.
node --input-type=module -e '
 const raw=process.env.APP_ORIGIN;
 try {const u=new URL(raw);if(u.protocol!=="https:"||u.origin!==raw)throw new Error();}
 catch {console.error("Set APP_ORIGIN to the exact HTTPS preview origin before starting.");process.exit(1);}
'
# No public registration, password in source, or credentials in logs.
# No automatic seed on external hosts: provision fictitious accounts privately.
exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port "${PORT:-3000}"
