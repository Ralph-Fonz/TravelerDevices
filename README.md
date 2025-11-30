# TravelerDevices Web

A comprehensive Bluetooth Low Energy (BLE) device management system built with ASP.NET Core 9.0 and Web Bluetooth API. Monitor and control various travel devices including solar chargers, DC-DC converters, battery monitors, switch panels, and diesel heaters.

![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-9.0-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.0-purple)
![Web Bluetooth API](https://img.shields.io/badge/Web%20Bluetooth-API-green)

## 📸 Screenshot

![TravelerDevices Web Interface](screenshot.png)
*Main dashboard showing device list, DC-DC monitoring charts, and diesel heater controls*

## 🌟 Features

### Device Management
- **Bluetooth Device Scanner** - Discover and save BLE devices with custom brands and categories
- **Real-time Monitoring** - Live voltage, current, and power tracking with Chart.js visualizations
- **Device Settings** - Manage device configurations and preferences
- **Brand Management** - Organize devices by manufacturer and category

### Supported Device Categories
- 🔋 **Solar Chargers** - Monitor solar panel output and battery charging
- ⚡ **DC-DC Converters** - Track power conversion and battery statistics
- 🔌 **Battery Monitors** - Real-time battery voltage and current readings
- 🎛️ **Switch Panels** - Control vehicle electrical systems
- 🔥 **Diesel Heaters** - Bluetooth control for Chinese diesel heaters (Hcalory compatible)

### Advanced Tools
- **Bluetooth Traffic Sniffer** - Capture and analyze all BLE communication (TX/RX)
- **Protocol Diagnostic Tool** - Send custom hex commands for protocol discovery
- **Protocol Learning Mode** - Capture and save working commands from official apps
- **Real-time Console Logging** - Dual console system for scan and connection logs

## 🚀 Quick Start

### Prerequisites
- **Linux**: Arch Linux / Manjaro (tested)
- **Runtime**: .NET 9.0 SDK
- **Browser**: Chrome/Edge with Web Bluetooth support
- **Optional**: Python 3 with `bleak` library for command-line testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ralph-Fonz/TravelerDevices.git
   cd TravelerDevices_Web
   ```

2. **Install .NET Runtime** (Arch Linux)
   ```bash
   sudo pacman -S aspnet-runtime dotnet-sdk
   ```

3. **Build the project**
   ```bash
   dotnet build
   ```

4. **Run the application**
   ```bash
   dotnet run
   ```

5. **Open in browser**
   ```
   http://localhost:5057
   ```

### Chrome Configuration (Linux)

Enable Web Bluetooth API flags in Chrome:
```
chrome://flags/#enable-experimental-web-platform-features
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

Add `http://localhost:5057` to the insecure origins whitelist.

## 📱 Supported Devices

### Tested Devices
- **Renogy BT-TH** (DC-DC Charger) - Full support with real-time monitoring
- **Litime BT-LTMPPT2430** (Solar MPPT) - Battery statistics and power tracking
- **Hcalory Heater5174** (Diesel Heater) - Bluetooth control (experimental)
- **Mictuning P1-2LP-12** (Switch Panel) - Connection only (proprietary protocol)

### Protocol Support
- Standard GATT services and characteristics
- Renogy proprietary protocol
- Hcalory heater protocol (24-byte header + 2-byte commands)
- UART-style frames (76 16 format detection)

## 🛠️ Development Tools

### Command-Line Scripts

Located in `/Scripts` directory:

**Python BLE Control** (`heater_ble.py`)
```bash
# Install dependencies
pip install bleak --break-system-packages

# Run interactive heater control
python3 Scripts/heater_ble.py
```

**Features:**
- Device scanning
- Real-time notifications
- Command sending (ON/OFF/UP/DOWN/STATUS)
- Custom hex command testing
- UART frame parsing

**Bash Testing Script** (`test-heater-bluetooth.sh`)
```bash
chmod +x Scripts/test-heater-bluetooth.sh
./Scripts/test-heater-bluetooth.sh
```

Note: Requires `bluez` and `bluez-utils` packages.

## 📊 DC-DC Monitoring

Real-time charts for DC-DC chargers display:
- **Auxiliary Battery Voltage** (median calculation)
- **Starter Battery Voltage** (current reading)
- **Current Flow** (charging/discharging)
- **Power Output** (calculated watts)

Data automatically clears after 50 readings to maintain performance.

## 🔥 Diesel Heater Control

### Hcalory Protocol

**Command Structure:**
- Header: 24 bytes (standard across all commands)
- Command: 2 bytes (specific operation)

**Supported Commands:**
- `01 0e` - Stop heater
- `02 0f` - Start heater
- `03 10` - Temperature up
- `04 11` - Temperature down
- `07 14` - Gear mode
- `05 12` - Thermostat mode
- `00 0d` - Request status (pump_data)

**Status Response Format:**
- 41-byte response with state, mode, voltages, and temperatures
- Automatic parsing of heater state (OFF/IGNITING/RUNNING/ERROR)
- Real-time temperature monitoring (chamber, external, heat exchanger)

### Known Issues
- Heater must be powered ON physically before Bluetooth control works
- No responses when controller is in standby mode
- Protocol Learning Mode required for discovering working commands

## 🗂️ Project Structure

```
TravelerDevices_Web/
├── Pages/
│   ├── BluetoothScanner.cshtml      # Main scanner page
│   ├── DeviceSettings.cshtml        # Device configuration
│   ├── BrandManagement.cshtml       # Brand/category management
│   └── Shared/
│       └── _Layout.cshtml            # Layout with Font Awesome 5
├── wwwroot/
│   ├── js/
│   │   ├── bluetooth-scanner.js     # Core BLE functionality
│   │   ├── device-settings.js       # Settings management
│   │   └── brand-management.js      # Brand CRUD operations
│   └── css/
│       └── site.css                 # Custom styles
├── Scripts/
│   ├── heater_ble.py                # Python BLE control
│   └── test-heater-bluetooth.sh     # Bash testing script
└── Program.cs                       # ASP.NET Core entry point
```

## 💾 Data Persistence

All data stored in browser **LocalStorage**:
- Device list with MAC addresses and metadata
- Brand and category configurations
- Learned Bluetooth commands
- Device settings and preferences

## 🔍 Protocol Discovery

### Using Protocol Learning Mode

1. **Enable Bluetooth Sniffer**
2. **Connect to device** in browser
3. **Use official app** on phone to control device
4. **Watch TX/RX traffic** in sniffer console
5. **Copy successful commands** to Protocol Learning
6. **Save and test** commands later

This method captures proven working commands without guessing protocols.

## 🐛 Troubleshooting

### Web Bluetooth Not Supported
- Use Chrome/Edge/Opera browser
- Enable experimental web platform features flag
- Add localhost to insecure origins whitelist (Linux)

### No Devices Found
- Check Bluetooth is enabled: `rfkill list`
- Unblock Bluetooth: `rfkill unblock bluetooth`
- Restart Bluetooth service: `sudo systemctl restart bluetooth`

### Device Connects But No Data
- Verify device is powered on
- Check device is in operational mode (not standby)
- Try physical controls first, then Bluetooth
- Use Protocol Learning Mode to capture working commands

### Heater Not Responding
- Ensure 12V power is connected
- Turn heater ON using physical buttons first
- Wait for display/fan to activate
- Controller must be running to respond to BLE commands

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Additional device protocol support
- UI/UX improvements
- Protocol documentation
- Bug fixes and optimizations

## 📄 License

This project is open source. See repository for license details.

## 🙏 Acknowledgments

- **evanfoster/hcalory-control** - Hcalory protocol documentation
- **timmchugh11/Chinese-Diesel-Heater---ESPHome** - UART frame format
- **Web Bluetooth Community** - API documentation and examples

## 📞 Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/Ralph-Fonz/TravelerDevices/issues)
- Repository: [TravelerDevices](https://github.com/Ralph-Fonz/TravelerDevices)

---

**Built for travelers, by travelers** 🚐⚡🔥
