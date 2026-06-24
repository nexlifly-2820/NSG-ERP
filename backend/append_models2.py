with open('app/models.py', 'a') as f:
    f.write("""
class GlobalTemplate(Base):
    __tablename__ = 'global_templates'

    id = Column(Integer, primary_key=True, index=True)
    template_type = Column(String, unique=True, index=True, nullable=False)
    html_content = Column(Text, nullable=False)
""")
