import logging
import sys
from pyngrok import ngrok, conf

# Suppress pyngrok internal logs to make execution cleaner without error spam
logging.getLogger("pyngrok").setLevel(logging.CRITICAL)

# Set the region to India ('in') to reduce latency and avoid connection timeouts
conf.get_default().region = "in"

# Start a tunnel on port 3000 (your Vite frontend port)
# Your auth token is already saved, but we can set it again to be safe
ngrok.set_auth_token('3GECH1P6ZcPRc7RSEoM5SuJptMQ_6oDyMgtKXrmjUoUP9Zv88')

print("Starting ngrok tunnel on port 3000...")
try:
    # Use 127.0.0.1 instead of localhost to prevent slow IPv6 timeouts
    public_url = ngrok.connect("127.0.0.1:3000").public_url

    print("\n" + "="*50)
    print(f"🎉 SUCCESS! Share this link with your friend: \n{public_url}")
    print("="*50 + "\n")

    # Keep the script running so the tunnel stays open
    print("Press Ctrl+C to stop the tunnel.")
    ngrok_process = ngrok.get_ngrok_process()
    ngrok_process.proc.wait()
except KeyboardInterrupt:
    print("\nClosing tunnel...")
    ngrok.kill()
except Exception as e:
    print(f"\nFailed to start ngrok tunnel: {e}")
    sys.exit(1)
