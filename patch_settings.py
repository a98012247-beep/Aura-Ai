import sys

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

target1 = "const { memberProfile } = useAuthStore();"
replacement1 = "const { user, memberProfile } = useAuthStore();\n  const navigate = useNavigate();"

target2 = """  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();"""
replacement2 = """  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.uid === 'guest') {
      navigate('/account');
      return;
    }"""

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/pages/Settings.tsx', 'w') as f:
        f.write(content)
    print("Patched Settings.tsx")
else:
    print("Not found")
