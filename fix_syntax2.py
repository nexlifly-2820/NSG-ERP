import os

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The broken pattern is `} }} }}>` (5 brackets)
    # The correct pattern is `} } } }>` (4 brackets)
    if '} }} }}>' in content:
        new_content = content.replace('} }} }}>', '} } } }>')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed 5-bracket issue in {filepath}")

if __name__ == '__main__':
    for root, dirs, files in os.walk('src/components'):
        for file in files:
            if file.endswith('.jsx'):
                process_file(os.path.join(root, file))
