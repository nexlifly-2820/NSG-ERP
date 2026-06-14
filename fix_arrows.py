import os

files = [
    r'src\components\ceo\pages\Messaging.jsx',
    r'src\components\employee\Messaging.jsx',
    r'src\components\hr\modules\messaging\HrMessagingView.jsx',
    r'src\components\tl\Messaging & Meet\messages.module.index.jsx'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace broken arrow syntax
        new_content = content.replace('= >', '=>')
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")
