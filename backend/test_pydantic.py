from app.routers.team_lead import UserProfileResponse

class DummyUser:
    def __init__(self):
        self.id = 1
        self.name = "Test"
        self.email = "test@test.com"
        self.role = "tl"
        self.department = "IT"
        self.designation = "Dev"
        self.is_active = True
        self.join_date = None
        self.phone = None
        self.photo = None
        self.status = "active"
        self.manager = "None"
        self.shift_timing = "9 to 5"
        self.presence_status = "wfh"

d = DummyUser()
try:
    print(UserProfileResponse.model_validate(d).model_dump())
except Exception as e:
    print("Error:", e)
