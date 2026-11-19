import urllib.request
urls = [
    "https://a-key-gmbh.com/XHORSE-Zubehoer",
    "https://a-key-gmbh.com/Zed-FULL-Zubehoer",
    "https://a-key-gmbh.com/Autel-Zubehoer"
]
for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        for line in html.split('\n'):
            if "name=\"description\"" in line:
                print(url.split('/')[-1] + ": " + line.strip())
    except Exception as e:
        print(url, e)
