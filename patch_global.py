import sys

with open('src/store/global.ts', 'r') as f:
    content = f.read()

target = 'console.warn("Failed to fetch global data:", error);'
replacement = '// console.warn("Failed to fetch global data:", error); // Suppressed to avoid confusing users when rules are tight'

if target in content:
    content = content.replace(target, replacement)
    with open('src/store/global.ts', 'w') as f:
        f.write(content)
    print("Patched global")
else:
    print("Not found")
