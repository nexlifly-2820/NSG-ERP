from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("UPDATE users SET email = REPLACE(email, '@hmns.com', '@hnms.com');"))
    conn.commit()

print("All emails updated to @hnms.com")
