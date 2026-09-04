import sys

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

target = "import { useAuthStore } from '../store/auth';"
replacement = "import { useAuthStore } from '../store/auth';\nimport { useNavigate } from 'react-router';"

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/Settings.tsx', 'w') as f:
        f.write(content)
    print("Patched import")
else:
    print("Not found")
