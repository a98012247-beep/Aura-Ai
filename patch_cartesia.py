import sys

with open('src/services/cartesia.ts', 'r') as f:
    content = f.read()

target = 'console.warn("Could not auto sign-in anonymously:", e);'
replacement = '// console.warn("Could not auto sign-in anonymously:", e); // Suppressed since not all users enable anon auth'

if target in content:
    content = content.replace(target, replacement)
    with open('src/services/cartesia.ts', 'w') as f:
        f.write(content)
    print("Patched cartesia")
else:
    print("Not found")
