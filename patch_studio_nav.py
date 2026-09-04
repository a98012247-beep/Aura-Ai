import sys

with open('src/pages/Studio.tsx', 'r') as f:
    content = f.read()

target = """    if (!user || user.uid === 'guest') {
      window.location.href = '/account';
      return;
    }"""
replacement = """    if (!user || user.uid === 'guest') {
      navigate('/account');
      return;
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/Studio.tsx', 'w') as f:
        f.write(content)
    print("Patched navigate")
else:
    print("Not found")

