import sys

with open('src/services/cartesia.ts', 'r') as f:
    content = f.read()

target = """  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);"""
replacement = """  const text = await response.text();
  if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
     throw new Error("Received HTML proxy response instead of JSON. Server is likely booting.");
  }
  let data;
  try {
    data = JSON.parse(text);"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/services/cartesia.ts', 'w') as f:
        f.write(content)
    print("Patched fetchVoices")
else:
    print("Not found")
