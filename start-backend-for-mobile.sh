#!/bin/bash
# Start backend server accessible from mobile devices
# This makes the backend listen on all network interfaces (0.0.0.0)

echo ""
echo "========================================"
echo "  PIXEL TALES - MOBILE DEVELOPMENT"
echo "========================================"
echo ""

# Get local IP address
echo "[1/4] Finding your laptop's IP address..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo "✅ Laptop IP: $LOCAL_IP"
echo ""

echo "[2/4] Starting Backend Server..."
cd backend

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

echo ""
echo "========================================"
echo "  MOBILE TESTING INSTRUCTIONS"
echo "========================================"
echo ""
echo "Your backend will be available at:"
echo "  📱 Mobile: http://$LOCAL_IP:8000/api"
echo "  💻 Desktop: http://localhost:8000/api"
echo ""
echo "TO CONNECT YOUR APK:"
echo "1. Build APK normally (./build-mobile.sh)"
echo "2. Install APK on your phone"
echo "3. In the app, tap the logo 5 times"
echo "4. Select 'Custom URL' preset"
echo "5. Enter: http://$LOCAL_IP:8000"
echo "6. Test connection and save"
echo ""
echo "⚠️  IMPORTANT:"
echo "- Phone and laptop must be on SAME WiFi"
echo "- Check firewall settings if connection fails"
echo "- Backend must keep running while testing"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start Django on all interfaces (0.0.0.0)
python manage.py runserver 0.0.0.0:8000
