import os

class Settings:
    @property
    def secret_key(self):
        return os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    @property
    def algorithm(self):
        return os.getenv("ALGORITHM", "HS256")
    
    @property
    def access_token_expire_minutes(self):
        return int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

settings = Settings()