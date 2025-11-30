// Bluetooth Scanner Application
// Manages Bluetooth device scanning, storage, and connections

class BluetoothDeviceManager {
    constructor() {
        // Default brands and categories
        this.defaultBrands = ['Renogy', 'Redarch', 'Litime', 'MicTuning'];
        this.defaultCategories = ['Solar', 'Batteries', 'Dc to Dc Chargers', 'Switch Panel'];
        
        // Initialize storage
        this.initializeStorage();
        
        // UI Elements
        this.scanBtn = document.getElementById('scanBtn');
        this.clearStorageBtn = document.getElementById('clearStorageBtn');
        this.deviceList = document.getElementById('deviceList');
        this.scanConsole = document.getElementById('scanConsole');
        this.connectionConsole = document.getElementById('connectionConsole');
        this.bluetoothStatus = document.getElementById('bluetoothStatus');
        
        // Console controls
        this.clearScanConsoleBtn = document.getElementById('clearScanConsoleBtn');
        this.clearConnectionConsoleBtn = document.getElementById('clearConnectionConsoleBtn');
        this.copyScanConsoleBtn = document.getElementById('copyScanConsoleBtn');
        this.copyConnectionConsoleBtn = document.getElementById('copyConnectionConsoleBtn');
        this.checkCompatibilityBtn = document.getElementById('checkCompatibilityBtn');
        this.clearGraphBtn = document.getElementById('clearGraphBtn');
        
        // Heater controls
        this.heaterOnBtn = document.getElementById('heaterOnBtn');
        this.heaterOffBtn = document.getElementById('heaterOffBtn');
        this.blowerOnBtn = document.getElementById('blowerOnBtn');
        this.blowerOffBtn = document.getElementById('blowerOffBtn');
        this.heaterPrimeBtn = document.getElementById('heaterPrimeBtn');
        this.heaterLevel1Btn = document.getElementById('heaterLevel1Btn');
        this.heaterLevel2Btn = document.getElementById('heaterLevel2Btn');
        this.heaterLevel3Btn = document.getElementById('heaterLevel3Btn');
        this.heaterSetTempBtn = document.getElementById('heaterSetTempBtn');
        this.heaterTempInput = document.getElementById('heaterTempInput');
        this.customHexInput = document.getElementById('customHexInput');
        this.sendCustomHexBtn = document.getElementById('sendCustomHexBtn');
        
        // Active device and connection
        this.selectedDevice = null;
        this.activeConnection = null;
        this.heaterCharacteristic = null; // For heater write characteristic
        
        // Monitoring data
        this.monitoringData = {
            aux: { voltage: [], current: [], power: [] },
            starter: { voltage: [], current: [], power: [] },
            timestamps: []
        };
        this.maxDataPoints = 50; // Keep last 50 readings
        
        // Initialize charts
        this.initializeCharts();
        
        // Initialize
        this.setupEventListeners();
        this.loadDevices();
        this.checkBluetoothSupport();
    }
    
    // Initialize local storage with defaults
    initializeStorage() {
        if (!localStorage.getItem('btDevices')) {
            localStorage.setItem('btDevices', JSON.stringify({}));
        }
        if (!localStorage.getItem('brands')) {
            localStorage.setItem('brands', JSON.stringify(this.defaultBrands));
        }
        if (!localStorage.getItem('categories')) {
            localStorage.setItem('categories', JSON.stringify(this.defaultCategories));
        }
    }
    
    // Check if Web Bluetooth API is supported
    async checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            this.updateStatus('Not Supported', 'danger');
            this.logToScanConsole('ERROR: Web Bluetooth API is not supported in this browser.', 'danger');
            this.logToScanConsole('Please use Chrome, Edge, or Opera on desktop, or Chrome on Android.', 'warning');
            this.logToScanConsole('Current URL: ' + window.location.href, 'info');
            this.logToScanConsole('Is Secure Context: ' + window.isSecureContext, 'info');
            this.scanBtn.disabled = true;
        } else {
            this.updateStatus('Ready', 'success');
            this.logToScanConsole('Bluetooth API is available and ready.', 'success');
            this.logToScanConsole('Current URL: ' + window.location.href, 'info');
            this.logToScanConsole('Is Secure Context: ' + window.isSecureContext, 'info');
            
            // Check availability
            try {
                const available = await navigator.bluetooth.getAvailability();
                this.logToScanConsole('Bluetooth Adapter Available: ' + available, available ? 'success' : 'warning');
                if (!available) {
                    this.logToScanConsole('No Bluetooth adapter detected on your system.', 'warning');
                }
            } catch (error) {
                this.logToScanConsole('Could not check Bluetooth availability: ' + error.message, 'warning');
            }
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        this.scanBtn.addEventListener('click', () => this.scanForDevices());
        this.clearStorageBtn.addEventListener('click', () => this.clearAllStorage());
        this.checkCompatibilityBtn.addEventListener('click', () => this.runCompatibilityCheck());
        this.clearScanConsoleBtn.addEventListener('click', () => this.clearScanConsole());
        this.clearConnectionConsoleBtn.addEventListener('click', () => this.clearConnectionConsole());
        this.copyScanConsoleBtn.addEventListener('click', () => this.copyScanConsole());
        this.copyConnectionConsoleBtn.addEventListener('click', () => this.copyConnectionConsole());
        this.clearGraphBtn.addEventListener('click', () => this.clearGraphData());
        
        // Heater control event listeners
        this.heaterOnBtn.addEventListener('click', () => this.sendHeaterCommand('on'));
        this.heaterOffBtn.addEventListener('click', () => this.sendHeaterCommand('off'));
        this.blowerOnBtn.addEventListener('click', () => this.sendHeaterCommand('blower_on'));
        this.blowerOffBtn.addEventListener('click', () => this.sendHeaterCommand('blower_off'));
        this.heaterPrimeBtn.addEventListener('click', () => this.sendHeaterCommand('prime'));
        this.heaterLevel1Btn.addEventListener('click', () => this.sendHeaterCommand('level1'));
        this.heaterLevel2Btn.addEventListener('click', () => this.sendHeaterCommand('level2'));
        this.heaterLevel3Btn.addEventListener('click', () => this.sendHeaterCommand('level3'));
        this.heaterSetTempBtn.addEventListener('click', () => this.setHeaterTemperature());
        this.sendCustomHexBtn.addEventListener('click', () => this.sendCustomHexCommand());
    }
    
    // Update status badge
    updateStatus(text, type = 'secondary') {
        this.bluetoothStatus.className = `ms-3 badge bg-${type}`;
        this.bluetoothStatus.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
    }
    
    // Log to scan console
    logToScanConsole(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorClass = {
            'success': 'text-success',
            'danger': 'text-danger',
            'warning': 'text-warning',
            'info': 'text-info',
            'primary': 'text-primary'
        }[type] || 'text-light';
        
        const logEntry = document.createElement('div');
        logEntry.className = colorClass;
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        this.scanConsole.appendChild(logEntry);
        this.scanConsole.scrollTop = this.scanConsole.scrollHeight;
    }
    
    // Log to connection console
    logToConnectionConsole(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorClass = {
            'success': 'text-success',
            'danger': 'text-danger',
            'warning': 'text-warning',
            'info': 'text-info',
            'primary': 'text-primary'
        }[type] || 'text-light';
        
        const logEntry = document.createElement('div');
        logEntry.className = colorClass;
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        this.connectionConsole.appendChild(logEntry);
        this.connectionConsole.scrollTop = this.connectionConsole.scrollHeight;
    }
    
    // Clear consoles
    clearScanConsole() {
        this.scanConsole.innerHTML = '<div class="text-success">Console cleared.</div>';
    }
    
    clearConnectionConsole() {
        this.connectionConsole.innerHTML = '<div class="text-info">Console cleared.</div>';
    }
    
    // Copy scan console to clipboard
    async copyScanConsole() {
        try {
            const text = this.scanConsole.innerText;
            await navigator.clipboard.writeText(text);
            
            // Show success feedback
            const originalHtml = this.copyScanConsoleBtn.innerHTML;
            this.copyScanConsoleBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.copyScanConsoleBtn.classList.add('btn-success');
            this.copyScanConsoleBtn.classList.remove('btn-outline-light');
            
            setTimeout(() => {
                this.copyScanConsoleBtn.innerHTML = originalHtml;
                this.copyScanConsoleBtn.classList.remove('btn-success');
                this.copyScanConsoleBtn.classList.add('btn-outline-light');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy scan console:', error);
            alert('Failed to copy to clipboard. Please try again.');
        }
    }
    
    // Copy connection console to clipboard
    async copyConnectionConsole() {
        try {
            const text = this.connectionConsole.innerText;
            await navigator.clipboard.writeText(text);
            
            // Show success feedback
            const originalHtml = this.copyConnectionConsoleBtn.innerHTML;
            this.copyConnectionConsoleBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.copyConnectionConsoleBtn.classList.add('btn-success');
            this.copyConnectionConsoleBtn.classList.remove('btn-outline-light');
            
            setTimeout(() => {
                this.copyConnectionConsoleBtn.innerHTML = originalHtml;
                this.copyConnectionConsoleBtn.classList.remove('btn-success');
                this.copyConnectionConsoleBtn.classList.add('btn-outline-light');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy connection console:', error);
            alert('Failed to copy to clipboard. Please try again.');
        }
    }
    
    // Initialize Chart.js charts
    initializeCharts() {
        const chartConfig = (label, borderColor, backgroundColor) => ({
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Auxiliary',
                    data: [],
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 2
                }, {
                    label: 'Starter',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: false,
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        this.voltageChart = new Chart(
            document.getElementById('voltageChart').getContext('2d'),
            chartConfig('Voltage (V)', '#007bff', 'rgba(0, 123, 255, 0.1)')
        );
        
        this.currentChart = new Chart(
            document.getElementById('currentChart').getContext('2d'),
            chartConfig('Current (A)', '#ffc107', 'rgba(255, 193, 7, 0.1)')
        );
        
        this.powerChart = new Chart(
            document.getElementById('powerChart').getContext('2d'),
            chartConfig('Power (W)', '#dc3545', 'rgba(220, 53, 69, 0.1)')
        );
    }
    
    // Update monitoring data and charts
    updateMonitoringData(battery, voltage, current) {
        // Check if connected device is a DC-DC Charger
        if (this.activeConnection && this.activeConnection.deviceInfo) {
            const deviceCategory = this.activeConnection.deviceInfo.category || '';
            if (deviceCategory !== 'Dc to Dc Chargers') {
                // Don't update monitoring for non DC-DC charger devices
                return;
            }
        }
        
        const now = new Date().toLocaleTimeString();
        
        // Add timestamp if needed
        if (this.monitoringData.timestamps.length === 0 || 
            this.monitoringData.timestamps[this.monitoringData.timestamps.length - 1] !== now) {
            this.monitoringData.timestamps.push(now);
            
            // Trim to max data points
            if (this.monitoringData.timestamps.length > this.maxDataPoints) {
                this.monitoringData.timestamps.shift();
            }
        }
        
        // Update data
        if (voltage !== null) {
            this.monitoringData[battery].voltage.push(voltage);
            if (this.monitoringData[battery].voltage.length > this.maxDataPoints) {
                this.monitoringData[battery].voltage.shift();
            }
        }
        
        if (current !== null) {
            this.monitoringData[battery].current.push(current);
            if (this.monitoringData[battery].current.length > this.maxDataPoints) {
                this.monitoringData[battery].current.shift();
            }
        }
        
        // Calculate power if we have both voltage and current
        if (voltage !== null && current !== null) {
            const power = voltage * current;
            this.monitoringData[battery].power.push(power);
            if (this.monitoringData[battery].power.length > this.maxDataPoints) {
                this.monitoringData[battery].power.shift();
            }
        }
        
        // Update display cards with median values
        if (battery === 'aux') {
            if (voltage !== null) {
                const medianVoltage = this.calculateMedian(this.monitoringData[battery].voltage);
                document.getElementById('auxVoltage').textContent = medianVoltage.toFixed(2) + 'V';
            }
            if (current !== null) {
                const medianCurrent = this.calculateMedian(this.monitoringData[battery].current);
                document.getElementById('auxCurrent').textContent = medianCurrent.toFixed(2) + 'A';
            }
        } else if (battery === 'starter') {
            if (voltage !== null) {
                document.getElementById('starterVoltage').textContent = voltage.toFixed(2) + 'V';
            }
            if (current !== null) {
                document.getElementById('starterCurrent').textContent = current.toFixed(2) + 'A';
            }
        }
        
        // Update charts
        this.updateCharts();
    }
    
    // Calculate median from array of numbers
    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        if (arr.length === 1) return arr[0];
        
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }
    
    // Update all charts with current data
    updateCharts() {
        // Update voltage chart
        this.voltageChart.data.labels = this.monitoringData.timestamps;
        this.voltageChart.data.datasets[0].data = this.monitoringData.aux.voltage;
        this.voltageChart.data.datasets[1].data = this.monitoringData.starter.voltage;
        this.voltageChart.update();
        
        // Update current chart
        this.currentChart.data.labels = this.monitoringData.timestamps;
        this.currentChart.data.datasets[0].data = this.monitoringData.aux.current;
        this.currentChart.data.datasets[1].data = this.monitoringData.starter.current;
        this.currentChart.update();
        
        // Update power chart
        this.powerChart.data.labels = this.monitoringData.timestamps;
        this.powerChart.data.datasets[0].data = this.monitoringData.aux.power;
        this.powerChart.data.datasets[1].data = this.monitoringData.starter.power;
        this.powerChart.update();
    }
    
    // Clear graph data
    clearGraphData() {
        this.monitoringData = {
            aux: { voltage: [], current: [], power: [] },
            starter: { voltage: [], current: [], power: [] },
            timestamps: []
        };
        
        document.getElementById('auxVoltage').textContent = '--.-V';
        document.getElementById('auxCurrent').textContent = '--.-A';
        document.getElementById('starterVoltage').textContent = '--.-V';
        document.getElementById('starterCurrent').textContent = '--.-A';
        
        this.updateCharts();
        this.logToConnectionConsole('Graph data cleared', 'info');
    }
    
    // Scan for Bluetooth devices
    async scanForDevices() {
        this.updateStatus('Scanning...', 'warning');
        this.logToScanConsole('Starting Bluetooth scan...', 'primary');
        
        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    'battery_service', 
                    'device_information',
                    'generic_access',
                    'generic_attribute',
                    // Add common custom service UUIDs patterns
                    '0000fff0-0000-1000-8000-00805f9b34fb', // Common custom service
                    '0000ffe0-0000-1000-8000-00805f9b34fb', // Common custom service
                ]
            });
            
            this.logToScanConsole(`Device found: ${device.name || 'Unknown'}`, 'success');
            this.logToScanConsole(`Device ID: ${device.id}`, 'info');
            
            // Save device to storage
            this.saveDevice(device);
            this.updateStatus('Device Added', 'success');
            
        } catch (error) {
            this.logToScanConsole(`Scan error: ${error.message}`, 'danger');
            this.updateStatus('Scan Failed', 'danger');
            console.error('Bluetooth scan error:', error);
        }
    }
    
    // Save device to local storage
    saveDevice(device) {
        const devices = this.getDevices();
        const deviceId = device.id;
        
        if (!devices[deviceId]) {
            devices[deviceId] = {
                id: deviceId,
                originalName: device.name || 'Unknown Device',
                customName: '',
                brand: '',
                category: '',
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                connectionStatus: 'disconnected'
            };
            
            this.logToScanConsole(`Saved new device: ${devices[deviceId].originalName}`, 'success');
        } else {
            devices[deviceId].lastSeen = new Date().toISOString();
            this.logToScanConsole(`Updated existing device: ${devices[deviceId].originalName}`, 'info');
        }
        
        localStorage.setItem('btDevices', JSON.stringify(devices));
        this.loadDevices();
    }
    
    // Get devices from storage
    getDevices() {
        return JSON.parse(localStorage.getItem('btDevices') || '{}');
    }
    
    // Load and display devices
    loadDevices() {
        const devices = this.getDevices();
        this.deviceList.innerHTML = '';
        
        if (Object.keys(devices).length === 0) {
            this.deviceList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i><br>
                    No devices saved yet. Click "Scan for Devices" to begin.
                </div>
            `;
            return;
        }
        
        Object.values(devices).forEach(device => {
            const deviceItem = this.createDeviceListItem(device);
            this.deviceList.appendChild(deviceItem);
        });
    }
    
    // Create device list item
    createDeviceListItem(device) {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        
        const displayName = device.customName || device.originalName;
        const statusIcon = device.connectionStatus === 'connected' 
            ? '<i class="fas fa-link text-success"></i>' 
            : '<i class="fas fa-unlink text-secondary"></i>';
        
        const brandBadge = device.brand 
            ? `<span class="badge bg-primary me-1"><i class="fas fa-copyright"></i> ${device.brand}</span>` 
            : '';
        const categoryBadge = device.category 
            ? `<span class="badge bg-info"><i class="fas fa-layer-group"></i> ${device.category}</span>` 
            : '';
        
        div.innerHTML = `
            <div class="d-flex w-100 justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">
                        ${statusIcon} ${displayName}
                    </h6>
                    <p class="mb-1">
                        <small class="text-muted">BT: ${device.originalName}</small>
                    </p>
                    <div class="mb-2">
                        ${brandBadge}
                        ${categoryBadge}
                    </div>
                </div>
                <div class="btn-group-vertical" role="group">
                    <button class="btn btn-sm btn-success connect-btn" data-device-id="${device.id}">
                        <i class="fas fa-link"></i> Connect
                    </button>
                    <button class="btn btn-sm btn-warning disconnect-btn" data-device-id="${device.id}">
                        <i class="fas fa-unlink"></i> Disconnect
                    </button>
                    <a href="/DeviceSettings?deviceId=${encodeURIComponent(device.id)}" class="btn btn-sm btn-info">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                </div>
            </div>
            <small class="text-muted">Last seen: ${new Date(device.lastSeen).toLocaleString()}</small>
        `;
        
        // Add connect button handler
        const connectBtn = div.querySelector('.connect-btn');
        connectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.connectToDevice(device);
        });
        
        // Add disconnect button handler
        const disconnectBtn = div.querySelector('.disconnect-btn');
        disconnectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.disconnectFromDevice(device);
        });
        
        return div;
    }
    
    // Display device settings form
    displayDeviceSettings(device) {
        const template = document.getElementById('deviceSettingsTemplate');
        const clone = template.content.cloneNode(true);
        
        // Populate form fields
        clone.getElementById('deviceCustomName').value = device.customName;
        clone.getElementById('deviceOriginalName').textContent = device.originalName;
        clone.getElementById('deviceId').textContent = device.id;
        clone.getElementById('deviceStatus').textContent = device.connectionStatus;
        clone.getElementById('deviceStatus').className = 
            device.connectionStatus === 'connected' ? 'badge bg-success' : 'badge bg-secondary';
        clone.getElementById('deviceLastSeen').textContent = new Date(device.lastSeen).toLocaleString();
        
        // Populate brand dropdown
        const brandSelect = clone.getElementById('deviceBrand');
        const brands = this.getBrands();
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            option.selected = device.brand === brand;
            brandSelect.appendChild(option);
        });
        
        // Populate category dropdown
        const categorySelect = clone.getElementById('deviceCategory');
        const categories = this.getCategories();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            option.selected = device.category === category;
            categorySelect.appendChild(option);
        });
        
        // Setup form submission
        clone.getElementById('deviceSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDeviceSettings(device.id);
        });
        
        clone.getElementById('deleteDeviceBtn').addEventListener('click', () => {
            this.deleteDevice(device.id);
        });
        
        clone.getElementById('connectDeviceBtn').addEventListener('click', () => {
            this.connectToDevice(device);
        });
        
        clone.getElementById('disconnectDeviceBtn').addEventListener('click', () => {
            this.disconnectFromDevice(device);
        });
        
        // Replace settings panel
        this.deviceSettings.innerHTML = '';
        this.deviceSettings.appendChild(clone);
    }
    
    // Save device settings
    saveDeviceSettings(deviceId) {
        const devices = this.getDevices();
        const device = devices[deviceId];
        
        if (!device) return;
        
        device.customName = document.getElementById('deviceCustomName').value;
        device.brand = document.getElementById('deviceBrand').value;
        device.category = document.getElementById('deviceCategory').value;
        
        localStorage.setItem('btDevices', JSON.stringify(devices));
        this.loadDevices();
        this.logToScanConsole(`Settings saved for device: ${device.customName || device.originalName}`, 'success');
        
        // Show success feedback
        const form = document.getElementById('deviceSettingsForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-primary');
        }, 2000);
    }
    
    // Delete device
    deleteDevice(deviceId) {
        if (!confirm('Are you sure you want to delete this device?')) return;
        
        const devices = this.getDevices();
        const deviceName = devices[deviceId]?.customName || devices[deviceId]?.originalName || 'Unknown';
        delete devices[deviceId];
        
        localStorage.setItem('btDevices', JSON.stringify(devices));
        this.loadDevices();
        this.deviceSettings.innerHTML = `
            <p class="text-muted text-center py-4">
                <i class="fas fa-hand-pointer fa-3x mb-3"></i><br>
                Select a device to edit settings
            </p>
        `;
        
        this.logToScanConsole(`Deleted device: ${deviceName}`, 'warning');
    }
    
    // Connect to device
    async connectToDevice(device) {
        this.logToConnectionConsole(`Attempting to connect to: ${device.customName || device.originalName}`, 'primary');
        this.updateStatus('Connecting...', 'warning');
        
        try {
            // Request device - use acceptAllDevices to discover all services
            this.logToConnectionConsole(`Requesting device with full service discovery...`, 'info');
            const btDevice = await navigator.bluetooth.requestDevice({
                filters: [{ name: device.originalName }],
                optionalServices: [] // Empty array means accept all services
            });
            
            this.logToConnectionConsole(`Device selected: ${btDevice.name}`, 'info');
            
            // Setup disconnect handler BEFORE connecting
            btDevice.addEventListener('gattserverdisconnected', () => {
                this.onDeviceDisconnected(device);
            });
            
            // Connect to GATT server
            this.logToConnectionConsole(`Connecting to GATT server...`, 'info');
            const server = await btDevice.gatt.connect();
            
            // Verify connection
            if (!server.connected) {
                throw new Error('Failed to establish GATT connection');
            }
            
            this.activeConnection = { device: btDevice, server: server, deviceInfo: device };
            
            this.logToConnectionConsole(`Connected to GATT server!`, 'success');
            this.updateStatus('Connected', 'success');
            
            // Update device status
            const devices = this.getDevices();
            devices[device.id].connectionStatus = 'connected';
            localStorage.setItem('btDevices', JSON.stringify(devices));
            this.loadDevices();
            
            // Read device information with a small delay to ensure connection is stable
            setTimeout(() => {
                if (server.connected) {
                    this.readDeviceInformation(server, btDevice);
                } else {
                    this.logToConnectionConsole('Connection lost before reading services', 'warning');
                }
            }, 1000);
            
        } catch (error) {
            this.logToConnectionConsole(`Connection error: ${error.message}`, 'danger');
            this.updateStatus('Connection Failed', 'danger');
            console.error('Bluetooth connection error:', error);
        }
    }
    
    // Read device information
    async readDeviceInformation(server, btDevice) {
        try {
            this.logToConnectionConsole('Reading device information...', 'info');
            
            // Verify connection is still active
            if (!server.connected) {
                this.logToConnectionConsole('Cannot read: GATT server is disconnected', 'danger');
                return;
            }
            
            // First, try to discover ALL services without filtering
            this.logToConnectionConsole('Discovering all available services...', 'info');
            let services;
            try {
                services = await server.getPrimaryServices();
            } catch (error) {
                this.logToConnectionConsole(`Error getting services: ${error.message}`, 'danger');
                
                // If that fails, try discovering services by requesting them explicitly
                this.logToConnectionConsole('Attempting to discover services manually...', 'warning');
                
                // Try common service UUIDs
                const commonServices = [
                    'generic_access',
                    'generic_attribute', 
                    'device_information',
                    'battery_service',
                    '0000fff0-0000-1000-8000-00805f9b34fb',
                    '0000ffe0-0000-1000-8000-00805f9b34fb',
                    '0000ffe1-0000-1000-8000-00805f9b34fb',
                    '0000ffe5-0000-1000-8000-00805f9b34fb'
                ];
                
                services = [];
                for (const serviceUuid of commonServices) {
                    try {
                        const service = await server.getPrimaryService(serviceUuid);
                        services.push(service);
                        this.logToConnectionConsole(`  ✓ Found service: ${serviceUuid}`, 'success');
                    } catch (e) {
                        // Service not available, that's okay
                    }
                }
                
                if (services.length === 0) {
                    throw new Error('No services could be discovered. Device may require specific pairing or app.');
                }
            }
            
            this.logToConnectionConsole(`Found ${services.length} services`, 'success');
            
            if (services.length === 0) {
                this.logToConnectionConsole('', 'info');
                this.logToConnectionConsole('⚠️ NO SERVICES DISCOVERED', 'danger');
                this.logToConnectionConsole('', 'info');
                this.logToConnectionConsole('This device (Mictuning switch panel) may:', 'warning');
                this.logToConnectionConsole('  • Use a proprietary protocol not exposed via GATT', 'warning');
                this.logToConnectionConsole('  • Require bonding/pairing at OS level first', 'warning');
                this.logToConnectionConsole('  • Need specific service UUIDs to be pre-declared', 'warning');
                this.logToConnectionConsole('', 'info');
                this.logToConnectionConsole('📱 WORKAROUND:', 'primary');
                this.logToConnectionConsole('1. Open the official Mictuning app on mobile', 'info');
                this.logToConnectionConsole('2. Check app settings/about for service UUID info', 'info');
                this.logToConnectionConsole('3. Or use Android "nRF Connect" app to scan device', 'info');
                this.logToConnectionConsole('4. Share discovered service UUIDs for integration', 'info');
                this.logToConnectionConsole('', 'info');
                this.logToConnectionConsole('⚙️ ALTERNATIVE:', 'primary');
                this.logToConnectionConsole('Pair device via: System Settings → Bluetooth', 'info');
                this.logToConnectionConsole('Then try connecting again', 'info');
                return;
            }
            
            for (const service of services) {
                const serviceName = this.getStandardUuidName(service.uuid);
                const serviceLabel = serviceName ? `${serviceName} (${service.uuid})` : service.uuid;
                this.logToConnectionConsole(`Service: ${serviceLabel}`, 'info');
                
                try {
                    const characteristics = await service.getCharacteristics();
                    this.logToConnectionConsole(`  - ${characteristics.length} characteristics found`, 'info');
                    
                    for (const characteristic of characteristics) {
                        const charName = this.getStandardUuidName(characteristic.uuid);
                        const charLabel = charName ? `${charName} (${characteristic.uuid})` : characteristic.uuid;
                        this.logToConnectionConsole(`    Characteristic: ${charLabel}`, 'info');
                        
                        // Log properties
                        const props = [];
                        if (characteristic.properties.read) props.push('READ');
                        if (characteristic.properties.write) props.push('WRITE');
                        if (characteristic.properties.notify) props.push('NOTIFY');
                        if (characteristic.properties.indicate) props.push('INDICATE');
                        this.logToConnectionConsole(`      Properties: ${props.join(', ')}`, 'info');
                        
                        // Store heater write characteristic (0000fff2)
                        if (characteristic.uuid === '0000fff2-0000-1000-8000-00805f9b34fb' && characteristic.properties.write) {
                            this.heaterCharacteristic = characteristic;
                            this.logToConnectionConsole(`      🔥 Heater control characteristic detected!`, 'success');
                        }
                        
                        // Try to read if readable
                        if (characteristic.properties.read) {
                            try {
                                const value = await characteristic.readValue();
                                const hexString = Array.from(new Uint8Array(value.buffer))
                                    .map(b => b.toString(16).padStart(2, '0'))
                                    .join(' ');
                                
                                this.logToConnectionConsole(`      Hex: ${hexString}`, 'success');
                                
                                // Special handling for battery level (standard characteristic)
                                if (characteristic.uuid === '00002a19-0000-1000-8000-00805f9b34fb') {
                                    const batteryLevel = new Uint8Array(value.buffer)[0];
                                    this.logToConnectionConsole(`      ⚡ Battery Level: ${batteryLevel}%`, 'primary');
                                }
                                
                                // Try to decode as text
                                try {
                                    const textDecoder = new TextDecoder();
                                    const stringValue = textDecoder.decode(value);
                                    if (stringValue.match(/^[\x20-\x7E]+$/)) {
                                        this.logToConnectionConsole(`      Text: ${stringValue}`, 'success');
                                    }
                                } catch (e) {
                                    // Not valid text, that's okay
                                }
                                
                                // Try to parse as common data types for power monitoring
                                this.parseRenogyData(characteristic.uuid, value, hexString);
                                
                            } catch (readError) {
                                this.logToConnectionConsole(`      Read error: ${readError.message}`, 'warning');
                            }
                        }
                        
                        // Setup notifications if available
                        if (characteristic.properties.notify) {
                            try {
                                await characteristic.startNotifications();
                                this.logToConnectionConsole(`      ✓ Notifications enabled`, 'success');
                                
                                characteristic.addEventListener('characteristicvaluechanged', (event) => {
                                    const value = event.target.value;
                                    const bytes = new Uint8Array(value.buffer);
                                    const hexString = Array.from(bytes)
                                        .map(b => b.toString(16).padStart(2, '0'))
                                        .join(' ');
                                    const decString = Array.from(bytes).join(', ');
                                    const asciiString = Array.from(bytes)
                                        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
                                        .join('');
                                    
                                    this.logToConnectionConsole(`📡 NOTIFY [${characteristic.uuid.substring(0, 8)}]: ${hexString}`, 'primary');
                                    this.logToConnectionConsole(`   DEC: [${decString}]`, 'info');
                                    if (asciiString.replace(/\./g, '').length > 0) {
                                        this.logToConnectionConsole(`   ASCII: "${asciiString}"`, 'info');
                                    }
                                    
                                    // Try to parse heater status from response
                                    this.parseHeaterStatus(bytes);
                                });
                            } catch (notifyError) {
                                this.logToConnectionConsole(`      Could not enable notifications: ${notifyError.message}`, 'warning');
                            }
                        }
                    }
                } catch (charError) {
                    this.logToConnectionConsole(`  - Error reading characteristics: ${charError.message}`, 'warning');
                }
            }
            
            this.logToConnectionConsole('Device information read complete!', 'success');
            
        } catch (error) {
            this.logToConnectionConsole(`Error reading device info: ${error.message}`, 'danger');
            console.error('Device info error:', error);
        }
    }
    
    // Parse Renogy/power monitoring device data
    parseRenogyData(uuid, dataView, hexString) {
        const bytes = new Uint8Array(dataView.buffer);
        
        // Skip if empty or all zeros
        if (bytes.every(b => b === 0) || bytes.length === 0) {
            return;
        }
        
        let auxVoltage = null;
        let auxCurrent = null;
        let starterVoltage = null;
        let starterCurrent = null;
        
        // Try parsing as 16-bit integers (common for voltage/current readings)
        if (bytes.length >= 2) {
            const int16LE = dataView.getInt16(0, true); // Little endian
            const int16BE = dataView.getInt16(0, false); // Big endian
            const uint16LE = dataView.getUint16(0, true);
            const uint16BE = dataView.getUint16(0, false);
            
            this.logToConnectionConsole(`      📊 16-bit: Signed LE=${int16LE} BE=${int16BE}, Unsigned LE=${uint16LE} BE=${uint16BE}`, 'info');
            
            // Common voltage range (10-15V for 12V system) in millivolts would be 10000-15000
            if (uint16LE >= 10000 && uint16LE <= 20000) {
                const voltage = uint16LE / 1000;
                this.logToConnectionConsole(`      ⚡ Possible Voltage: ${voltage.toFixed(2)}V`, 'primary');
                auxVoltage = voltage; // Assume first voltage reading is auxiliary
            }
            if (uint16BE >= 10000 && uint16BE <= 20000) {
                const voltage = uint16BE / 1000;
                this.logToConnectionConsole(`      ⚡ Possible Voltage: ${voltage.toFixed(2)}V`, 'primary');
                if (auxVoltage === null) {
                    auxVoltage = voltage;
                } else {
                    starterVoltage = voltage; // Second voltage could be starter
                }
            }
            
            // Current in milliamps (0-20000 mA = 0-20A)
            if (uint16LE >= 0 && uint16LE <= 25000) {
                const current = uint16LE / 1000;
                this.logToConnectionConsole(`      🔌 Possible Current: ${current.toFixed(2)}A`, 'info');
                auxCurrent = current;
            }
        }
        
        // Check for multiple readings in the same characteristic (common pattern)
        if (bytes.length >= 4) {
            // Try parsing two 16-bit values (could be aux and starter)
            const value1LE = dataView.getUint16(0, true);
            const value2LE = dataView.getUint16(2, true);
            
            // Check if both look like voltages
            if (value1LE >= 10000 && value1LE <= 20000 && value2LE >= 10000 && value2LE <= 20000) {
                auxVoltage = value1LE / 1000;
                starterVoltage = value2LE / 1000;
                this.logToConnectionConsole(`      🔋 Aux Voltage: ${auxVoltage.toFixed(2)}V, Starter Voltage: ${starterVoltage.toFixed(2)}V`, 'primary');
            }
            
            // Check if they look like voltage and current pair
            if (value1LE >= 10000 && value1LE <= 20000 && value2LE >= 0 && value2LE <= 25000) {
                auxVoltage = value1LE / 1000;
                auxCurrent = value2LE / 1000;
                this.logToConnectionConsole(`      🔋 Voltage: ${auxVoltage.toFixed(2)}V, Current: ${auxCurrent.toFixed(2)}A`, 'primary');
            }
        }
        
        // Try parsing as 32-bit integers (less common but possible)
        if (bytes.length >= 4) {
            const int32LE = dataView.getInt32(0, true);
            const uint32LE = dataView.getUint32(0, true);
            
            if (uint32LE > 0 && uint32LE < 1000000) {
                this.logToConnectionConsole(`      📊 32-bit: ${uint32LE}`, 'info');
            }
        }
        
        // Try parsing as float (32-bit)
        if (bytes.length >= 4) {
            try {
                const floatLE = dataView.getFloat32(0, true);
                const floatBE = dataView.getFloat32(0, false);
                
                if (Number.isFinite(floatLE) && floatLE > 0 && floatLE < 1000) {
                    this.logToConnectionConsole(`      📊 Float LE: ${floatLE.toFixed(3)}`, 'info');
                    
                    // Check if float looks like voltage
                    if (floatLE >= 10 && floatLE <= 20) {
                        if (auxVoltage === null) {
                            auxVoltage = floatLE;
                        }
                    }
                    // Check if float looks like current
                    if (floatLE >= 0 && floatLE <= 25) {
                        if (auxCurrent === null) {
                            auxCurrent = floatLE;
                        }
                    }
                }
                if (Number.isFinite(floatBE) && floatBE > 0 && floatBE < 1000) {
                    this.logToConnectionConsole(`      📊 Float BE: ${floatBE.toFixed(3)}`, 'info');
                }
            } catch (e) {
                // Not a valid float
            }
        }
        
        // Update graphs if we have valid readings
        if (auxVoltage !== null || auxCurrent !== null) {
            this.updateMonitoringData('aux', auxVoltage, auxCurrent);
        }
        if (starterVoltage !== null || starterCurrent !== null) {
            this.updateMonitoringData('starter', starterVoltage, starterCurrent);
        }
    }
    
    // Handle device disconnection
    onDeviceDisconnected(device) {
        this.logToConnectionConsole(`Disconnected from: ${device.customName || device.originalName}`, 'warning');
        this.updateStatus('Disconnected', 'secondary');
        
        const devices = this.getDevices();
        if (devices[device.id]) {
            devices[device.id].connectionStatus = 'disconnected';
            localStorage.setItem('btDevices', JSON.stringify(devices));
            this.loadDevices();
        }
        
        this.activeConnection = null;
    }
    
    // Disconnect from device
    disconnectFromDevice(device) {
        if (!this.activeConnection) {
            this.logToConnectionConsole('No active connection to disconnect', 'warning');
            return;
        }
        
        try {
            this.logToConnectionConsole(`Disconnecting from: ${device.customName || device.originalName}`, 'primary');
            
            if (this.activeConnection.server && this.activeConnection.server.connected) {
                this.activeConnection.server.disconnect();
                this.logToConnectionConsole('Disconnected successfully', 'success');
            }
            
            this.activeConnection = null;
            this.updateStatus('Disconnected', 'secondary');
            
            // Update device status
            const devices = this.getDevices();
            if (devices[device.id]) {
                devices[device.id].connectionStatus = 'disconnected';
                localStorage.setItem('btDevices', JSON.stringify(devices));
                this.loadDevices();
            }
            
        } catch (error) {
            this.logToConnectionConsole(`Disconnect error: ${error.message}`, 'danger');
        }
    }
    
    // Get brands from storage
    getBrands() {
        return JSON.parse(localStorage.getItem('brands') || '[]');
    }
    
    // Get categories from storage
    getCategories() {
        return JSON.parse(localStorage.getItem('categories') || '[]');
    }
    
    // Load and display brands and categories
    loadBrandsAndCategories() {
        this.displayBrands();
        this.displayCategories();
    }
    
    // Display brands
    displayBrands() {
        const brands = this.getBrands();
        this.brandList.innerHTML = '';
        
        brands.forEach(brand => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span><i class="fas fa-copyright"></i> ${brand}</span>
                <button class="btn btn-sm btn-danger" data-brand="${brand}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            li.querySelector('button').addEventListener('click', () => this.removeBrand(brand));
            this.brandList.appendChild(li);
        });
    }
    
    // Display categories
    displayCategories() {
        const categories = this.getCategories();
        this.categoryList.innerHTML = '';
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span><i class="fas fa-layer-group"></i> ${category}</span>
                <button class="btn btn-sm btn-danger" data-category="${category}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            li.querySelector('button').addEventListener('click', () => this.removeCategory(category));
            this.categoryList.appendChild(li);
        });
    }
    
    // Add brand
    addBrand() {
        const brandName = this.newBrandInput.value.trim();
        if (!brandName) return;
        
        const brands = this.getBrands();
        if (brands.includes(brandName)) {
            alert('Brand already exists!');
            return;
        }
        
        brands.push(brandName);
        localStorage.setItem('brands', JSON.stringify(brands));
        this.displayBrands();
        this.newBrandInput.value = '';
        this.logToScanConsole(`Added brand: ${brandName}`, 'success');
    }
    
    // Remove brand
    removeBrand(brandName) {
        if (!confirm(`Remove brand "${brandName}"?`)) return;
        
        const brands = this.getBrands().filter(b => b !== brandName);
        localStorage.setItem('brands', JSON.stringify(brands));
        this.displayBrands();
        this.logToScanConsole(`Removed brand: ${brandName}`, 'warning');
    }
    
    // Add category
    addCategory() {
        const categoryName = this.newCategoryInput.value.trim();
        if (!categoryName) return;
        
        const categories = this.getCategories();
        if (categories.includes(categoryName)) {
            alert('Category already exists!');
            return;
        }
        
        categories.push(categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        this.displayCategories();
        this.newCategoryInput.value = '';
        this.logToScanConsole(`Added category: ${categoryName}`, 'success');
    }
    
    // Remove category
    removeCategory(categoryName) {
        if (!confirm(`Remove category "${categoryName}"?`)) return;
        
        const categories = this.getCategories().filter(c => c !== categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        this.displayCategories();
        this.logToScanConsole(`Removed category: ${categoryName}`, 'warning');
    }
    
    // Clear all storage
    clearAllStorage() {
        if (!confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
            return;
        }
        
        localStorage.removeItem('btDevices');
        localStorage.setItem('brands', JSON.stringify(this.defaultBrands));
        localStorage.setItem('categories', JSON.stringify(this.defaultCategories));
        
        this.loadDevices();
        
        this.logToScanConsole('All storage cleared!', 'warning');
        this.logToConnectionConsole('All storage cleared!', 'warning');
    }
    
    // Run comprehensive compatibility check
    async runCompatibilityCheck() {
        this.clearScanConsole();
        this.logToScanConsole('=== Bluetooth Compatibility Check ===', 'primary');
        this.logToScanConsole('', 'info');
        
        // Browser info
        this.logToScanConsole('Browser: ' + navigator.userAgent, 'info');
        this.logToScanConsole('', 'info');
        
        // Check secure context
        this.logToScanConsole('Current URL: ' + window.location.href, 'info');
        this.logToScanConsole('Is Secure Context: ' + window.isSecureContext, window.isSecureContext ? 'success' : 'danger');
        if (!window.isSecureContext) {
            this.logToScanConsole('❌ Web Bluetooth requires HTTPS or localhost!', 'danger');
        }
        this.logToScanConsole('', 'info');
        
        // Check navigator.bluetooth
        this.logToScanConsole('navigator.bluetooth exists: ' + !!navigator.bluetooth, !!navigator.bluetooth ? 'success' : 'danger');
        
        if (!navigator.bluetooth) {
            this.logToScanConsole('❌ Web Bluetooth API not available!', 'danger');
            this.logToScanConsole('', 'info');
            this.logToScanConsole('For Chrome on Linux, try:', 'warning');
            this.logToScanConsole('1. chrome://flags/#enable-experimental-web-platform-features → Enabled', 'warning');
            this.logToScanConsole('2. chrome://flags/#enable-web-bluetooth-new-permissions-backend → Enabled', 'warning');
            this.logToScanConsole('3. Restart Chrome completely', 'warning');
            this.logToScanConsole('', 'info');
            this.logToScanConsole('Or launch Chrome with:', 'warning');
            this.logToScanConsole('/opt/google/chrome/chrome --enable-features=WebBluetooth', 'warning');
            return;
        }
        
        this.logToScanConsole('✓ Web Bluetooth API is present!', 'success');
        this.logToScanConsole('', 'info');
        
        // Check availability
        try {
            this.logToScanConsole('Checking Bluetooth adapter availability...', 'info');
            const available = await navigator.bluetooth.getAvailability();
            this.logToScanConsole('Bluetooth Adapter Available: ' + available, available ? 'success' : 'danger');
            
            if (!available) {
                this.logToScanConsole('❌ No Bluetooth adapter found!', 'danger');
                this.logToScanConsole('Make sure Bluetooth is enabled on your system.', 'warning');
            } else {
                this.logToScanConsole('✓ Bluetooth adapter detected!', 'success');
            }
        } catch (error) {
            this.logToScanConsole('Error checking availability: ' + error.message, 'danger');
        }
        
        this.logToScanConsole('', 'info');
        
        // Check permissions API
        if (navigator.permissions && navigator.permissions.query) {
            try {
                this.logToScanConsole('Checking Bluetooth permissions...', 'info');
                const result = await navigator.permissions.query({ name: 'bluetooth' });
                this.logToScanConsole('Bluetooth permission state: ' + result.state, 'info');
            } catch (error) {
                this.logToScanConsole('Could not query permissions: ' + error.message, 'warning');
            }
        }
        
        this.logToScanConsole('', 'info');
        this.logToScanConsole('=== Compatibility Check Complete ===', 'primary');
    }
    
    // Get human-readable name for standard Bluetooth UUIDs
    getStandardUuidName(uuid) {
        const standardUuids = {
            // Services
            '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
            '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
            '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
            '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
            // Characteristics
            '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name',
            '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance',
            '00002a04-0000-1000-8000-00805f9b34fb': 'Peripheral Preferred Connection Parameters',
            '00002a05-0000-1000-8000-00805f9b34fb': 'Service Changed',
            '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
            '00002a23-0000-1000-8000-00805f9b34fb': 'System ID',
            '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number String',
            '00002a25-0000-1000-8000-00805f9b34fb': 'Serial Number String',
            '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision',
            '00002a27-0000-1000-8000-00805f9b34fb': 'Hardware Revision',
            '00002a28-0000-1000-8000-00805f9b34fb': 'Software Revision',
            '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name',
            '00002a50-0000-1000-8000-00805f9b34fb': 'PnP ID',
        };
        
        return standardUuids[uuid] || null;
    }
    
    // Heater Control Functions
    async sendHeaterCommand(command) {
        if (!this.heaterCharacteristic) {
            this.logToConnectionConsole('❌ Heater not connected or characteristic not found', 'danger');
            alert('Please connect to a heater device first');
            return;
        }
        
        try {
            let commandBytes;
            let commandVariations = []; // Try multiple protocol variations
            
            // Hcalory heater command protocols - trying multiple variations
            switch(command) {
                case 'on':
                    commandVariations = [
                        new Uint8Array([0x76, 0x01]),                                    // Simple: header + on
                        new Uint8Array([0x76, 0x16, 0x01, 0x00]),                       // With length byte
                        new Uint8Array([0x76, 0x16, 0x01, 0x01, 0x00, 0x00, 0x8E]),    // Full frame with checksum
                        new Uint8Array([0xAA, 0x01, 0x55]),                             // Alt protocol
                        new Uint8Array([0x78, 0x78, 0x11, 0x01, 0x0D, 0x0A])           // Another variation
                    ];
                    this.logToConnectionConsole('🔥 Sending: Heater ON (trying variations)...', 'primary');
                    document.getElementById('heaterPowerStatus').textContent = 'ON';
                    document.getElementById('heaterPowerStatus').className = 'mb-0 text-success';
                    break;
                case 'off':
                    commandVariations = [
                        new Uint8Array([0x76, 0x00]),                                    // Simple: header + off
                        new Uint8Array([0x76, 0x16, 0x00, 0x00]),                       // With length
                        new Uint8Array([0x76, 0x16, 0x00, 0x00, 0x00, 0x00, 0x8C]),    // Full frame
                        new Uint8Array([0xAA, 0x00, 0x55]),                             // Alt protocol
                        new Uint8Array([0x78, 0x78, 0x11, 0x00, 0x0D, 0x0A])           // Another variation
                    ];
                    this.logToConnectionConsole('⭕ Sending: Heater OFF (trying variations)...', 'warning');
                    document.getElementById('heaterPowerStatus').textContent = 'OFF';
                    document.getElementById('heaterPowerStatus').className = 'mb-0 text-secondary';
                    break;
                case 'blower_on':
                    commandVariations = [
                        new Uint8Array([0x76, 0x02]),                                    // Blower on simple
                        new Uint8Array([0x76, 0x16, 0x02, 0x01]),                       // Blower on with param
                        new Uint8Array([0x76, 0x16, 0x00, 0x02, 0x00, 0x00, 0x8E]),    // Fan control
                        new Uint8Array([0xAA, 0x02, 0x01, 0x55])                        // Alt blower on
                    ];
                    this.logToConnectionConsole('💨 Sending: Blower ON...', 'info');
                    break;
                case 'blower_off':
                    commandVariations = [
                        new Uint8Array([0x76, 0x03]),                                    // Blower off simple
                        new Uint8Array([0x76, 0x16, 0x02, 0x00]),                       // Blower off with param
                        new Uint8Array([0x76, 0x16, 0x00, 0x00, 0x00, 0x00, 0x8C]),    // Fan stop
                        new Uint8Array([0xAA, 0x02, 0x00, 0x55])                        // Alt blower off
                    ];
                    this.logToConnectionConsole('⭕ Sending: Blower OFF...', 'info');
                    break;
                case 'prime':
                    commandVariations = [
                        new Uint8Array([0x76, 0x05]),                                    // Prime simple
                        new Uint8Array([0x76, 0x16, 0x05, 0x00]),                       // Prime with param
                        new Uint8Array([0xAA, 0x05, 0x55])                              // Alt prime
                    ];
                    this.logToConnectionConsole('💧 Sending: Prime Fuel...', 'info');
                    break;
                case 'level1':
                    commandVariations = [
                        new Uint8Array([0x76, 0x10, 0x01]),                             // Level 1
                        new Uint8Array([0x76, 0x16, 0x03, 0x01]),                       // Power level 1
                        new Uint8Array([0xAA, 0x03, 0x01, 0x55])                        // Alt level 1
                    ];
                    this.logToConnectionConsole('🔥 Sending: Heat Level 1 (Low)...', 'primary');
                    document.getElementById('heaterCurrentLevel').textContent = 'Level 1';
                    break;
                case 'level2':
                    commandVariations = [
                        new Uint8Array([0x76, 0x10, 0x02]),                             // Level 2
                        new Uint8Array([0x76, 0x16, 0x03, 0x02]),                       // Power level 2
                        new Uint8Array([0xAA, 0x03, 0x02, 0x55])                        // Alt level 2
                    ];
                    this.logToConnectionConsole('🔥 Sending: Heat Level 2 (Medium)...', 'primary');
                    document.getElementById('heaterCurrentLevel').textContent = 'Level 2';
                    break;
                case 'level3':
                    commandVariations = [
                        new Uint8Array([0x76, 0x10, 0x03]),                             // Level 3
                        new Uint8Array([0x76, 0x16, 0x03, 0x03]),                       // Power level 3
                        new Uint8Array([0xAA, 0x03, 0x03, 0x55])                        // Alt level 3
                    ];
                    this.logToConnectionConsole('🔥 Sending: Heat Level 3 (High)...', 'primary');
                    document.getElementById('heaterCurrentLevel').textContent = 'Level 3';
                    break;
                default:
                    this.logToConnectionConsole('❌ Unknown command: ' + command, 'danger');
                    return;
            }
            
            // Try each command variation with delay
            let success = false;
            for (let i = 0; i < commandVariations.length; i++) {
                commandBytes = commandVariations[i];
                const hexStr = Array.from(commandBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
                
                try {
                    this.logToConnectionConsole(`  Attempt ${i + 1}: Sending ${hexStr}`, 'info');
                    await this.heaterCharacteristic.writeValue(commandBytes);
                    this.logToConnectionConsole(`  ✓ Sent successfully`, 'success');
                    success = true;
                    
                    // Small delay between attempts
                    if (i < commandVariations.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (err) {
                    this.logToConnectionConsole(`  ✗ Failed: ${err.message}`, 'warning');
                }
            }
            
            if (success) {
                this.logToConnectionConsole(`✓ Command sequence completed`, 'success');
            } else {
                this.logToConnectionConsole(`❌ All attempts failed`, 'danger');
            }
            
        } catch (error) {
            this.logToConnectionConsole(`❌ Error sending command: ${error.message}`, 'danger');
            console.error('Heater command error:', error);
        }
    }
    
    async setHeaterTemperature() {
        if (!this.heaterCharacteristic) {
            this.logToConnectionConsole('❌ Heater not connected', 'danger');
            alert('Please connect to a heater device first');
            return;
        }
        
        const temp = parseInt(this.heaterTempInput.value);
        
        if (isNaN(temp) || temp < 8 || temp > 35) {
            alert('Please enter a temperature between 8°C and 35°C');
            return;
        }
        
        try {
            // Temperature set command - adjust protocol as needed
            const commandBytes = new Uint8Array([0xA0, 0x04, temp, 0x00, 0x00, 0x00, 0x00, 0xA4 + temp]);
            
            this.logToConnectionConsole(`🌡️ Setting temperature to ${temp}°C...`, 'primary');
            
            await this.heaterCharacteristic.writeValue(commandBytes);
            
            const hexStr = Array.from(commandBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
            this.logToConnectionConsole(`✓ Temperature set: ${hexStr}`, 'success');
            
            document.getElementById('heaterSetTemp').textContent = `${temp}°C`;
            
        } catch (error) {
            this.logToConnectionConsole(`❌ Error setting temperature: ${error.message}`, 'danger');
            console.error('Temperature set error:', error);
        }
    }
    
    // Send custom hex command for protocol testing
    async sendCustomHexCommand() {
        if (!this.heaterCharacteristic) {
            this.logToConnectionConsole('❌ Heater not connected', 'danger');
            alert('Please connect to a heater device first');
            return;
        }
        
        const hexInput = this.customHexInput.value.trim();
        if (!hexInput) {
            alert('Please enter hex bytes (e.g., 76 16 01 00)');
            return;
        }
        
        try {
            // Parse hex string to bytes
            const hexBytes = hexInput.split(/[\s,]+/).filter(s => s.length > 0);
            const commandBytes = new Uint8Array(hexBytes.map(h => parseInt(h, 16)));
            
            // Validate
            if (commandBytes.some(isNaN)) {
                alert('Invalid hex format. Use space-separated hex bytes (e.g., 76 16 01 00)');
                return;
            }
            
            const hexStr = Array.from(commandBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
            this.logToConnectionConsole(`📤 Sending custom command: ${hexStr}`, 'warning');
            
            await this.heaterCharacteristic.writeValue(commandBytes);
            
            this.logToConnectionConsole(`✓ Custom command sent successfully`, 'success');
            this.logToConnectionConsole(`  Watch for responses in notifications above...`, 'info');
            
        } catch (error) {
            this.logToConnectionConsole(`❌ Error sending custom command: ${error.message}`, 'danger');
            console.error('Custom command error:', error);
        }
    }
    
    // Parse heater status from notification responses
    parseHeaterStatus(bytes) {
        // Try to identify status patterns
        if (bytes.length < 2) return;
        
        // Common status byte patterns
        if (bytes[0] === 0x76 && bytes.length >= 3) {
            // Possible Hcalory response format
            const cmd = bytes[1];
            const status = bytes[2];
            
            if (cmd === 0x16) {
                this.logToConnectionConsole(`  📊 Status byte: ${status} (0x${status.toString(16)})`, 'info');
                
                // Try to interpret status
                if (status === 0x01) {
                    this.logToConnectionConsole(`  ✓ Heater appears to be ON`, 'success');
                } else if (status === 0x00) {
                    this.logToConnectionConsole(`  ⭕ Heater appears to be OFF`, 'warning');
                }
            }
        }
        
        // Look for temperature values (common range 0-50°C)
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] >= 5 && bytes[i] <= 50) {
                this.logToConnectionConsole(`  🌡️ Possible temp at byte[${i}]: ${bytes[i]}°C`, 'info');
            }
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new BluetoothDeviceManager();
});
