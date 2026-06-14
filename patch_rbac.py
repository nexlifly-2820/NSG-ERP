import re

file_path = r"backend\app\routers\hr_portal.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# For approve leave
content = re.sub(
    r'(def approve_leave_hr.*?verify_hr_role\(current_user\)\n)',
    r'\1    security.check_rbac_permission(db, current_user, "Approve Leaves")\n',
    content,
    flags=re.DOTALL
)

# For reject leave
content = re.sub(
    r'(def reject_leave_hr.*?verify_hr_role\(current_user\)\n)',
    r'\1    security.check_rbac_permission(db, current_user, "Approve Leaves")\n',
    content,
    flags=re.DOTALL
)

# For approve_leave_request
content = re.sub(
    r'(def approve_leave_request.*?verify_hr_role\(current_user\)\n)',
    r'\1    security.check_rbac_permission(db, current_user, "Approve Leaves")\n',
    content,
    flags=re.DOTALL
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied.")
