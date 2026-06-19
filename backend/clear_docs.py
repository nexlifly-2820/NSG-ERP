from app.database import SessionLocal
from app.models import User
import json

db = SessionLocal()
users = db.query(User).all()
cleaned = 0
for u in users:
    if u.documents:
        try:
            docs = json.loads(u.documents)
            filtered_docs = [d for d in docs if d.get('name') not in ('aadhaar_verify.pdf', 'bachelors_degree.pdf')]
            if len(filtered_docs) != len(docs):
                u.documents = json.dumps(filtered_docs)
                cleaned += 1
        except Exception as e:
            print(f"Error parsing user {u.id}: {e}")

db.commit()
db.close()
print(f"Successfully cleaned dummy documents for {cleaned} users.")
