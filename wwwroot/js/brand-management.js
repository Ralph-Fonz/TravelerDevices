// Brand and Category Management
// Manages brands and categories for device organization

class BrandCategoryManager {
    constructor() {
        console.log('BrandCategoryManager constructor called');
        
        // Default brands and categories
        this.defaultBrands = ['Renogy', 'Redarch', 'Litime', 'MicTuning', 'Vevor'];
        this.defaultCategories = ['Solar', 'Batteries', 'Dc to Dc Chargers', 'Switch Panel', 'Diesel Heaters'];
        
        // UI Elements
        this.brandList = document.getElementById('brandList');
        this.categoryList = document.getElementById('categoryList');
        this.newBrandInput = document.getElementById('newBrandInput');
        this.newCategoryInput = document.getElementById('newCategoryInput');
        this.addBrandBtn = document.getElementById('addBrandBtn');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        
        console.log('Elements:', {
            brandList: !!this.brandList,
            categoryList: !!this.categoryList,
            newBrandInput: !!this.newBrandInput,
            newCategoryInput: !!this.newCategoryInput,
            addBrandBtn: !!this.addBrandBtn,
            addCategoryBtn: !!this.addCategoryBtn
        });
        
        // Initialize storage
        this.initializeStorage();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        this.displayBrands();
        this.displayCategories();
    }
    
    // Initialize local storage with defaults
    initializeStorage() {
        console.log('Initializing storage...');
        
        // Merge existing brands with defaults
        const existingBrands = JSON.parse(localStorage.getItem('brands') || '[]');
        const mergedBrands = [...new Set([...existingBrands, ...this.defaultBrands])];
        console.log('Existing brands:', existingBrands);
        console.log('Merged brands:', mergedBrands);
        localStorage.setItem('brands', JSON.stringify(mergedBrands));
        
        // Merge existing categories with defaults
        const existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
        const mergedCategories = [...new Set([...existingCategories, ...this.defaultCategories])];
        console.log('Existing categories:', existingCategories);
        console.log('Merged categories:', mergedCategories);
        localStorage.setItem('categories', JSON.stringify(mergedCategories));
    }
    
    // Setup event listeners
    setupEventListeners() {
        this.addBrandBtn.addEventListener('click', () => this.addBrand());
        this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        
        // Allow Enter key to add brands/categories
        this.newBrandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBrand();
        });
        this.newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });
    }
    
    // Get brands from storage
    getBrands() {
        return JSON.parse(localStorage.getItem('brands') || '[]');
    }
    
    // Get categories from storage
    getCategories() {
        return JSON.parse(localStorage.getItem('categories') || '[]');
    }
    
    // Display brands
    displayBrands() {
        console.log('displayBrands called');
        const brands = this.getBrands();
        console.log('Brands to display:', brands);
        this.brandList.innerHTML = '';
        
        if (brands.length === 0) {
            this.brandList.innerHTML = '<li class="list-group-item text-muted">No brands yet. Add one below.</li>';
            return;
        }
        
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
        console.log('displayCategories called');
        const categories = this.getCategories();
        console.log('Categories to display:', categories);
        this.categoryList.innerHTML = '';
        
        if (categories.length === 0) {
            this.categoryList.innerHTML = '<li class="list-group-item text-muted">No categories yet. Add one below.</li>';
            return;
        }
        
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
        console.log('addBrand called');
        const brandName = this.newBrandInput.value.trim();
        console.log('Brand name:', brandName);
        
        if (!brandName) {
            console.log('Empty brand name, returning');
            return;
        }
        
        const brands = this.getBrands();
        console.log('Current brands:', brands);
        
        if (brands.includes(brandName)) {
            alert('Brand already exists!');
            return;
        }
        
        brands.push(brandName);
        console.log('Updated brands:', brands);
        localStorage.setItem('brands', JSON.stringify(brands));
        console.log('Saved to localStorage');
        
        this.displayBrands();
        this.newBrandInput.value = '';
        
        // Show success message
        this.showSuccessMessage(this.addBrandBtn, 'Added!');
    }
    
    // Remove brand
    removeBrand(brandName) {
        if (!confirm(`Remove brand "${brandName}"?`)) return;
        
        const brands = this.getBrands().filter(b => b !== brandName);
        localStorage.setItem('brands', JSON.stringify(brands));
        this.displayBrands();
    }
    
    // Add category
    addCategory() {
        console.log('addCategory called');
        const categoryName = this.newCategoryInput.value.trim();
        console.log('Category name:', categoryName);
        
        if (!categoryName) {
            console.log('Empty category name, returning');
            return;
        }
        
        const categories = this.getCategories();
        console.log('Current categories:', categories);
        
        if (categories.includes(categoryName)) {
            alert('Category already exists!');
            return;
        }
        
        categories.push(categoryName);
        console.log('Updated categories:', categories);
        localStorage.setItem('categories', JSON.stringify(categories));
        console.log('Saved to localStorage');
        
        this.displayCategories();
        this.newCategoryInput.value = '';
        
        // Show success message
        this.showSuccessMessage(this.addCategoryBtn, 'Added!');
    }
    
    // Remove category
    removeCategory(categoryName) {
        if (!confirm(`Remove category "${categoryName}"?`)) return;
        
        const categories = this.getCategories().filter(c => c !== categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        this.displayCategories();
    }
    
    // Show success message on button
    showSuccessMessage(button, message) {
        const originalHtml = button.innerHTML;
        const originalClass = button.className;
        
        button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
        button.className = button.className.replace('btn-primary', 'btn-success').replace('btn-success', 'btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.className = originalClass;
        }, 2000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired for Brand Management');
    const manager = new BrandCategoryManager();
    console.log('BrandCategoryManager instance created:', manager);
});
