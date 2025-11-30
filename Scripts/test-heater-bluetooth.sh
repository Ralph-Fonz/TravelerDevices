#!/bin/bash
# Bluetooth Diesel Heater Test Script for Arch Linux
# Tests ON/OFF and Heat Up/Down commands via bluetoothctl and gatttool

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Heater Bluetooth settings
HEATER_NAME="Heater5174"
HEATER_MAC=""
SERVICE_UUID="0000fff0-0000-1000-8000-00805f9b34fb"
WRITE_CHAR_UUID="0000fff2-0000-1000-8000-00805f9b34fb"
NOTIFY_CHAR_UUID="0000fff1-0000-1000-8000-00805f9b34fb"

# Command bytes (Hcalory protocol: 24-byte header + 2-byte command)
CMD_HEADER="00 02 00 01 00 01 00 0e 04 00 00 09 00 00 00 00 00 00 00 00 00 00 00 00"
CMD_ON="01 0e"          # stop_heat (paradoxically named in original)
CMD_OFF="02 0f"         # start_heat
CMD_UP="03 10"          # up
CMD_DOWN="04 11"        # down
CMD_STATUS="00 0d"      # pump_data (request status)

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Bluetooth Diesel Heater Test Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if running as root (needed for some bluetooth operations)
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}Warning: Running as root. This is not recommended.${NC}"
fi

# Check required tools
echo -e "${BLUE}Checking dependencies...${NC}"
MISSING_DEPS=()

if ! command -v bluetoothctl &> /dev/null; then
    MISSING_DEPS+=("bluez bluez-utils")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo -e "${RED}Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    echo -e "${YELLOW}Install with: sudo pacman -S ${MISSING_DEPS[*]}${NC}"
    exit 1
fi

# Check for Python and bleak (modern BLE library)
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 is required${NC}"
    echo -e "${YELLOW}Install with: sudo pacman -S python${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All dependencies found${NC}"
echo ""

# Function to send command via gatttool
send_command() {
    local cmd_name=$1
    local cmd_bytes=$2
    local full_cmd="${CMD_HEADER} ${cmd_bytes}"
    
    echo -e "${YELLOW}Sending: ${cmd_name}${NC}"
    echo -e "${CYAN}Command: ${full_cmd}${NC}"
    
    # Remove spaces for gatttool
    local hex_cmd=$(echo $full_cmd | tr -d ' ')
    
    # Send command using gatttool
    gatttool -b $HEATER_MAC --char-write-req -a 0x000c -n $hex_cmd 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Command sent successfully${NC}"
    else
        echo -e "${RED}✗ Failed to send command${NC}"
    fi
    echo ""
}

# Function to listen for notifications
listen_notifications() {
    echo -e "${BLUE}Listening for notifications (10 seconds)...${NC}"
    timeout 10s gatttool -b $HEATER_MAC --char-read -a 0x000b --listen 2>&1 | while read line; do
        echo -e "${GREEN}📨 Notification: $line${NC}"
    done
    echo ""
}

# Scan for heater
echo -e "${BLUE}Scanning for ${HEATER_NAME}...${NC}"
echo -e "${YELLOW}Make sure Bluetooth is enabled and heater is powered on${NC}"
echo ""

# Enable Bluetooth adapter
sudo rfkill unblock bluetooth
sudo systemctl start bluetooth

# Scan for device
echo "scan on" | timeout 10s bluetoothctl | grep -i "$HEATER_NAME" > /tmp/heater_scan.txt

if [ -s /tmp/heater_scan.txt ]; then
    HEATER_MAC=$(grep -oP '[0-9A-F:]{17}' /tmp/heater_scan.txt | head -1)
    echo -e "${GREEN}✓ Found heater: ${HEATER_MAC}${NC}"
else
    echo -e "${RED}✗ Could not find ${HEATER_NAME}${NC}"
    echo -e "${YELLOW}Attempting to list all Bluetooth devices...${NC}"
    echo "devices" | bluetoothctl | grep "Device"
    echo ""
    read -p "Enter heater MAC address manually (e.g., AA:BB:CC:DD:EE:FF): " HEATER_MAC
    
    if [ -z "$HEATER_MAC" ]; then
        echo -e "${RED}No MAC address provided. Exiting.${NC}"
        exit 1
    fi
fi

echo ""

# Connect to heater
echo -e "${BLUE}Connecting to ${HEATER_MAC}...${NC}"
echo -e "connect ${HEATER_MAC}\nquit" | bluetoothctl

sleep 2

# Check if connected
if bluetoothctl info $HEATER_MAC | grep -q "Connected: yes"; then
    echo -e "${GREEN}✓ Connected successfully${NC}"
else
    echo -e "${RED}✗ Failed to connect${NC}"
    echo -e "${YELLOW}Trying again...${NC}"
    echo -e "connect ${HEATER_MAC}\nquit" | bluetoothctl
    sleep 3
fi

echo ""

# Main menu loop
while true; do
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Heater Control Menu${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "1) Turn ${GREEN}ON${NC} heater"
    echo -e "2) Turn ${RED}OFF${NC} heater"
    echo -e "3) Heat ${YELLOW}UP${NC}"
    echo -e "4) Heat ${BLUE}DOWN${NC}"
    echo -e "5) Request ${CYAN}STATUS${NC}"
    echo -e "6) Listen for notifications (10s)"
    echo -e "7) Send custom hex command"
    echo -e "8) Reconnect"
    echo -e "9) Exit"
    echo ""
    read -p "Select option [1-9]: " option
    
    case $option in
        1)
            send_command "Turn ON" "$CMD_ON"
            ;;
        2)
            send_command "Turn OFF" "$CMD_OFF"
            ;;
        3)
            send_command "Heat UP" "$CMD_UP"
            ;;
        4)
            send_command "Heat DOWN" "$CMD_DOWN"
            ;;
        5)
            send_command "Request Status" "$CMD_STATUS"
            listen_notifications
            ;;
        6)
            listen_notifications
            ;;
        7)
            read -p "Enter hex command (with spaces, e.g., 76 16 01 00): " custom_cmd
            send_command "Custom Command" "$custom_cmd"
            ;;
        8)
            echo -e "${BLUE}Reconnecting...${NC}"
            echo -e "disconnect ${HEATER_MAC}\nquit" | bluetoothctl
            sleep 2
            echo -e "connect ${HEATER_MAC}\nquit" | bluetoothctl
            sleep 2
            ;;
        9)
            echo -e "${BLUE}Disconnecting...${NC}"
            echo -e "disconnect ${HEATER_MAC}\nquit" | bluetoothctl
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    sleep 1
done
