import requests

BASE_URL = "http://localhost:8000"

# 1. Login to get token
res = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "ceo@hnms.com", "password": "ceo123"},
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Create Project
print("Creating project...")
create_res = requests.post(
    f"{BASE_URL}/ceo-portal/projects",
    json={
        "name": "Test Enterprise ERP",
        "client": "Acme Corp",
        "budget": 500000,
        "used": 100000,
        "status": "Active",
        "deadline": "2026-12-31"
    },
    headers=headers
)
print("Create response:", create_res.status_code, create_res.text)

# 3. Get Projects
print("Fetching projects...")
get_res = requests.get(f"{BASE_URL}/ceo-portal/projects", headers=headers)
print("Get response:", get_res.status_code, len(get_res.json()), "projects found")

# 4. Sign-off Project
if create_res.status_code == 200:
    proj_id = create_res.json()["id"]
    print(f"Signing off project {proj_id}...")
    signoff_res = requests.post(f"{BASE_URL}/ceo-portal/projects/{proj_id}/signoff", headers=headers)
    print("Signoff response:", signoff_res.status_code, signoff_res.text)
