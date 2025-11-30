#!/usr/bin/env python3
"""
Bluetooth Diesel Heater Control Script
Uses modern BLE libraries for Arch Linux
"""

import asyncio
import sys
from bleak import BleakClient, BleakScanner

# UUIDs
SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb"
WRITE_CHAR_UUID = "0000fff2-0000-1000-8000-00805f9b34fb"
NOTIFY_CHAR_UUID = "0000fff1-0000-1000-8000-00805f9b34fb"

# Command header (24 bytes)
CMD_HEADER = bytes([
    0x00, 0x02, 0x00, 0x01, 0x00, 0x01, 0x00, 0x0e,
    0x04, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
])

# Commands
COMMANDS = {
    'on': bytes([0x02, 0x0f]),      # start_heat
    'off': bytes([0x01, 0x0e]),     # stop_heat
    'up': bytes([0x03, 0x10]),      # up
    'down': bytes([0x04, 0x11]),    # down
    'status': bytes([0x00, 0x0d]),  # pump_data
}

class HeaterController:
    def __init__(self, address):
        self.address = address
        self.client = None
        self.notifications_received = []

    def notification_handler(self, sender, data):
        """Handle incoming notifications"""
        hex_data = ' '.join(f'{b:02x}' for b in data)
        print(f"\n📨 RX: {hex_data}")
        print(f"   Length: {len(data)} bytes")
        
        # Parse UART frame if it matches pattern
        if len(data) == 26 and data[0] == 0x76 and data[1] == 0x16:
            self.parse_uart_frame(data)
        
        self.notifications_received.append(data)

    def parse_uart_frame(self, data):
        """Parse UART-style frame (76 16 ... format)"""
        try:
            set_temp = data[2]
            heater_state = data[3]
            error_code = data[4]
            on_off = data[5]
            
            states = ['Off', 'Starting', 'Igniting', 'Running', 'Stopping', 
                     'Cool Down', 'Error', 'Idle', 'Standby']
            state_name = states[heater_state] if heater_state < len(states) else f"Unknown ({heater_state})"
            
            print(f"\n🔥 HEATER STATUS:")
            print(f"   Power: {'ON' if on_off else 'OFF'}")
            print(f"   State: {state_name}")
            print(f"   Set Temp: {set_temp}°C")
            if error_code > 0:
                print(f"   ⚠️  Error Code: {error_code}")
        except Exception as e:
            print(f"   Could not parse frame: {e}")

    async def connect(self):
        """Connect to heater"""
        print(f"Connecting to {self.address}...")
        self.client = BleakClient(self.address)
        await self.client.connect()
        print("✓ Connected!")
        
        # Enable notifications
        await self.client.start_notify(NOTIFY_CHAR_UUID, self.notification_handler)
        print("✓ Notifications enabled")

    async def disconnect(self):
        """Disconnect from heater"""
        if self.client and self.client.is_connected:
            await self.client.stop_notify(NOTIFY_CHAR_UUID)
            await self.client.disconnect()
            print("Disconnected")

    async def send_command(self, command_name):
        """Send command to heater"""
        if command_name not in COMMANDS:
            print(f"Unknown command: {command_name}")
            return
        
        if not self.client or not self.client.is_connected:
            print("Not connected!")
            return
        
        command_bytes = CMD_HEADER + COMMANDS[command_name]
        hex_str = ' '.join(f'{b:02x}' for b in command_bytes)
        
        print(f"\n📤 TX: {command_name.upper()}")
        print(f"   {hex_str}")
        
        await self.client.write_gatt_char(WRITE_CHAR_UUID, command_bytes)
        print("✓ Sent")
        
        # Wait for potential response
        await asyncio.sleep(1)

    async def send_custom(self, hex_string):
        """Send custom hex command"""
        if not self.client or not self.client.is_connected:
            print("Not connected!")
            return
        
        try:
            # Parse hex string
            hex_bytes = hex_string.replace(' ', '').replace(',', '')
            command_bytes = bytes.fromhex(hex_bytes)
            
            hex_str = ' '.join(f'{b:02x}' for b in command_bytes)
            print(f"\n📤 TX: CUSTOM")
            print(f"   {hex_str}")
            
            await self.client.write_gatt_char(WRITE_CHAR_UUID, command_bytes)
            print("✓ Sent")
            
            # Wait for potential response
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"Error sending custom command: {e}")


async def scan_for_heater():
    """Scan for heater device"""
    print("Scanning for Bluetooth devices (15 seconds)...")
    print("Make sure the heater is powered on and in range...")
    
    devices = await BleakScanner.discover(timeout=15.0)
    
    heater = None
    print(f"\nFound {len(devices)} devices:")
    for d in devices:
        name = d.name or 'Unknown'
        rssi = d.rssi if hasattr(d, 'rssi') else 'N/A'
        print(f"  {name}: {d.address} (RSSI: {rssi})")
        if d.name and 'heater' in d.name.lower():
            heater = d
            print(f"    ^ Found heater!")
    
    return heater


async def main():
    """Main interactive loop"""
    # Scan for heater
    heater_device = await scan_for_heater()
    
    if not heater_device:
        print("\nHeater not found. Enter MAC address manually:")
        address = input("MAC Address (e.g., AA:BB:CC:DD:EE:FF): ").strip()
        if not address:
            print("No address provided. Exiting.")
            return
    else:
        address = heater_device.address
    
    # Create controller
    controller = HeaterController(address)
    
    try:
        # Connect
        await controller.connect()
        
        # Interactive menu
        while True:
            print("\n" + "="*40)
            print("  Heater Control Menu")
            print("="*40)
            print("1) Turn ON")
            print("2) Turn OFF")
            print("3) Heat UP")
            print("4) Heat DOWN")
            print("5) Request STATUS")
            print("6) Send custom hex")
            print("7) Wait for notifications (10s)")
            print("8) Exit")
            
            choice = input("\nSelect [1-8]: ").strip()
            
            if choice == '1':
                await controller.send_command('on')
            elif choice == '2':
                await controller.send_command('off')
            elif choice == '3':
                await controller.send_command('up')
            elif choice == '4':
                await controller.send_command('down')
            elif choice == '5':
                await controller.send_command('status')
            elif choice == '6':
                hex_input = input("Enter hex (e.g., 76 16 01 00): ").strip()
                await controller.send_custom(hex_input)
            elif choice == '7':
                print("Waiting for notifications...")
                await asyncio.sleep(10)
            elif choice == '8':
                break
            else:
                print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\nInterrupted")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await controller.disconnect()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting...")
