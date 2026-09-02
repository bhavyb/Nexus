import urllib.request, json

def test_ep(name, url):
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            d = json.loads(r.read())
            print(f"[{r.status}] {name}: success={d.get('success')}")
    except Exception as e:
        print(f"[ERR] {name}: {e}")

test_ep("Status", "http://localhost:5000/api/status")
test_ep("Reverse Geocode (Junagadh)", "http://localhost:5000/api/reverse-geocode?lat=21.5222&lng=70.4579")
test_ep("Mandi Compare (Junagadh 500km)", "http://localhost:5000/api/compare-mandis?crop=Onion&lat=21.5222&lng=70.4579&max_radius=500")
test_ep("Marketplace Listings", "http://localhost:5000/api/listings")
test_ep("Markup Benchmark (Onion)", "http://localhost:5000/api/markup-benchmark?commodity=Onion")
test_ep("Markup Benchmark (Tomato)", "http://localhost:5000/api/markup-benchmark?commodity=Tomato")
test_ep("Markup Benchmark (Wheat)", "http://localhost:5000/api/markup-benchmark?commodity=Wheat")
