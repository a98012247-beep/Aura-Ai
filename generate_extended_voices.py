import json
import uuid
import random

names = [
    "Skylar", "Gemma", "Archie", "Baritone", "Sarah", "Ronald", "Jessica", "Katie", "Sterling", "The Alchemist",
    "Oliver", "Emma", "Liam", "Sophia", "Noah", "Isabella", "James", "Mia", "William", "Evelyn",
    "Benjamin", "Harper", "Lucas", "Luna", "Henry", "Ava", "Alexander", "Charlotte", "Sebastian", "Amelia",
    "Jack", "Grace", "Owen", "Chloe", "Theodore", "Aria", "Aiden", "Scarlett", "Samuel", "Lily",
    "Daniel", "Ellie", "Matthew", "Nora", "Joseph", "Hazel", "David", "Zoey", "Wyatt", "Mila",
    "Carter", "Aubrey", "Julian", "Layla", "Leo", "Lillian", "Anthony", "Stella", "Isaac", "Violet",
    "Dylan", "Willow", "Christopher", "Addison", "Joshua", "Lucy", "Andrew", "Bella", "Lincoln", "Camila",
    "Mateo", "Natalie", "Ryan", "Everly", "Nathan", "Aaliyah", "Aaron", "Leah", "Isaiah", "Audrey",
    "Thomas", "Maya", "Charles", "Adeline", "Caleb", "Madeline", "Josiah", "Elena", "Christian", "Kinsley",
    "Hunter", "Alice", "Eli", "Ruby", "Jonathan", "Lydia", "Connor", "Eva", "Landon", "Eliana",
    "Adrian", "Gianna", "Asher", "Ivy", "Cameron", "Quinn", "Jeremiah", "Sadie", "Ezra", "Piper",
    "Colton", "Lydia", "Jordan", "Cora", "Nicholas", "Vivian", "Dominic", "Reagan", "Austin", "Serenity",
    "Robert", "Jade", "Angel", "Brielle", "Ian", "Delilah", "Kevin", "Iris", "Jose", "Eloise",
    "Tyler", "Adalynn", "Brandon", "Adalyn", "Bentley", "Alexandra", "Zachary", "Laila", "Jaxson", "Alana",
    "Jordan", "Amy", "Xavier", "Valerie", "Jason", "Anastasia", "Chase", "Harmony", "Tristan", "Melody",
    "Parker", "Sloane", "Hudson", "Sienna", "Colton", "Summer", "Lincoln", "Autumn", "Bentley", "Skyler"
]

descriptions = [
    "A clear, professional voice for documentaries.",
    "A warm, friendly voice for general narrations.",
    "A deep, authoritative voice for news and politics.",
    "A bright, enthusiastic voice for educational content.",
    "A sophisticated, high-end voice for premium brands.",
    "A soft, gentle voice for wellness and meditation.",
    "A vibrant, expressive voice for creative storytelling.",
    "A reliable, steady voice for corporate presentations.",
    "A cinematic, mysterious voice for trailers.",
    "A friendly, energetic voice for character work."
]

voices = []

# Add the known ones first
known_ids = {
    "Skylar": "631c5530-cad3-4ba9-95a9-3652d4a9918a",
    "The Alchemist": "f1166253-dfa4-436e-9ca2-41130d24f0c7",
    "Sarah": "838e4df9-34ba-4674-89c0-9d0d82846f73",
    "Archie": "71393630-f2ca-49d7-8495-9f5b6f3801f6",
    "Gemma": "c4936d8d-b8d4-42f1-825b-0975e534f59c",
    "Baritone": "0d635c44-598e-4a64-9b5f-97216a3a41e9"
}

for i in range(200):
    name = names[i % len(names)]
    if i >= len(names):
        name = f"{name} {i // len(names) + 1}"
    
    voice_id = known_ids.get(name, str(uuid.uuid4()))
    gender = random.choice(["male", "female", "neutral"])
    country = random.choice(["US", "GB"])
    age = random.choice(["Young", "Middle-Aged", "Old"])
    
    voices.append({
        "id": voice_id,
        "name": name,
        "description": random.choice(descriptions),
        "language": "en",
        "gender": gender,
        "country": country,
        "is_high_quality": True,
        "is_public": True,
        "accents_locales": f"en-{country}",
        "age": age
    })

with open('voices_extended.json', 'w') as f:
    json.dump(voices, f, indent=2)
