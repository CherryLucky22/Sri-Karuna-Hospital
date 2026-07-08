from pyngrok import ngrok
import time

# Start a tunnel on port 3000 (your Vite frontend port)
# Your auth token is already saved, but we can set it again to be safe
ngrok.set_auth_token('3GECH1P6ZcPRc7RSEoM5SuJptMQ_6oDyMgtKXrmjUoUP9Zv88')

print("Starting ngrok tunnel on port 3000...")
public_url = ngrok.connect(3000).public_url

print("\n" + "="*50)
print(f"🎉 SUCCESS! Share this link with your friend: \n{public_url}")
print("="*50 + "\n")

# Keep the script running so the tunnel stays open
try:
    print("Press Ctrl+C to stop the tunnel.")
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Closing tunnel...")
    ngrok.kill()
