#!/bin/bash
awk '
/if \(activeTab === .api-keys.\)/ {
    print "      if (activeTab === '\''api-keys'\'') {"
    print "        const firestoreKeys = (await safeFetchDocs('\''platform_api_keys'\'', '\''createdAt'\'', '\''desc'\'')) as PlatformApiKey[];"
    print "        setPlatformApiKeys(firestoreKeys);"
    print "      }"
    in_block = 1;
    brace_count = 1;
    next;
}
in_block {
    if ($0 ~ /\{/) brace_count++;
    if ($0 ~ /\}/) brace_count--;
    if (brace_count == 0) {
        in_block = 0;
    }
    next;
}
{ print }
' src/pages/Admin.tsx > src/pages/Admin_new.tsx
mv src/pages/Admin_new.tsx src/pages/Admin.tsx
