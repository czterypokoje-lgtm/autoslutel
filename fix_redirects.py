import os
import glob

directory = 'src'
old_string = 'autodeur-openen'
new_string = 'auto-openen-zonder-sleutel'

for filepath in glob.iglob(f'{directory}/**/*', recursive=True):
    if os.path.isfile(filepath):
        try:
            with open(filepath, 'r') as file:
                content = file.read()
            if old_string in content:
                new_content = content.replace(old_string, new_string)
                with open(filepath, 'w') as file:
                    file.write(new_content)
                print(f"Replaced in {filepath}")
        except Exception as e:
            pass

print("Done replacing autodeur-openen.")
