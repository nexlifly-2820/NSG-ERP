from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        UPDATE users 
        SET pan_number = 'ABCDE1234F', pf_number = 'MH/BAN/12345/000/54321', uan = '100001234567',
            esi_number = '31001234560001001', location = 'Bangalore', bank_name = 'HDFC Bank', 
            account_number = '50100123456789'
        WHERE email = 'employee@nsg.com' OR role = 'employee';
    """))
    conn.execute(text("""
        UPDATE payslips 
        SET worked_days = 22, arrear_days = 0, lop_days = 1
        WHERE user_id IN (SELECT id FROM users WHERE email = 'employee@nsg.com' OR role = 'employee');
    """))
    conn.commit()
    print('Mock data inserted.')
