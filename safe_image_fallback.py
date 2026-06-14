import os

def process_directory(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # simple string replacement to inject onError just before src=
                # only if not already present
                lines = content.split('\n')
                new_lines = []
                changed = False
                for line in lines:
                    if '<img ' in line and 'src=' in line and 'onError=' not in line:
                        line = line.replace('src=', 'onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || \'User\')}&background=random`; }} src=')
                        changed = True
                    elif '<img' in line and 'onError=' not in line and 'src=' not in line:
                        # multiline img tag opening
                        line = line.replace('<img', '<img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || \'User\')}&background=random`; }}')
                        changed = True
                    new_lines.append(line)

                if changed:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(new_lines))
                    print(f"Updated {filepath}")

if __name__ == '__main__':
    process_directory('src')
