import os
from PIL import Image
from fractions import Fraction
import piexif

def to_deg(value, loc):
    if value < 0:
        loc_value = loc[1]
    elif value > 0:
        loc_value = loc[0]
    else:
        loc_value = ""
    abs_value = abs(value)
    deg = int(abs_value)
    t1 = (abs_value - deg) * 60
    min = int(t1)
    sec = round((t1 - min) * 60, 5)
    return (deg, min, sec, loc_value)

def change_to_rational(number):
    f = abs(number)
    d = int(f)
    m = int((f - d) * 60)
    s = (f - d - m/60) * 3600.0
    return ((d, 1), (m, 1), (int(s * 100), 100))

# Utrecht coordinates
lat = 52.0907
lng = 5.1214

gps_ifd = {
    piexif.GPSIFD.GPSLatitudeRef: "N",
    piexif.GPSIFD.GPSLatitude: change_to_rational(lat),
    piexif.GPSIFD.GPSLongitudeRef: "E",
    piexif.GPSIFD.GPSLongitude: change_to_rational(lng),
}

exif_dict = {"0th": {}, "Exif": {}, "GPS": gps_ifd, "1st": {}}
exif_bytes = piexif.dump(exif_dict)

src_path = "/Users/mac/Downloads/BACKGROUND.jpeg"
out_dir = "/Users/mac/.gemini/antigravity-ide/scratch/autoslutel/public/images/seo"
out_path = os.path.join(out_dir, "autosleutel_specialist_utrecht_amsterdam_background.webp")

os.makedirs(out_dir, exist_ok=True)

if os.path.exists(src_path):
    img = Image.open(src_path)
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    
    img.save(out_path, "WEBP", quality=82, exif=exif_bytes)
    print(f"Successfully converted and saved {out_path} with GPS metadata!")
else:
    print(f"Source file not found at {src_path}")
