#!/bin/bash
awk '
/const checkIsAdmin =/ {
    print
    in_block = 1
    next
}
in_block {
    print
    if (/return false;/) {
        print "  };"
        in_block = 2
        next
    }
    if (in_block == 1) {
        next
    }
}
in_block == 2 {
    if (/^\s+\}/) next
    if (/const keys = loadStoredKeys/) next
    if (/res\.json\(\{ success: true, keys \}\)/) next
    if (/^\s+\}\);/) {
        in_block = 3
        next
    }
    next
}
in_block == 3 {
    if (/^\s+\}/) next
    if (/req\.body/) {
        in_block = 0
        next
    }
    next
}
!in_block { print }
' server.ts > server_new.ts
mv server_new.ts server.ts
