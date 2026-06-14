import os

files = [
    r'src/components/ceo/pages/People.jsx',
    r'src/components/hr/modules/messaging/HrMessagingView.jsx',
    r'src/components/tl/Messaging & Meet/messages.module.index.jsx'
]

broken_string = 'src={emp.photo ? http://localhost:8000 : (emp.avatar || https://ui-avatars.com/api/?name=&background=random)}'
fixed_string = 'src={emp.photo ? `http://localhost:8000${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)}'

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content.replace(broken_string, fixed_string)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Fixed backticks and vars in {filepath}')
