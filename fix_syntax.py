import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The broken pattern ends with `} }>`
    # e.g., onClick={(e) => { if (e.target === e.currentTarget) { { setIsRequestOpen(false); } }}>
    # It should be onClick={(e) => { if (e.target === e.currentTarget) { { setIsRequestOpen(false); } }}}>
    
    # Let's fix anywhere that has:
    # onClick={(e) => { if (e.target === e.currentTarget) { { ... } }}>
    
    pattern = re.compile(r'(onClick=\{\(e\)\s*=>\s*\{\s*if\s*\(e\.target\s*===\s*e\.currentTarget\)\s*\{\s*\{[^}]+(?:}[^}]+)*\s*\}\s*)\}\>')
    
    new_content, count = pattern.subn(r'\1} }}>', content)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {count} instances in {filepath}")

if __name__ == '__main__':
    for root, dirs, files in os.walk('src/components'):
        for file in files:
            if file.endswith('.jsx'):
                process_file(os.path.join(root, file))
