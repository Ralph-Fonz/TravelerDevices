// Device Settings Page
// Manages device configuration

class DeviceSettingsManager {
    constructor() {
        // UI Elements
        this.deviceList = document.getElementById('deviceList');
        this.deviceSettings = document.getElementById('deviceSettings');
        
        // Load devices
        this.loadDevices();
    }
    
    // Get devices from storage
    getDevices() {
        return JSON.parse(localStorage.getItem('btDevices') || '{}');
    }
    
    // Get brands from storage
    getBrands() {
        return JSON.parse(localStorage.getItem('brands') || '[]');
    }
    
    // Get categories from storage
    getCategories() {
        return JSON.parse(localStorage.getItem('categories') || '[]');
    }
    
    // Load and display devices
    loadDevices() {
        const devices = this.getDevices();
        this.deviceList.innerHTML = '';
        
        if (Object.keys(devices).length === 0) {
            this.deviceList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i><br>
                    No devices saved yet. Go to BT Scanner to add devices.
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
        div.className = 'list-group-item list-group-item-action';
        
        const displayName = device.customName || device.originalName;
        const brandBadge = device.brand 
            ? `<span class="badge bg-primary me-1">${device.brand}</span>` 
            : '';
        const categoryBadge = device.category 
            ? `<span class="badge bg-info">${device.category}</span>` 
            : '';
        
        div.innerHTML = `
            <h6 class="mb-1">${displayName}</h6>
            <small class="text-muted">${device.originalName}</small><br>
            ${brandBadge}
            ${categoryBadge}
        `;
        
        div.addEventListener('click', () => this.selectDevice(device));
        return div;
    }
    
    // Select device for editing
    selectDevice(device) {
        this.displayDeviceSettings(device);
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
            // Refresh to show updated name in list
            this.displayDeviceSettings(device);
        }, 2000);
    }
    
    // Delete device
    deleteDevice(deviceId) {
        if (!confirm('Are you sure you want to delete this device?')) return;
        
        const devices = this.getDevices();
        delete devices[deviceId];
        
        localStorage.setItem('btDevices', JSON.stringify(devices));
        this.loadDevices();
        this.deviceSettings.innerHTML = `
            <p class="text-muted text-center py-5">
                <i class="fas fa-hand-pointer fa-3x mb-3"></i><br>
                Select a device to edit settings
            </p>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DeviceSettingsManager();
});
