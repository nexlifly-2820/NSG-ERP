import os
import re

def process_directory(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Find all <img ... /> tags
                # Add onError attribute if not present
                new_content = re.sub(
                    r'(<img\b[^>]*?)(/?>)',
                    lambda m: m.group(0) if 'onError=' in m.group(1) else f"{m.group(1)} onError={{(e) => {{ e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${{encodeURIComponent(e.target.alt || 'User')}}&background=random`; }}}} {m.group(2)}",
                    content
                )

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

if __name__ == '__main__':
    process_directory('src')
