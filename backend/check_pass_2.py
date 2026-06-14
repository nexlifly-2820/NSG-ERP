import bcrypt
hash_str = b'$2b$12$0kPKlKQ0W.bG2dt.tp8Iye2pCoRizWM2LRBf/RTWbVNODbV53fAIy'
print("ceo123:", bcrypt.checkpw(b'ceo123', hash_str))
print("password:", bcrypt.checkpw(b'password', hash_str))
print("password123:", bcrypt.checkpw(b'password123', hash_str))
print("admin123:", bcrypt.checkpw(b'admin123', hash_str))
print("admin:", bcrypt.checkpw(b'admin', hash_str))
