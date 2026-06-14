from app import models, database
from app.core import security
db = database.SessionLocal()
try:
    user = db.query(models.User).filter(models.User.email == "ceo@hnms.com").first()
    print("User found:", user.email)
except Exception as e:
    print("Error:", e)
finally:
    db.close()
