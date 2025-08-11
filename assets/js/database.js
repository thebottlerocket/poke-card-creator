// Pokemon Card Database Management using IndexedDB
// This provides much better persistence than localStorage

class PokemonCardDB {
    constructor() {
        this.dbName = 'PokemonCardCreator';
        this.dbVersion = 1;
        this.storeName = 'cards';
        this.db = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                this.db = e.target.result;
                
                // Create object store if it doesn't exist
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = this.db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    
                    // Create indexes for searching
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('author', 'author', { unique: false });
                    objectStore.createIndex('type1', 'type1', { unique: false });
                    objectStore.createIndex('type2', 'type2', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    
                    console.log('Database setup complete');
                }
            };
        });
    }

    // Save a card
    async saveCard(cardData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            
            // Ensure the card has an ID and timestamp
            if (!cardData.id) {
                cardData.id = Date.now() + Math.random().toString(36).substr(2, 9);
            }
            if (!cardData.createdAt) {
                cardData.createdAt = new Date().toISOString();
            }
            cardData.updatedAt = new Date().toISOString();
            
            const request = objectStore.put(cardData);
            
            request.onsuccess = () => {
                console.log('Card saved successfully:', cardData.name);
                resolve(cardData);
            };
            
            request.onerror = () => {
                console.error('Error saving card:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all cards
    async getAllCards() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('Error getting cards:', request.error);
                reject(request.error);
            };
        });
    }

    // Get a specific card by ID
    async getCard(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Error getting card:', request.error);
                reject(request.error);
            };
        });
    }

    // Update a card
    async updateCard(cardData) {
        cardData.updatedAt = new Date().toISOString();
        return this.saveCard(cardData);
    }

    // Delete a card
    async deleteCard(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);
            
            request.onsuccess = () => {
                console.log('Card deleted successfully');
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Error deleting card:', request.error);
                reject(request.error);
            };
        });
    }

    // Search cards by name
    async searchCardsByName(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const index = objectStore.index('name');
            const request = index.getAll();
            
            request.onsuccess = () => {
                const allCards = request.result || [];
                const filteredCards = allCards.filter(card => 
                    card.name.toLowerCase().includes(name.toLowerCase())
                );
                resolve(filteredCards);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get cards by author
    async getCardsByAuthor(author) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const index = objectStore.index('author');
            const request = index.getAll(author);
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get cards by type
    async getCardsByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                const allCards = request.result || [];
                const filteredCards = allCards.filter(card => 
                    card.type1 === type || card.type2 === type
                );
                resolve(filteredCards);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Export all cards to JSON
    async exportToJSON() {
        const cards = await this.getAllCards();
        return {
            exportDate: new Date().toISOString(),
            cardCount: cards.length,
            cards: cards
        };
    }

    // Import cards from JSON
    async importFromJSON(jsonData) {
        const importedCards = [];
        
        if (jsonData.cards && Array.isArray(jsonData.cards)) {
            for (const card of jsonData.cards) {
                try {
                    // Generate new ID to avoid conflicts
                    const newCard = {
                        ...card,
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        importedAt: new Date().toISOString()
                    };
                    
                    const savedCard = await this.saveCard(newCard);
                    importedCards.push(savedCard);
                } catch (error) {
                    console.error('Error importing card:', card.name, error);
                }
            }
        }
        
        return importedCards;
    }

    // Get database statistics
    async getStats() {
        const cards = await this.getAllCards();
        const authors = [...new Set(cards.map(card => card.author).filter(Boolean))];
        const types = [...new Set(cards.flatMap(card => [card.type1, card.type2].filter(Boolean)))];
        
        return {
            totalCards: cards.length,
            uniqueAuthors: authors.length,
            uniqueTypes: types.length,
            authors: authors,
            types: types,
            oldestCard: cards.reduce((oldest, card) => 
                !oldest || card.createdAt < oldest.createdAt ? card : oldest, null),
            newestCard: cards.reduce((newest, card) => 
                !newest || card.createdAt > newest.createdAt ? card : newest, null)
        };
    }

    // Clear all data (with confirmation)
    async clearAllData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();
            
            request.onsuccess = () => {
                console.log('All cards deleted');
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Error clearing data:', request.error);
                reject(request.error);
            };
        });
    }
}

// Create global database instance
window.pokemonDB = new PokemonCardDB();
