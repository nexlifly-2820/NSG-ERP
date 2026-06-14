import os

tl_file = r'src\components\tl\Messaging & Meet\messages.module.index.jsx'
emp_file = r'src\components\employee\Messaging.jsx'

with open(tl_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Make employee-specific changes
new_content = content.replace('tlName', 'empName')
new_content = new_content.replace("'TL (TL)'", "empName")
new_content = new_content.replace("'TL'", "'Employee'")

with open(emp_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Migration script completed!")
