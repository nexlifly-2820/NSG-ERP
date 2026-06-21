import os
from sqlalchemy import create_engine, text
import dotenv

dotenv.load_dotenv('.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    conn.execute(text("DELETE FROM resignations WHERE user_id = 15"))
    conn.commit()
    print("Deleted resignations for user 15")
