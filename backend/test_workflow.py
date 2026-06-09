import requests

BASE_URL = "http://localhost:8000"

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core import security

emp_token = security.create_access_token(data={"sub": "emp@hnms.com"})
tl_token = security.create_access_token(data={"sub": "tl@hnms.com"})
hr_token = security.create_access_token(data={"sub": "hr@hnms.com"})

# 2. Submit Expense Claim (Employee)
print("\nSubmitting Expense Claim...")
expense_data = {
    "amount": 1500.0,
    "category": "Travel",
    "receipt_url": "http://example.com/receipt.pdf"
}
res_claim = requests.post(
    f"{BASE_URL}/employee-portal/expenses/claim", 
    headers={"Authorization": f"Bearer {emp_token}"},
    json=expense_data
)
if res_claim.status_code != 201:
    print("Failed to submit claim:", res_claim.text)
    exit(1)
claim_id = res_claim.json()["id"]
print(f"Claim submitted successfully! ID: {claim_id}")

# 3. Approve Expense Claim (TL)
print(f"\nTL Approving Claim {claim_id}...")
res_tl_app = requests.post(
    f"{BASE_URL}/team-lead/expenses/{claim_id}/approve",
    headers={"Authorization": f"Bearer {tl_token}"}
)
if res_tl_app.status_code != 200:
    print("Failed TL approval:", res_tl_app.text)
    exit(1)
print("TL Approved successfully!")

# 4. Approve/Disburse Expense Claim (HR)
print(f"\nHR Approving Claim {claim_id}...")
res_hr_app = requests.post(
    f"{BASE_URL}/hr-portal/payroll/claims/{claim_id}/approve",
    headers={"Authorization": f"Bearer {hr_token}"}
)
if res_hr_app.status_code != 200:
    print("Failed HR approval:", res_hr_app.text)
    exit(1)
print("HR Approved successfully!")

# 5. Verify Payslip generation
print("\nFetching Employee Payslips...")
res_payslips = requests.get(
    f"{BASE_URL}/employee-portal/payroll/my-payslips",
    headers={"Authorization": f"Bearer {emp_token}"}
)
if res_payslips.status_code == 200:
    print("Payslips fetched successfully:")
    for ps in res_payslips.json():
        print(ps)
else:
    print("Failed to fetch payslips:", res_payslips.text)

print("\nVerification Complete!")
