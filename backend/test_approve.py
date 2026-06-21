import requests
res_login = requests.post("http://localhost:8000/api/auth/login", data={"username": "johndoe@nsg.com", "password": "password"})
token = res_login.json().get("access_token")
print("Token:", token)

headers = {"Authorization": f"Bearer {token}"}
res = requests.post("http://localhost:8000/hr-portal/exits/resignations/12/approve", headers=headers)
print("Status:", res.status_code)
print("Body:", res.text)
