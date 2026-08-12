import csv
import json
import os

voices = []

def parse_gender(val):
    val = val.lower().strip()
    if 'feminine' in val or 'female' in val: return 'female'
    if 'masculine' in val or 'male' in val: return 'male'
    return 'neutral'

with open('voices_import.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
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
            "is_high_quality": row['is_pro'].lower() == 'true',
            "is_public": row['is_public'].lower() == 'true',
            "accents_locales": row['locales_accents'],
            "age": row['age_hint'] if row['age_hint'] else "Adult"
        }
        voices.append(voice)

with open('src/data/voices.json', 'w', encoding='utf-8') as f:
    json.dump(voices, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(voices)} voices.")
