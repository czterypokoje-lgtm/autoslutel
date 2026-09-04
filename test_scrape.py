import urllib.request
from html.parser import HTMLParser

url = "https://a-key-gmbh.com/FBS3-Kit-geeignet-fuer-Mercedes-Benz"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    with open("akey_product.html", "w") as f:
        f.write(html)
    print("Downloaded HTML")
except Exception as e:
    print("Error:", e)
