#!/bin/bash
awk '
/const \[editingMember, setEditingMember\] = useState/ { skip = 1 }
skip && /return \(/ { skip = 0 }
!skip { print }
' src/pages/Admin.tsx > src/pages/Admin_new.tsx
mv src/pages/Admin_new.tsx src/pages/Admin.tsx
