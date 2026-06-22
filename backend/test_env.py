# test_env.py
from app.config import settings

print("--- 🛠️ BoutiqueHub Config Verification ---")
print(f"Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
print(f"API Key   : {settings.CLOUDINARY_API_KEY}")
print(f"CORS List : {settings.allowed_origins_list}")