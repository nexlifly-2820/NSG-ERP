from pydantic import BaseModel
from typing import Optional
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class User(Base):
    __tablename__ = 'test_users'
    id = Column(Integer, primary_key=True)
    name = Column(String)

engine = create_engine('sqlite:///:memory:')
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
db.add(User(id=1, name='Test'))
db.commit()

class UserRes(BaseModel):
    id: int
    name: str
    presence_status: Optional[str] = "offline"
    class Config:
        from_attributes = True

users = db.query(User).all()
for u in users:
    u.presence_status = "wfh"

res = [UserRes.model_validate(u).model_dump() for u in users]
print("Result:")
print(res)
