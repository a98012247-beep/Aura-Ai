import csv
import json
import sys

def parse_gender(val):
    val = val.lower().strip()
    if 'feminine' in val or 'female' in val: return 'female'
    if 'masculine' in val or 'male' in val: return 'male'
    return 'neutral'

content = sys.stdin.read()
voices = []

reader = csv.DictReader(content.strip().split('\n'))
for row in reader:
    if 'name' not in row or not row['name']: continue
    name = row['name']
    if ' - ' in name:
        name = name.split(' - ')[0]
        
    voice = {
        "id": row['id'],
        "name": name,
        "description": row['description'],
        "language": row['language'],
        "gender": parse_gender(row['gender']),
        "country": row['country'],
        "is_high_quality": str(row.get('is_pro', '')).lower() == 'true',
        "is_public": str(row.get('is_public', '')).lower() == 'true',
        "accents_locales": row.get('locales_accents', ''),
        "age": row.get('age_hint', 'Adult') if row.get('age_hint') else "Adult"
    }
    voices.append(voice)

with open('src/data/voices.json', 'w', encoding='utf-8') as f:
    json.dump(voices, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(voices)} voices.")
