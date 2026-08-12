import sys
from PIL import Image

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 convert.py <input.jpg> <output.webp>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        img = Image.open(input_path)
        img.save(output_path, "WEBP", quality=80)
        print(f"Successfully converted {input_path} to {output_path}")
    except Exception as e:
        print(f"Error converting: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
