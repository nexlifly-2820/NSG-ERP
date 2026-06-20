import requests

token_res = requests.post("http://127.0.0.1:8000/auth/login", data={"username": "vivek1@hnms.com", "password": "password"})
token = token_res.json()["access_token"]

res = requests.post("http://127.0.0.1:8000/api/employee-portal/assets/request", json={
    "asset_type": "Laptop",
    "reason": "kjdskljv",
    "urgency": "Medium"
}, headers={"Authorization": f"Bearer {token}"})

print(res.status_code)
print(res.json())
