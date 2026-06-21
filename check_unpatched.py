import os
import re

def check_unpatched_modals():
    pattern = re.compile(r'<div[^>]*position:\s*[\'"]fixed[\'"][^>]*>')
    
    unpatched = []
    
    for root, dirs, files in os.walk('src/components'):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                matches = pattern.finditer(content)
                for match in matches:
                    tag = match.group(0)
                    if 'onClick=' not in tag and 'onClick={' not in tag:
                        unpatched.append((filepath, match.start(), tag))
                        
    for up in unpatched:
        print(f"Unpatched: {up[0]} - {up[2]}")

if __name__ == '__main__':
    check_unpatched_modals()
