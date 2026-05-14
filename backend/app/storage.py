import os
from typing import Optional
from app.supabase_client import supabase
from app.config import settings

class SupabaseStorage:
    def __init__(self, bucket_name: str = settings.SUPABASE_BUCKET):
        self.bucket_name = bucket_name

    def upload_file(self, file_path: str, destination_path: str) -> Optional[str]:
        try:
            with open(file_path, 'rb') as f:
                supabase.storage.from_(self.bucket_name).upload(
                    path=destination_path,
                    file=f,
                    file_options={"upsert": "true"}
                )
            response = supabase.storage.from_(self.bucket_name).get_public_url(destination_path)
            return response
        except Exception as e:
            print(f"Error uploading file to Supabase: {e}")
            return None

    def delete_file(self, file_path: str) -> bool:
        try:
            supabase.storage.from_(self.bucket_name).remove([file_path])
            return True
        except Exception as e:
            print(f"Error deleting file from Supabase: {e}")
            return False

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        try:
            response = supabase.storage.from_(self.bucket_name).create_signed_url(file_path, expires_in)
            return response.get("signedURL")
        except Exception as e:
            print(f"Error generating signed URL: {e}")
            return None

storage = SupabaseStorage()
