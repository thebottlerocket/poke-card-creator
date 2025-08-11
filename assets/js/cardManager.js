// Enhanced Card Management System
// Provides full CRUD operations with better UX

class CardManager {
    constructor() {
        this.currentEditingCard = null;
        this.isEditMode = false;
    }

    // Initialize the card manager
    async init() {
        try {
            await window.pokemonDB.init();
            console.log('Card Manager initialized with IndexedDB');
            
            // Debug: Check both storage systems
            await this.debugStorageStatus();
            
            // First, try to restore from localStorage if IndexedDB is empty
            await this.restoreFromLocalStorageIfNeeded();
            
            // Then migrate any new localStorage data
            await this.migrateFromLocalStorage();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize database, falling back to localStorage:', error);
            return false;
        }
    }

    // Debug function to check storage status
    async debugStorageStatus() {
        try {
            console.log('=== Storage Debug Info ===');
            
            // Check localStorage
            const localCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            console.log(`localStorage cards: ${localCards.length}`);
            
            // Check IndexedDB
            const indexedCards = await window.pokemonDB.getAllCards();
            console.log(`IndexedDB cards: ${indexedCards.length}`);
            
            // Check origin and persistence
            console.log(`Current origin: ${window.location.origin}`);
            console.log(`Local storage available: ${typeof(Storage) !== "undefined"}`);
            console.log(`IndexedDB available: ${typeof(indexedDB) !== "undefined"}`);
            
            // Check if persistent storage is available
            if (navigator.storage && navigator.storage.persist) {
                const persistent = await navigator.storage.persist();
                console.log(`Persistent storage: ${persistent}`);
            }
            
            console.log('=== End Storage Debug ===');
        } catch (error) {
            console.error('Debug storage error:', error);
        }
    }

    // Migrate existing localStorage data to IndexedDB (only once per session)
    async migrateFromLocalStorage() {
        try {
            // Check if we've already done migration this session
            if (sessionStorage.getItem('migrationAttempted')) {
                console.log('Migration already attempted this session, skipping...');
                return;
            }
            
            const existingCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            const indexedCards = await window.pokemonDB.getAllCards();
            
            // Only migrate if localStorage has different/more cards than IndexedDB
            if (existingCards.length > 0 && existingCards.length !== indexedCards.length) {
                console.log(`Migrating ${existingCards.length} cards from localStorage to IndexedDB...`);
                
                for (const card of existingCards) {
                    // Check if card already exists to avoid duplicates
                    const existingCard = await window.pokemonDB.getCard(card.id);
                    if (!existingCard) {
                        await window.pokemonDB.saveCard(card);
                    }
                }
                
                console.log('Migration completed successfully - localStorage kept as backup');
                this.showNotification('✅ Cards migrated to improved storage system!', 'success');
            }
            
            // Mark that we've attempted migration this session
            sessionStorage.setItem('migrationAttempted', 'true');
            
        } catch (error) {
            console.error('Migration error:', error);
        }
    }

    // Save a new card
    async saveCard() {
        try {
            const cardData = this.getCardDataFromForm();
            
            if (this.isEditMode && this.currentEditingCard) {
                // Update existing card
                cardData.id = this.currentEditingCard.id;
                cardData.createdAt = this.currentEditingCard.createdAt;
                await window.pokemonDB.updateCard(cardData);
                this.showNotification('🎉 Card updated successfully!', 'success');
                this.exitEditMode();
            } else {
                // Save new card
                await window.pokemonDB.saveCard(cardData);
                this.showNotification('🎉 Card saved to your collection!', 'success');
                this.clearForm();
            }
            
            // ALWAYS save to localStorage as backup
            await this.saveToLocalStorageBackup();
            
            // Refresh displays
            await this.refreshCollectionDisplay();
            
        } catch (error) {
            console.error('Error saving card:', error);
            this.showNotification('❌ Error saving card. Please try again.', 'error');
        }
    }

    // Always maintain localStorage backup
    async saveToLocalStorageBackup() {
        try {
            const allCards = await window.pokemonDB.getAllCards();
            localStorage.setItem('pokemonCards', JSON.stringify(allCards));
            console.log(`Backup: Saved ${allCards.length} cards to localStorage`);
        } catch (error) {
            console.error('Error creating localStorage backup:', error);
        }
    }

    // Restore cards from localStorage if IndexedDB is empty (only run once per session)
    async restoreFromLocalStorageIfNeeded() {
        try {
            // Check if we've already done a restore this session
            if (sessionStorage.getItem('restoreAttempted')) {
                console.log('Restore already attempted this session, skipping...');
                return;
            }
            
            const indexedCards = await window.pokemonDB.getAllCards();
            const localCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            
            // Only restore if IndexedDB is completely empty but localStorage has cards
            if (indexedCards.length === 0 && localCards.length > 0) {
                console.log(`Restoring ${localCards.length} cards from localStorage backup...`);
                
                for (const card of localCards) {
                    await window.pokemonDB.saveCard(card);
                }
                
                this.showNotification('🔄 Cards restored from backup!', 'success');
                console.log('Cards successfully restored from localStorage backup');
            }
            
            // Mark that we've attempted restore this session
            sessionStorage.setItem('restoreAttempted', 'true');
            
        } catch (error) {
            console.error('Error restoring from localStorage:', error);
        }
    }

    // Load a card for editing
    async loadCardForEdit(cardId) {
        try {
            const card = await window.pokemonDB.getCard(cardId);
            if (!card) {
                this.showNotification('❌ Card not found!', 'error');
                return;
            }

            this.currentEditingCard = card;
            this.isEditMode = true;
            
            // Fill form with card data
            this.populateFormWithCard(card);
            
            // Update UI to show edit mode
            this.enterEditMode();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error loading card for edit:', error);
            this.showNotification('❌ Error loading card for editing.', 'error');
        }
    }

    // Delete a card
    async deleteCard(cardId) {
        try {
            const card = await window.pokemonDB.getCard(cardId);
            if (!card) {
                this.showNotification('❌ Card not found!', 'error');
                return;
            }

            const confirmed = confirm(`Are you sure you want to delete "${card.name}"?\n\nThis action cannot be undone.`);
            if (!confirmed) return;

            await window.pokemonDB.deleteCard(cardId);
            
            // IMPORTANT: Update localStorage backup to reflect deletion
            await this.saveToLocalStorageBackup();
            
            this.showNotification(`🗑️ "${card.name}" deleted successfully!`, 'success');
            
            // Refresh displays
            await this.refreshCollectionDisplay();
            
        } catch (error) {
            console.error('Error deleting card:', error);
            this.showNotification('❌ Error deleting card. Please try again.', 'error');
        }
    }

    // Get all cards
    async getAllCards() {
        try {
            return await window.pokemonDB.getAllCards();
        } catch (error) {
            console.error('Error getting cards:', error);
            return [];
        }
    }

    // Search cards
    async searchCards(query, filters = {}) {
        try {
            let cards = await window.pokemonDB.getAllCards();
            
            // Apply text search
            if (query) {
                cards = cards.filter(card => 
                    card.name.toLowerCase().includes(query.toLowerCase()) ||
                    (card.description && card.description.toLowerCase().includes(query.toLowerCase())) ||
                    (card.abilityName && card.abilityName.toLowerCase().includes(query.toLowerCase()))
                );
            }
            
            // Apply filters
            if (filters.author) {
                cards = cards.filter(card => card.author === filters.author);
            }
            
            if (filters.type) {
                cards = cards.filter(card => card.type1 === filters.type || card.type2 === filters.type);
            }
            
            return cards;
        } catch (error) {
            console.error('Error searching cards:', error);
            return [];
        }
    }

    // Export collection to file
    async exportCollection() {
        try {
            const exportData = await window.pokemonDB.exportToJSON();
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `pokemon-cards-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showNotification('📦 Collection exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting collection:', error);
            this.showNotification('❌ Error exporting collection.', 'error');
        }
    }

    // Import collection from file
    async importCollection(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            const importedCards = await window.pokemonDB.importFromJSON(importData);
            
            this.showNotification(`✅ Imported ${importedCards.length} cards successfully!`, 'success');
            
            // Refresh displays
            await this.refreshCollectionDisplay();
            
        } catch (error) {
            console.error('Error importing collection:', error);
            this.showNotification('❌ Error importing collection. Please check the file format.', 'error');
        }
    }

    // Get collection statistics
    async getStats() {
        try {
            return await window.pokemonDB.getStats();
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalCards: 0,
                uniqueAuthors: 0,
                uniqueTypes: 0,
                authors: [],
                types: []
            };
        }
    }

    // Helper methods
    getCardDataFromForm() {
        let type1 = document.getElementById('pokemonType').value;
        let type2 = document.getElementById('pokemonType2').value;
        
        // Prevent duplicate types
        if (type1 && type2 && type1 === type2) {
            type2 = '';
        }
        
        return {
            name: document.getElementById('pokemonName').value || 'Unknown Pokemon',
            author: document.getElementById('cardAuthor').value || 'Unknown',
            type1: type1,
            type2: type2,
            description: document.getElementById('pokemonDescription').value || 'A mysterious Pokemon',
            hp: parseInt(document.getElementById('hp').value) || 60,
            attack: parseInt(document.getElementById('attack').value) || 40,
            defense: parseInt(document.getElementById('defense').value) || 30,
            weakness: document.getElementById('weakness').value || '',
            resistance: document.getElementById('resistance').value || '',
            abilityName: document.getElementById('abilityName').value || 'Special Ability',
            abilityDescription: document.getElementById('abilityDescription').value || 'An amazing ability!',
            image: window.currentCardImage
        };
    }

    populateFormWithCard(card) {
        document.getElementById('pokemonName').value = card.name || '';
        document.getElementById('cardAuthor').value = card.author || '';
        document.getElementById('pokemonType').value = card.type1 || 'Electric';
        document.getElementById('pokemonType2').value = card.type2 || '';
        document.getElementById('pokemonDescription').value = card.description || '';
        document.getElementById('hp').value = card.hp || 60;
        document.getElementById('attack').value = card.attack || 40;
        document.getElementById('defense').value = card.defense || 30;
        document.getElementById('weakness').value = card.weakness || '';
        document.getElementById('resistance').value = card.resistance || '';
        document.getElementById('abilityName').value = card.abilityName || '';
        document.getElementById('abilityDescription').value = card.abilityDescription || '';
        
        // Load image
        if (card.image) {
            window.currentCardImage = card.image;
            const imageElement = document.getElementById('cardImage');
            const placeholderImage = document.getElementById('placeholderImage');
            
            imageElement.src = card.image;
            imageElement.style.display = 'block';
            placeholderImage.style.display = 'none';
        }
        
        // Update card preview
        updateCard();
    }

    clearForm() {
        document.getElementById('pokemonName').value = 'Pikachu';
        document.getElementById('cardAuthor').value = '';
        document.getElementById('pokemonType').value = 'Electric';
        document.getElementById('pokemonType2').value = '';
        document.getElementById('pokemonDescription').value = 'A friendly Electric-type Pokemon that stores electricity in its cheek pouches!';
        document.getElementById('hp').value = 60;
        document.getElementById('attack').value = 40;
        document.getElementById('defense').value = 30;
        document.getElementById('abilityName').value = 'Thunder Shock';
        document.getElementById('abilityDescription').value = 'Deals 20 damage to the opponent and has a chance to paralyze them!';
        
        // Clear image
        window.currentCardImage = null;
        const imageElement = document.getElementById('cardImage');
        const placeholderImage = document.getElementById('placeholderImage');
        
        imageElement.style.display = 'none';
        placeholderImage.style.display = 'block';
        
        updateCard();
    }

    enterEditMode() {
        this.isEditMode = true;
        
        // Update save button
        const saveButton = document.querySelector('button[onclick="saveCard()"]');
        if (saveButton) {
            saveButton.textContent = '✏️ Update Pokemon Card';
            saveButton.style.background = '#ff9800';
        }
        
        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'button';
        cancelButton.textContent = '❌ Cancel Edit';
        cancelButton.style.background = '#f44336';
        cancelButton.style.marginLeft = '10px';
        cancelButton.onclick = () => this.exitEditMode();
        
        saveButton.parentNode.insertBefore(cancelButton, saveButton.nextSibling);
        
        // Show edit notification
        this.showNotification('✏️ Edit mode: Make your changes and click Update!', 'info');
    }

    exitEditMode() {
        this.isEditMode = false;
        this.currentEditingCard = null;
        
        // Reset save button
        const saveButton = document.querySelector('button[onclick="saveCard()"]');
        if (saveButton) {
            saveButton.textContent = '💾 Save Pokemon Card';
            saveButton.style.background = '#4caf50';
        }
        
        // Remove cancel button
        const cancelButton = saveButton.parentNode.querySelector('button[onclick*="exitEditMode"]');
        if (cancelButton) {
            cancelButton.remove();
        }
        
        // Clear form
        this.clearForm();
    }

    async refreshCollectionDisplay() {
        // Refresh main page collection if it exists
        if (typeof displayCollection === 'function') {
            await displayCollection();
        }
        
        // Refresh collection page if we're on it
        if (window.location.pathname.includes('collection.html')) {
            if (typeof loadAllCards === 'function') {
                loadAllCards();
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Create global card manager instance
window.cardManager = new CardManager();
