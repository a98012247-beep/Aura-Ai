#!/bin/bash
awk '
/saveSettings/ { skip = 1 }
skip && /\}/ { skip = 0; next }
!skip { print }
' src/pages/Admin.tsx > src/pages/Admin_new.tsx
mv src/pages/Admin_new.tsx src/pages/Admin.tsx
