// ==========================================
// Global Variables
// ==========================================
let menuData = [];
let filteredData = [];
let categories = [];

// ==========================================
// Initialize Application
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadMenuData();
        populateCategoryFilter();
        setupEventListeners();
        displayMenuItems(menuData);
        updateResultsCount(menuData.length);
        setupScrollTracking();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load menu data. Please refresh the page.');
    }
});

// ==========================================
// Load Menu Data
// ==========================================
async function loadMenuData() {
    try {
        const response = await fetch('menu-data.json');
        if (!response.ok) {
            throw new Error('Failed to fetch menu data');
        }
        const data = await response.json();
        
        // Transform the data structure - flatten categories into items array
        menuData = [];
        let itemId = 1;
        
        data.forEach(categoryGroup => {
            if (categoryGroup.items && Array.isArray(categoryGroup.items)) {
                categoryGroup.items.forEach(item => {
                    menuData.push({
                        id: itemId++,
                        title: item.title,
                        description: item.description || '',
                        price: item.price,
                        category: categoryGroup.category,
                        img: item.img || '',
                        vegetarian: isVegetarian(categoryGroup.category),
                        spicy: getSpiceLevel(item.title, item.description)
                    });
                });
            }
        });
        
        filteredData = [...menuData];
    } catch (error) {
        console.error('Error loading menu data:', error);
        throw error;
    }
}

// Helper function to determine if item is vegetarian
function isVegetarian(category) {
    const vegCategories = [
        'Veg Appetizers', 'Chaat', 'Veg Tandoori', 'Veg Curries',
        'Rice & Biryani', 'Breads', 'Extras', 'Vegan Menu Categories'
    ];
    const nonVegKeywords = ['Chicken', 'Lamb', 'Seafood', 'Fish', 'Shrimp', 'Non-Veg'];
    
    // Check if category contains non-veg keywords
    if (nonVegKeywords.some(keyword => category.includes(keyword))) {
        return false;
    }
    
    return vegCategories.some(vegCat => category.includes(vegCat));
}

// Helper function to estimate spice level
function getSpiceLevel(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('vindaloo') || text.includes('extra spicy')) {
        return 3;
    } else if (text.includes('chilli') || text.includes('spicy') || text.includes('65')) {
        return 2;
    } else if (text.includes('masala') || text.includes('tandoori') || text.includes('curry')) {
        return 1;
    }
    return 0;
}

// ==========================================
// Populate Category Filter
// ==========================================
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(menuData.map(item => item.category))];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', applyFilters);

    // Dietary filter
    const dietaryFilter = document.getElementById('dietaryFilter');
    dietaryFilter.addEventListener('change', applyFilters);

    // Spice level filter
    const spiceFilter = document.getElementById('spiceFilter');
    spiceFilter.addEventListener('change', applyFilters);

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', handleSort);
}

// ==========================================
// Search Handler
// ==========================================
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        applyFilters();
        return;
    }

    const searchResults = filteredData.filter(item => {
        return (
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    });

    displayMenuItems(searchResults);
    updateResultsCount(searchResults.length);
}

// ==========================================
// Apply Filters
// ==========================================
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dietaryFilter = document.getElementById('dietaryFilter').value;
    const spiceFilter = document.getElementById('spiceFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase().trim();

    let results = [...menuData];

    // Category filter
    if (categoryFilter !== 'all') {
        results = results.filter(item => item.category === categoryFilter);
    }

    // Dietary filter
    if (dietaryFilter === 'vegetarian') {
        results = results.filter(item => item.vegetarian === true);
    } else if (dietaryFilter === 'non-vegetarian') {
        results = results.filter(item => item.vegetarian === false);
    }

    // Spice level filter
    if (spiceFilter !== 'all') {
        results = results.filter(item => item.spicy === parseInt(spiceFilter));
    }

    // Search filter
    if (searchInput !== '') {
        results = results.filter(item => {
            return (
                item.title.toLowerCase().includes(searchInput) ||
                item.description.toLowerCase().includes(searchInput) ||
                item.category.toLowerCase().includes(searchInput)
            );
        });
    }

    filteredData = results;
    
    // Re-apply current sort
    const sortSelect = document.getElementById('sortSelect').value;
    if (sortSelect !== 'default') {
        sortItems(results, sortSelect);
    }

    displayMenuItems(results);
    updateResultsCount(results.length);
}

// ==========================================
// Sort Handler
// ==========================================
function handleSort(event) {
    const sortValue = event.target.value;
    const itemsToSort = [...filteredData];
    
    sortItems(itemsToSort, sortValue);
    displayMenuItems(itemsToSort);
}

function sortItems(items, sortType) {
    switch(sortType) {
        case 'price-low':
            items.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            items.sort((a, b) => b.price - a.price);
            break;
        case 'name-az':
            items.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-za':
            items.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            // Default order (as in JSON)
            break;
    }
    filteredData = items;
}

// ==========================================
// Display Menu Items
// ==========================================
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuGrid');
    const noResults = document.getElementById('noResults');

    if (items.length === 0) {
        menuGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    menuGrid.style.display = 'block';
    noResults.style.display = 'none';
    menuGrid.innerHTML = '';

    // Group items by category
    const itemsByCategory = {};
    items.forEach(item => {
        if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
    });

    // Create sections for each category
    Object.keys(itemsByCategory).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.setAttribute('data-category', category);
        categorySection.id = `category-${category.replace(/\s+/g, '-').toLowerCase()}`;

        // Category header
        const header = document.createElement('div');
        header.className = 'category-header';
        
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category;
        
        const count = document.createElement('p');
        count.className = 'category-count';
        count.textContent = `${itemsByCategory[category].length} items`;
        
        header.appendChild(title);
        header.appendChild(count);
        categorySection.appendChild(header);

        // Grid for items in this category
        const grid = document.createElement('div');
        grid.className = 'menu-grid';
        
        itemsByCategory[category].forEach(item => {
            const card = createMenuCard(item);
            grid.appendChild(card);
        });

        categorySection.appendChild(grid);
        menuGrid.appendChild(categorySection);
    });
}

// ==========================================
// Create Menu Card
// ==========================================
function createMenuCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.setAttribute('data-category', item.category);
    card.setAttribute('data-id', item.id);

    // Image placeholder
    const imageDiv = document.createElement('div');
    imageDiv.className = 'card-image';
    
    if (item.img && item.img !== '') {
        const img = document.createElement('img');
        img.src = item.img;
        img.alt = item.title;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        imageDiv.appendChild(img);
    } else {
        // Use emoji based on category
        const emoji = getCategoryEmoji(item.category);
        imageDiv.textContent = emoji;
    }

    // Card content
    const content = document.createElement('div');
    content.className = 'card-content';

    // Header (title + price)
    const header = document.createElement('div');
    header.className = 'card-header';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;

    const price = document.createElement('div');
    price.className = 'card-price';
    price.textContent = `$${item.price.toFixed(2)}`;

    header.appendChild(title);
    header.appendChild(price);

    // Description
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.description;

    // Badges
    const badges = document.createElement('div');
    badges.className = 'card-badges';

    // Vegetarian badge
    const vegBadge = document.createElement('span');
    vegBadge.className = item.vegetarian ? 'badge badge-vegetarian' : 'badge badge-non-veg';
    vegBadge.textContent = item.vegetarian ? '🌱 Vegetarian' : '🍖 Non-Veg';
    badges.appendChild(vegBadge);

    // Spice level badge
    if (item.spicy > 0) {
        const spiceBadge = document.createElement('span');
        spiceBadge.className = 'badge badge-spice';
        spiceBadge.textContent = getSpiceLabel(item.spicy);
        badges.appendChild(spiceBadge);
    }

    // Category badge
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'badge badge-category';
    categoryBadge.textContent = item.category;
    badges.appendChild(categoryBadge);

    // Append elements
    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(badges);

    card.appendChild(imageDiv);
    card.appendChild(content);

    return card;
}

// ==========================================
// Helper Functions
// ==========================================

// Get emoji for category
function getCategoryEmoji(category) {
    const emojiMap = {
        'Appetizers': '🥟',
        'Tandoori': '🍗',
        'Curries': '🍛',
        'Biryani': '🍚',
        'Breads': '🫓',
        'Sides': '🥗',
        'Desserts': '🍮',
        'Beverages': '🥤'
    };
    return emojiMap[category] || '🍽️';
}

// Get spice level label
function getSpiceLabel(level) {
    const labels = {
        0: '😊 Mild',
        1: '🌶️ Medium',
        2: '🌶️🌶️ Spicy',
        3: '🌶️🌶️🌶️ Extra Spicy'
    };
    return labels[level] || '';
}

// Update results count
function updateResultsCount(count) {
    const countElement = document.getElementById('count');
    countElement.textContent = count;
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('dietaryFilter').value = 'all';
    document.getElementById('spiceFilter').value = 'all';
    document.getElementById('sortSelect').value = 'default';
    
    filteredData = [...menuData];
    displayMenuItems(menuData);
    updateResultsCount(menuData.length);
}

// Debounce function for search
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Show error message
function showError(message) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <p style="font-size: 1.2rem; color: #d32f2f; margin-bottom: 1rem;">
                ⚠️ ${message}
            </p>
        </div>
    `;
}

// ==========================================
// Smooth Scroll (for future navigation)
// ==========================================
function scrollToMenu() {
    const menuSection = document.querySelector('.menu-section');
    menuSection.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// Mobile Toggle for Filters
// ==========================================
function toggleFilters() {
    const filtersContainer = document.getElementById('filtersContainer');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    filtersContainer.classList.toggle('open');
    toggleIcon.classList.toggle('open');
}

// ==========================================
// Scroll Tracking for Category Indicator
// ==========================================
function setupScrollTracking() {
    const categoryIndicator = document.getElementById('categoryIndicator');
    const currentCategoryText = document.getElementById('currentCategory');
    const menuSection = document.querySelector('.menu-section');

    let isScrolling;
    
    window.addEventListener('scroll', () => {
        // Clear timeout
        clearTimeout(isScrolling);
        
        // Check if we're in the menu section
        const menuRect = menuSection.getBoundingClientRect();
        const isInMenu = menuRect.top < 200 && menuRect.bottom > 200;
        
        if (isInMenu) {
            // Find which category is currently in view
            const categorySections = document.querySelectorAll('.category-section');
            let currentCategory = 'All Categories';
            
            categorySections.forEach(section => {
                const rect = section.getBoundingClientRect();
                // Check if section is in viewport (with offset for sticky header)
                if (rect.top < 250 && rect.bottom > 200) {
                    currentCategory = section.getAttribute('data-category');
                }
            });
            
            currentCategoryText.textContent = currentCategory;
            categoryIndicator.classList.add('visible');
        } else {
            categoryIndicator.classList.remove('visible');
        }
        
        // Hide indicator after scrolling stops (optional)
        isScrolling = setTimeout(() => {
            // You can add auto-hide logic here if needed
        }, 150);
    });
}

// ==========================================
// Smooth Scroll (for future navigation)
// ==========================================
function scrollToMenu() {
    const menuSection = document.querySelector('.menu-section');
    menuSection.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// Export functions for HTML onclick handlers
// ==========================================
window.resetFilters = resetFilters;
window.scrollToMenu = scrollToMenu;
window.toggleFilters = toggleFilters;
