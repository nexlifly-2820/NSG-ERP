from sqlalchemy import create_engine, MetaData, Table

DATABASE_URL = "postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
metadata = MetaData()
metadata.reflect(bind=engine)

resignation_table = Table("resignations", metadata, autoload_with=engine)

with engine.connect() as conn:
    conn.execute(resignation_table.delete())
    conn.commit()

print("Successfully deleted all records from the resignations table.")
