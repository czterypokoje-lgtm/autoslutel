import os
import glob

directory = 'src'
replacements = {
    'transponder-sleutel-programmeren': 'transponder-programmeren',
    'contact-reparatie': 'contactslot-reparatie',
    'alarm-programmeren': 'autosleutels-repareren',
    'auto-beveiliging': 'auto-slotenmaker',
    'autoalarm-programmeren': 'auto-slotenmaker',
    'ghost-immobiliser-installeren': 'auto-slotenmaker'
}

for filepath in glob.iglob(f'{directory}/**/*', recursive=True):
    if os.path.isfile(filepath):
        try:
            with open(filepath, 'r') as file:
                content = file.read()
            original_content = content
            for old_str, new_str in replacements.items():
                if old_str in content:
                    content = content.replace(old_str, new_str)
            if original_content != content:
                with open(filepath, 'w') as file:
                    file.write(content)
                print(f"Replaced in {filepath}")
        except Exception as e:
            pass

print("Done replacing other redirects.")
