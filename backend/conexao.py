import os
from dotenv import load_dotenv
from supabase.client import ClientOptions
from supabase import create_client, Client

load_dotenv()
url= os.getenv("SUPABASE-URL")
key=os.getenv("SUPABASE-KEY")


options = ClientOptions(
    postgrest_client_timeout=30,  # Tempo limite em segundos
)
supabase: Client = create_client(url, key, options=options)
