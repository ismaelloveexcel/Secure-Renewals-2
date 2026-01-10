#!/bin/bash
# ============================================
# HR Portal Auto-Start Setup for macOS
# ============================================
#
# This script configures the HR Portal to start automatically
# when macOS starts using a Launch Agent.
#
# Usage: ./scripts/setup-autostart-macos.sh [enable|disable|status]
#
# ============================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.securerenewals.hrportal"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"

echo "============================================"
echo "  HR PORTAL AUTO-START SETUP (macOS)"
echo "============================================"
echo ""
echo "Project Directory: $PROJECT_DIR"
echo ""

# Function to show menu
show_menu() {
    echo "Choose an option:"
    echo ""
    echo "  1. Enable Auto-Start (start portal when macOS starts)"
    echo "  2. Disable Auto-Start (remove from startup)"
    echo "  3. Check Status"
    echo "  4. Test Start Portal Now"
    echo "  5. Exit"
    echo ""
}

# Function to enable auto-start
enable_autostart() {
    echo "Setting up auto-start..."
    echo ""
    
    # Create LaunchAgents directory if it doesn't exist
    mkdir -p "$HOME/Library/LaunchAgents"
    
    # Create the Launch Agent plist
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>${SCRIPT_DIR}/start-portal.sh</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <false/>
    
    <key>StandardOutPath</key>
    <string>${PROJECT_DIR}/logs/portal-stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>${PROJECT_DIR}/logs/portal-stderr.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

    # Create logs directory
    mkdir -p "$PROJECT_DIR/logs"
    
    # Make sure start script is executable
    chmod +x "$SCRIPT_DIR/start-portal.sh"
    
    # Load the Launch Agent
    launchctl load "$PLIST_PATH" 2>/dev/null || true
    
    echo ""
    echo "============================================"
    echo "  AUTO-START ENABLED SUCCESSFULLY!"
    echo "============================================"
    echo ""
    echo "HR Portal will now start automatically when you log in."
    echo ""
    echo "Launch Agent created at:"
    echo "  $PLIST_PATH"
    echo ""
    echo "Logs will be written to:"
    echo "  $PROJECT_DIR/logs/"
    echo ""
    echo "To disable: Run this script again and choose option 2."
    echo ""
}

# Function to disable auto-start
disable_autostart() {
    echo "Removing auto-start..."
    echo ""
    
    # Unload the Launch Agent
    if [ -f "$PLIST_PATH" ]; then
        launchctl unload "$PLIST_PATH" 2>/dev/null || true
        rm "$PLIST_PATH"
        echo "Removed: $PLIST_PATH"
    else
        echo "Launch Agent not found (already disabled)."
    fi
    
    echo ""
    echo "============================================"
    echo "  AUTO-START DISABLED"
    echo "============================================"
    echo ""
    echo "HR Portal will no longer start automatically."
    echo ""
}

# Function to check status
check_status() {
    echo "Checking auto-start status..."
    echo ""
    
    if [ -f "$PLIST_PATH" ]; then
        echo "✅ Auto-start is ENABLED"
        echo ""
        echo "Launch Agent: $PLIST_PATH"
        echo ""
        
        # Check if it's loaded
        if launchctl list | grep -q "$PLIST_NAME"; then
            echo "Status: Currently loaded and active"
        else
            echo "Status: Configured but not currently loaded"
        fi
    else
        echo "❌ Auto-start is DISABLED"
        echo ""
        echo "Run this script and choose option 1 to enable."
    fi
    echo ""
}

# Function to test start
test_start() {
    echo "Starting HR Portal now..."
    echo ""
    "$SCRIPT_DIR/start-portal.sh"
}

# Handle command line argument
if [ -n "$1" ]; then
    case "$1" in
        enable)
            enable_autostart
            exit 0
            ;;
        disable)
            disable_autostart
            exit 0
            ;;
        status)
            check_status
            exit 0
            ;;
        *)
            echo "Usage: $0 [enable|disable|status]"
            exit 1
            ;;
    esac
fi

# Interactive menu
while true; do
    show_menu
    read -p "Enter choice (1-5): " choice
    
    case "$choice" in
        1)
            enable_autostart
            ;;
        2)
            disable_autostart
            ;;
        3)
            check_status
            ;;
        4)
            test_start
            ;;
        5)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please enter 1-5."
            echo ""
            ;;
    esac
done
