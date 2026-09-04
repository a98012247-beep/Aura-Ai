import sys

with open('src/pages/Studio.tsx', 'r') as f:
    content = f.read()

target1 = "const { memberProfile } = useAuthStore();"
replacement1 = "const { user, memberProfile } = useAuthStore();"

target2 = """  const handleGenerate = () => {
    if (!isPro) {"""
replacement2 = """  const handleGenerate = () => {
    if (!user || user.uid === 'guest') {
      window.location.href = '/account';
      return;
    }
    if (!isPro) {"""

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/pages/Studio.tsx', 'w') as f:
        f.write(content)
    print("Patched Studio.tsx")
else:
    print("Not found")

