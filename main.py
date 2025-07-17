import os
import json
import http.client
import sys
from dotenv import load_dotenv

load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# Charger la liste des pays
with open("country.json", "r") as f:
    countries = json.load(f)

conn = http.client.HTTPSConnection("streaming-availability.p.rapidapi.com")
headers = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com"
}

# Vérification du paramètre titre
if len(sys.argv) < 2 or not sys.argv[1].strip():
    print("Usage: python main.py <titre_du_film>")
    sys.exit(1)

title = sys.argv[1].strip()

# Vérifier d'abord si le film existe dans un pays de référence (ex: France)
ref_country = "fr"
ref_path = f"/shows/search/title?title={title}&country={ref_country}&output_language=fr"
conn.request("GET", ref_path, headers=headers)
ref_res = conn.getresponse()
ref_data = ref_res.read()
try:
    ref_result = json.loads(ref_data)
except Exception as e:
    print(f"Erreur de parsing JSON lors de la vérification du film : {e}")
    sys.exit(1)
# Correction : gérer le cas où ref_result est une liste
if (isinstance(ref_result, list) and not ref_result) or (isinstance(ref_result, dict) and not ref_result.get("result")):

    print(f"Le film '{title}' n'existe pas ou n'a pas été trouvé dans la base de données.")
    sys.exit(1)

# Si le film existe, on lance la recherche sur tous les pays
for country_code in countries.keys():
    path = f"/shows/search/title?title={title}&country={country_code}&output_language=fr"
    conn.request("GET", path, headers=headers)
    res = conn.getresponse()
    data = res.read()
    try:
        result = json.loads(data)
    except Exception as e:
        print(f"Erreur de parsing JSON pour {country_code}: {e}")
        continue
    # Correction : gérer le cas où result est une liste ou un dict
    found = False
    if isinstance(result, list):
        found = bool(result)
    elif isinstance(result, dict):
        found = bool(result.get("result"))
    if found:
        print(f"Trouvé dans le pays : {country_code} ({countries[country_code]})")
        # print(json.dumps(result, indent=2, ensure_ascii=False))
        break
    else:
        print(f"Aucun résultat pour {country_code} ({countries[country_code]})")
else:
    print(f"Le film '{title}' n'a été trouvé dans aucun des pays testés.")
