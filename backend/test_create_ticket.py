import requests
import time

# 1. Login as Employee
token_res = requests.post("http://127.0.0.1:8000/auth/login", data={"username": "employee@nsg.com", "password": "password"})
emp_token = token_res.json()["access_token"]

# 2. Create Asset Request
req_res = requests.post("http://127.0.0.1:8000/api/employee-portal/assets/request", json={
    "asset_type": "Laptop",
    "reason": "Test auto resolve",
    "urgency": "Medium"
}, headers={"Authorization": f"Bearer {emp_token}"})
print("Create ticket status:", req_res.status_code)
ticket_data = req_res.json()
print("Ticket created:", ticket_data)

# 3. Login as HR
hr_token_res = requests.post("http://127.0.0.1:8000/auth/login", data={"username": "hr@nsg.com", "password": "password"})
hr_token = hr_token_res.json()["access_token"]

# 4. Fetch tickets
tickets_res = requests.get("http://127.0.0.1:8000/api/hr-portal/tickets", headers={"Authorization": f"Bearer {hr_token}"})
print("Fetch tickets status:", tickets_res.status_code)
tickets = tickets_res.json()
test_ticket = next((t for t in tickets if t["id"] == ticket_data["id"]), None)
print("Ticket status as seen by HR:", test_ticket["status"] if test_ticket else "Not found")
