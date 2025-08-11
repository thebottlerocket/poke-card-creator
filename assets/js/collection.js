// Collection Page JavaScript
let allCards = [];
let filteredCards = [];
let cardManager = null;

// Load and display all cards when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize card manager
    if (window.cardManager) {
        try {
            await window.cardManager.init();
            cardManager = window.cardManager;
            console.log('Collection page: Card manager initialized');
        } catch (error) {
            console.error('Failed to initialize card manager:', error);
        }
    }
    
    await loadAllCards();
    setupFilterListeners();
    updateStats();
});

// Load all cards from database or localStorage
async function loadAllCards() {
    try {
        if (cardManager) {
            allCards = await cardManager.getAllCards();
        } else {
            // Fallback to localStorage
            const savedCards = localStorage.getItem('pokemonCards');
            allCards = savedCards ? JSON.parse(savedCards) : [];
        }
        
        filteredCards = [...allCards];
        displayCards(filteredCards);
        populateAuthorFilter();
        updateStats();
    } catch (error) {
        console.error('Error loading cards:', error);
        showEmptyCollection();
    }
    
    if (allCards.length === 0) {
        showEmptyCollection();
    }
}

// Display cards in the grid
function displayCards(cards) {
    const collectionGrid = document.getElementById('collectionGrid');
    const emptyCollection = document.getElementById('emptyCollection');
    
    if (cards.length === 0) {
        showEmptyCollection();
        return;
    }
    
    emptyCollection.style.display = 'none';
    
    collectionGrid.innerHTML = cards.map((card, index) => `
        <div class="collection-card" data-index="${index}">
            <div class="card-preview-mini">
                <div class="pokemon-hp">HP ${card.hp || 60}</div>
                <h4>${card.name || 'Unknown Pokemon'}</h4>
                <div class="type-display">${formatTypes(card.type1, card.type2)}</div>
                
                <div class="pokemon-image-area">
                    ${card.image ? `<img src="${card.image}" alt="${card.name}">` : '<div class="placeholder">🎨</div>'}
                </div>
                
                <div class="description-display" style="font-size: 0.7em; margin: 5px 0;">
                    ${(card.description || '').substring(0, 50)}${(card.description || '').length > 50 ? '...' : ''}
                </div>
                
                <div class="attack-section" style="font-size: 0.8em;">
                    <div class="attack-name">${card.abilityName || 'Special Attack'}</div>
                    <div class="attack-damage">${card.attack || 40} DMG</div>
                </div>
                
                <div class="card-author">
                    ${card.author ? `By: ${card.author}` : 'By: Unknown'}
                </div>
            </div>
            
            <div class="card-info">
                <h3>${card.name || 'Unknown Pokemon'}</h3>
                <div class="card-meta">
                    <span>Created: ${formatDate(card.createdAt)}</span>
                    <div class="card-author-info">${card.author || 'Unknown'}</div>
                </div>
                <div class="card-meta">
                    <span>Types: ${formatTypes(card.type1, card.type2)}</span>
                    <span>ATK: ${card.attack || 40} | DEF: ${card.defense || 30}</span>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="editCardInCreator(${index})" style="background: linear-gradient(135deg, #ff9800, #f57c00); color: white;">✏️ Edit</button>
                    <button class="view-btn" onclick="viewCard(${index})">👁️ View</button>
                    <button class="delete-btn" onclick="deleteCard(${index})">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show empty collection message
function showEmptyCollection() {
    const collectionGrid = document.getElementById('collectionGrid');
    const emptyCollection = document.getElementById('emptyCollection');
    
    collectionGrid.innerHTML = '';
    emptyCollection.style.display = 'block';
}

// Format Pokemon types for display
function formatTypes(type1, type2) {
    const typeEmojis = {
        'Electric': '⚡',
        'Fire': '🔥',
        'Water': '💧',
        'Grass': '🌱',
        'Ground': '🌍',
        'Rock': '🪨',
        'Flying': '🪶',
        'Fighting': '👊',
        'Psychic': '🔮',
        'Dark': '🌙',
        'Steel': '⚔️',
        'Dragon': '🐉',
        'Fairy': '🧚'
    };
    
    let result = typeEmojis[type1] + ' ' + type1;
    if (type2) {
        result += ' • ' + typeEmojis[type2] + ' ' + type2;
    }
    return result;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Populate author filter dropdown
function populateAuthorFilter() {
    const authorFilter = document.getElementById('authorFilter');
    const authors = [...new Set(allCards.map(card => card.author || 'Unknown').filter(author => author))];
    
    // Clear existing options except "All Authors"
    while (authorFilter.children.length > 1) {
        authorFilter.removeChild(authorFilter.lastChild);
    }
    
    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
}

// Setup filter event listeners
function setupFilterListeners() {
    const authorFilter = document.getElementById('authorFilter');
    const typeFilter = document.getElementById('typeFilter');
    const searchInput = document.getElementById('searchInput');
    
    authorFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
}

// Apply all filters
function applyFilters() {
    const authorFilter = document.getElementById('authorFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredCards = allCards.filter(card => {
        // Author filter
        if (authorFilter && (card.author || 'Unknown') !== authorFilter) {
            return false;
        }
        
        // Type filter
        if (typeFilter && card.type1 !== typeFilter && card.type2 !== typeFilter) {
            return false;
        }
        
        // Search filter
        if (searchTerm && !(card.name || '').toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });
    
    displayCards(filteredCards);
    updateStats();
}

// Clear all filters
function clearFilters() {
    document.getElementById('authorFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    filteredCards = [...allCards];
    displayCards(filteredCards);
    updateStats();
}

// Update statistics
function updateStats() {
    const totalCards = document.getElementById('totalCards');
    const uniqueAuthors = document.getElementById('uniqueAuthors');
    const uniqueTypes = document.getElementById('uniqueTypes');
    
    totalCards.textContent = filteredCards.length;
    
    const authors = new Set(filteredCards.map(card => card.author || 'Unknown'));
    uniqueAuthors.textContent = authors.size;
    
    const types = new Set();
    filteredCards.forEach(card => {
        if (card.type1) types.add(card.type1);
        if (card.type2) types.add(card.type2);
    });
    uniqueTypes.textContent = types.size;
}

// View a specific card (opens in a modal or new window)
function viewCard(index) {
    const card = filteredCards[index];
    if (!card) return;
    
    // For now, we'll show an alert with card details
    // In the future, this could open a modal or navigate to a detail page
    const cardDetails = `
🎴 ${card.name || 'Unknown Pokemon'}
👤 Author: ${card.author || 'Unknown'}
⚡ Types: ${formatTypes(card.type1, card.type2)}
❤️ HP: ${card.hp || 60}
⚔️ Attack: ${card.attack || 40}
🛡️ Defense: ${card.defense || 30}
✨ Ability: ${card.abilityName || 'Special Attack'}
📝 Description: ${card.description || 'No description available'}
📅 Created: ${formatDate(card.createdAt)}
    `;
    
    alert(cardDetails);
}

// Edit card in the main creator page
function editCardInCreator(index) {
    const card = filteredCards[index];
    if (!card) {
        alert('❌ Card not found!');
        return;
    }
    
    // Store the card data in sessionStorage for the main page to pick up
    sessionStorage.setItem('editCardData', JSON.stringify(card));
    sessionStorage.setItem('editMode', 'true');
    
    // Navigate to the main page
    window.location.href = '../index.html';
}

// Delete a specific card
async function deleteCard(index) {
    const card = filteredCards[index];
    if (!card) return;
    
    try {
        if (cardManager) {
            await cardManager.deleteCard(card.id);
        } else {
            // Fallback to localStorage method
            if (!confirm(`Are you sure you want to delete "${card.name || 'Unknown Pokemon'}"? This action cannot be undone.`)) {
                return;
            }
            
            // Find the card in the original allCards array and remove it
            const originalIndex = allCards.findIndex(c => 
                c.name === card.name && 
                c.createdAt === card.createdAt && 
                c.author === card.author
            );
            
            if (originalIndex !== -1) {
                allCards.splice(originalIndex, 1);
                localStorage.setItem('pokemonCards', JSON.stringify(allCards));
                alert(`"${card.name || 'Unknown Pokemon'}" has been deleted from your collection.`);
            }
        }
        
        // Refresh the display
        await loadAllCards();
        applyFilters();
        populateAuthorFilter();
        
    } catch (error) {
        console.error('Error deleting card:', error);
        alert('❌ Error deleting card. Please try again.');
    }
}
