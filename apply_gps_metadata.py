import os
from PIL import Image
from fractions import Fraction

# Coordinates mapping for our target locations
LOCATIONS = {
    'utrecht': (52.0907, 5.1214),
    'amsterdam': (52.3676, 4.9041),
    'almere': (52.3508, 5.2647),
    'amersfoort': (52.1561, 5.3878),
    'hilversum': (52.2292, 5.1756),
    'bussum': (52.2740, 5.1611),
    'naarden': (52.2952, 5.1616),
    'zeist': (52.0889, 5.2328),
    'maarssen': (52.1417, 5.0417),
    'houten': (52.0286, 5.1700),
    'nieuwegein': (52.0264, 5.0878),
    'amstelveen': (52.3022, 4.8625),
    'diemen': (52.3392, 4.9606),
    'alphen': (52.1289, 4.6603),
    'barneveld': (52.1389, 5.5867),
    'nijkerk': (52.2217, 5.4853),
    'huizen': (52.2989, 5.2536),
    'leusden': (52.1326, 5.4294),
    'baarn': (52.2125, 5.2933),
    'vianen': (51.9930, 5.0933),
}

def dec_to_dms(deg):
    """Convert decimal degrees to (degrees, minutes, seconds) using Fractions."""
    d = int(deg)
    md = abs(deg - d) * 60
    m = int(md)
    sd = (md - m) * 60
    # Use Fraction to handle rational encoding without rounding issues
    return (Fraction(d, 1), Fraction(m, 1), Fraction(int(sd * 100), 100))

def apply_gps_to_image(img_path, lat, lng):
    try:
        img = Image.open(img_path)
        exif = img.getexif()
        
        lat_ref = 'N' if lat >= 0 else 'S'
        lng_ref = 'E' if lng >= 0 else 'W'
        
        lat_dms = dec_to_dms(abs(lat))
        lng_dms = dec_to_dms(abs(lng))
        
        gps_info = {
            1: lat_ref,
            2: lat_dms,
            3: lng_ref,
            4: lng_dms,
        }
        
        # 34853 is the EXIF tag for GPS info
        exif[34853] = gps_info
        
        # Save keeping original format and quality if possible
        img.save(img_path, 'WEBP', exif=exif, quality=90)
        print(f"Applied GPS to {os.path.basename(img_path)}: {lat_ref} {lat}, {lng_ref} {lng}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

def main():
    image_dirs = [
        'public',
        'public/images',
        'public/images/gallery',
        'public/images/seo'
    ]
    
    processed_count = 0
    for directory in image_dirs:
        if not os.path.exists(directory):
            continue
        for file in os.listdir(directory):
            if file.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')):
                file_path = os.path.join(directory, file)
                # Find matching city in filename
                matched_city = None
                filename_lower = file.lower()
                for city in LOCATIONS:
                    if city in filename_lower:
                        matched_city = city
                        break
                
                # Default to Utrecht (our main region) if no specific city matches
                if not matched_city:
                    matched_city = 'utrecht'
                
                lat, lng = LOCATIONS[matched_city]
                apply_gps_to_image(file_path, lat, lng)
                processed_count += 1
                
    print(f"Successfully processed {processed_count} images.")

if __name__ == '__main__':
    main()
