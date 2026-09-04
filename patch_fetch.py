import sys

with open('src/services/cartesia.ts', 'r') as f:
    content = f.read()

target = "const data = await response.json();"
replacement = """  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON. Status:", response.status, "URL:", response.url);
    console.error("Response preview:", text.substring(0, 200));
    throw e;
  }"""

if target in content:
    with open('src/services/cartesia.ts', 'w') as f:
        f.write(content.replace(target, replacement))
    print('Patched')
else:
    print('Not found')
