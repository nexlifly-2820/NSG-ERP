import os

files = [
    r'src\components\ceo\pages\Messaging.jsx',
    r'src\components\ceo\pages\People.jsx',
    r'src\components\hr\modules\messaging\HrMessagingView.jsx',
    r'src\components\tl\Messaging & Meet\messages.module.index.jsx'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace broken src={emp.avatar} with proper fallback
        new_content = content.replace('src={emp.avatar}', 'src={emp.photo ? `http://localhost:8000${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || \'User\')}&background=random`)}')
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed src={emp.avatar} in {filepath}")
