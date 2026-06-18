import requests

url = "http://127.0.0.1:8000/hr-portal/employees"
headers = {"Content-Type": "application/json"}

# Use user token from db or mock one?
# Wait, this endpoint is protected by:
# current_user: models.User = Depends(security.get_current_user)
# So it needs a valid token.
