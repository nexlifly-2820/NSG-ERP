
import os
files_to_check = [
    'app/routers/hr_portal.py',
    'app/routers/employee_portal.py',
    'app/routers/ceo_portal.py',
    'app/routers/team_lead.py',
]
for fpath in files_to_check:
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    with open(fpath, 'w', encoding='utf-8') as f:
        for line in lines:
            if 'Paternity' not in line:
                f.write(line)

