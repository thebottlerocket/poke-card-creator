// Jellytop Cookie's Pokemon Card Creator - Main JavaScript
// Global variable to store current card image
window.currentCardImage = null;

// Helper function to resize and display image in the card
function resizeAndDisplayImage(imageSource, isBase64 = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match the card image area (200px x 120px from CSS)
            const targetWidth = 200;
            const targetHeight = 120;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Calculate scaling to maintain aspect ratio while filling the area
            const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Center the image
            const offsetX = (targetWidth - scaledWidth) / 2;
            const offsetY = (targetHeight - scaledHeight) / 2;
            
            // Fill background with a subtle color
            ctx.fillStyle = '#f0f8ff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            
            // Draw the resized image
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            
            // Get the resized image as data URL
            const resizedImageData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Display the resized image in the card
            const imageElement = document.getElementById('cardImage');
            const placeholderImage = document.getElementById('placeholderImage');
            
            imageElement.src = resizedImageData;
            imageElement.style.display = 'block';
            placeholderImage.style.display = 'none';
            window.currentCardImage = resizedImageData;
            
            resolve(resizedImageData);
        };
        
        img.onerror = function() {
            reject(new Error('Error loading image'));
        };
        
        img.src = imageSource;
        if (!isBase64) {
            img.crossOrigin = 'anonymous';
        }
    });
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ Image file is too large! Please choose a file smaller than 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            await resizeAndDisplayImage(e.target.result, true);
            alert('✅ Image uploaded and resized perfectly for your Pokemon card!');
        } catch (error) {
            alert('❌ Error processing image. Please try a different file.');
        }
    };
    
    reader.onerror = function() {
        alert('❌ Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
}

// Save card preview as PNG
async function saveCardAsPNG() {
    const cardElement = document.getElementById('pokemonCard');
    
    try {
        // Use html2canvas library (we'll add it via CDN)
        if (typeof html2canvas === 'undefined') {
            // Fallback method using canvas
            await saveCardAsCanvasPNG();
            return;
        }
        
        // Wait for any images to load before capturing
        const images = cardElement.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails to load
            });
        }));
        
        const canvas = await html2canvas(cardElement, {
            backgroundColor: '#ffffff',
            scale: 3, // Higher quality for printing
            useCORS: true,
            allowTaint: true,
            // Remove fixed width/height to capture the full element
            // The element itself is 250x350 + borders + padding
        });
        
        // Create download link
        const link = document.createElement('a');
        const pokemonName = document.getElementById('pokemonName').value || 'Pokemon';
        link.download = `${pokemonName}_Card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('📸 Pokemon card saved as PNG!');
    } catch (error) {
        console.error('Error saving card:', error);
        // Fallback to simpler method
        await saveCardAsCanvasPNG();
    }
}

// Fallback method to save card as PNG using canvas
async function saveCardAsCanvasPNG() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 600;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#f0f8ff');
    gradient.addColorStop(1, '#e6f3ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);
    
    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 392, 592);
    
    // Pokemon name
    const name = document.getElementById('pokemonName').value || 'Unknown Pokemon';
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, 200, 50);
    
    // Types
    const type1 = document.getElementById('pokemonType').value;
    const type2 = document.getElementById('pokemonType2').value;
    let typeText = `${getTypeIcon(type1)} ${type1}`;
    if (type2) typeText += ` | ${getTypeIcon(type2)} ${type2}`;
    
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(typeText, 200, 90);
    
    // Image area
    ctx.fillStyle = '#667eea';
    ctx.fillRect(50, 110, 300, 200);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Pokemon Image', 200, 220);
    
    // Try to draw the actual image if available
    if (window.currentCardImage) {
        try {
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 50, 110, 300, 200);
                continueDrawingCard();
            };
            img.src = window.currentCardImage;
            return; // Wait for image to load
        } catch (error) {
            console.log('Could not draw image, continuing without it');
        }
    }
    
    continueDrawingCard();
    
    function continueDrawingCard() {
        // Description
        const description = document.getElementById('pokemonDescription').value || 'A mysterious Pokemon';
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        wrapText(ctx, description, 200, 350, 320, 18);
        
        // Stats
        const hp = document.getElementById('hp').value || 0;
        const attack = document.getElementById('attack').value || 0;
        const defense = document.getElementById('defense').value || 0;
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`HP: ${hp}`, 100, 420);
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText(`ATK: ${attack}`, 200, 420);
        ctx.fillStyle = '#a8e6cf';
        ctx.fillText(`DEF: ${defense}`, 300, 420);
        
        // Ability
        const abilityName = document.getElementById('abilityName').value || 'Special Ability';
        const abilityDesc = document.getElementById('abilityDescription').value || 'An amazing ability!';
        
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(abilityName, 200, 470);
        ctx.font = '12px Arial';
        wrapText(ctx, abilityDesc, 200, 490, 320, 16);
        
        // Download the canvas
        const link = document.createElement('a');
        const pokemonName = document.getElementById('pokemonName').value || 'Pokemon';
        link.download = `${pokemonName}_Card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('📸 Pokemon card saved as PNG!');
    }
}

// Helper function to wrap text
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

// Generate image with OpenAI DALL-E
async function generateImageWithDALLE() {
    const apiKey = document.getElementById('openaiApiKey').value;
    const name = document.getElementById('pokemonName').value || 'Unknown Pokemon';
    const type1 = document.getElementById('pokemonType').value;
    const type2 = document.getElementById('pokemonType2').value;
    const description = document.getElementById('pokemonDescription').value || 'A mysterious Pokemon';
    
    if (!apiKey) {
        alert('Please enter your OpenAI API key to generate DALL-E images!\n\nGet your API key at: https://platform.openai.com/api-keys\n\n(You can use the same account as your ChatGPT Plus subscription)');
        return;
    }
    
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '🎨 Generating...';
    button.disabled = true;
    
    try {
        // Create a detailed prompt for DALL-E
        let typeText = type1;
        if (type2) {
            typeText += ` and ${type2}`;
        }
        
        const prompt = `A cute, colorful cartoon Pokemon creature named "${name}". This Pokemon is ${typeText} type. ${description}. Art style: official Pokemon artwork, bright vibrant colors, friendly appearance, anime/manga style, suitable for children. The Pokemon should clearly show characteristics of its ${typeText} typing. High quality digital art.`;
        
        console.log('DALL-E prompt:', prompt);
        
        // Call OpenAI DALL-E API
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                style: "vivid"
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log('DALL-E response:', data);
        
        if (data.data && data.data[0] && data.data[0].url) {
            const imageUrl = data.data[0].url;
            
            try {
                // Use our helper function to resize and display the image
                await resizeAndDisplayImage(imageUrl, false);
                alert('🎉 Amazing! DALL-E generated a beautiful Pokemon image for you!');
            } catch (error) {
                console.error('Error processing DALL-E image:', error);
                // Fallback to direct display if resizing fails
                const imageElement = document.getElementById('cardImage');
                const placeholderImage = document.getElementById('placeholderImage');
                imageElement.src = imageUrl;
                imageElement.style.display = 'block';
                placeholderImage.style.display = 'none';
                window.currentCardImage = imageUrl;
                alert('🎉 DALL-E image generated! (Note: Image may not be perfectly sized)');
            }
        } else {
            throw new Error('No image data received from DALL-E');
        }
        
    } catch (error) {
        console.error('DALL-E error:', error);
        
        // Fall back to placeholder
        await generatePlaceholderImage();
        
        if (error.message.includes('billing') || error.message.includes('quota')) {
            alert('💳 OpenAI API billing issue. Please check your account at platform.openai.com\n\nUsing placeholder image for now.');
        } else if (error.message.includes('401')) {
            alert('🔑 Invalid API key. Please check your OpenAI API key.\n\nUsing placeholder image for now.');
        } else {
            alert(`❌ DALL-E error: ${error.message}\n\nUsing placeholder image for now.`);
        }
    } finally {
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Generate image with Hugging Face (free)
async function generateImageWithHuggingFace() {
    const name = document.getElementById('pokemonName').value || 'Unknown Pokemon';
    const type1 = document.getElementById('pokemonType').value;
    const type2 = document.getElementById('pokemonType2').value;
    const description = document.getElementById('pokemonDescription').value || 'A mysterious Pokemon';
    
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '🤖 Generating...';
    button.disabled = true;
    
    try {
        // Create a detailed prompt for image generation
        let typeText = type1;
        if (type2) {
            typeText += ` and ${type2}`;
        }
        
        const prompt = `cute colorful cartoon pokemon creature, ${typeText} type, ${description}, anime style, bright colors, friendly, kawaii`;
        
        // Using Hugging Face's free Stable Diffusion API
        const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    negative_prompt: "scary, dark, realistic, violent, weapon",
                    num_inference_steps: 20,
                    guidance_scale: 7.5
                }
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Use the resizing helper to properly size and display the image
            try {
                await resizeAndDisplayImage(imageUrl);
                alert('🎉 AI image generated successfully! The image has been added to your Pokemon card.');
            } catch (resizeError) {
                console.error('Error resizing HuggingFace image:', resizeError);
                // Fallback to original display method
                const imageElement = document.getElementById('cardImage');
                const placeholderImage = document.getElementById('placeholderImage');
                
                imageElement.src = imageUrl;
                imageElement.style.display = 'block';
                placeholderImage.style.display = 'none';
                
                // Convert to base64 for storage
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    window.currentCardImage = canvas.toDataURL();
                };
                img.src = imageUrl;
                
                alert('🎉 AI image generated successfully! The image has been added to your Pokemon card.');
            }
        } else {
            throw new Error('Failed to generate image');
        }
        
    } catch (error) {
        console.error('Error generating image:', error);
        
        // Fallback to placeholder if API fails
        await generatePlaceholderImage();
        alert('⚡ Free AI service is busy! Generated a colorful placeholder instead. Try again in a few minutes for AI-generated images.');
    } finally {
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Generate a colorful placeholder image
async function generatePlaceholderImage() {
    const name = document.getElementById('pokemonName').value || 'Unknown Pokemon';
    const type1 = document.getElementById('pokemonType').value;
    const type2 = document.getElementById('pokemonType2').value;
    
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Get type colors
    const typeColors = {
        'Electric': '#ffd700',
        'Fire': '#ff6b6b',
        'Water': '#4ecdc4',
        'Grass': '#a8e6cf',
        'Ground': '#d4a574',
        'Rock': '#8d7053',
        'Flying': '#e0c3fc',
        'Fighting': '#ff9a9e',
        'Psychic': '#a8edea',
        'Dark': '#667eea',
        'Steel': '#c9d6ff',
        'Dragon': '#667eea',
        'Fairy': '#ffecd2'
    };
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 300, 200);
    gradient.addColorStop(0, typeColors[type1] || '#667eea');
    gradient.addColorStop(1, type2 ? typeColors[type2] || '#764ba2' : '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 200);
    
    // Add cute shapes and patterns
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 300, Math.random() * 200, Math.random() * 20 + 5, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Add Pokemon name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(name, 150, 100);
    ctx.fillText(name, 150, 100);
    
    // Add type icons
    ctx.font = '32px Arial';
    if (type2) {
        ctx.strokeText(getTypeIcon(type1) + ' ' + getTypeIcon(type2), 150, 140);
        ctx.fillText(getTypeIcon(type1) + ' ' + getTypeIcon(type2), 150, 140);
    } else {
        ctx.strokeText(getTypeIcon(type1), 150, 140);
        ctx.fillText(getTypeIcon(type1), 150, 140);
    }
    
    // Display the image
    const imageElement = document.getElementById('cardImage');
    const placeholderImage = document.getElementById('placeholderImage');
    const imageDataUrl = canvas.toDataURL();
    
    imageElement.src = imageDataUrl;
    imageElement.style.display = 'block';
    placeholderImage.style.display = 'none';
    window.currentCardImage = imageDataUrl;
}

// Get type icon
function getTypeIcon(type) {
    const icons = {
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
    return icons[type] || '❓';
}

// Update card preview in real-time
function updateCard() {
    const name = document.getElementById('pokemonName').value || 'Unknown Pokemon';
    const author = document.getElementById('cardAuthor').value || 'Unknown';
    const type1 = document.getElementById('pokemonType').value;
    const type2 = document.getElementById('pokemonType2').value;
    const description = document.getElementById('pokemonDescription').value || 'A mysterious Pokemon';
    const hp = document.getElementById('hp').value || 0;
    const attack = document.getElementById('attack').value || 0;
    const defense = document.getElementById('defense').value || 0;
    const abilityName = document.getElementById('abilityName').value || 'Special Ability';
    const abilityDescription = document.getElementById('abilityDescription').value || 'An amazing ability!';
    
    // Update preview
    document.getElementById('cardName').textContent = name;
    document.getElementById('cardDescription').textContent = description;
    document.getElementById('cardHP').textContent = `HP ${hp}`;
    document.getElementById('cardAttack').textContent = attack;
    document.getElementById('cardDefense').textContent = defense;
    document.getElementById('cardAbilityName').textContent = abilityName;
    document.getElementById('cardAbilityDescription').textContent = abilityDescription;
    document.getElementById('cardAuthorName').textContent = author;
    
    // Update types display
    let typesText = getTypeIcon(type1) + ' ' + type1;
    if (type2) {
        typesText += ' | ' + getTypeIcon(type2) + ' ' + type2;
    }
    document.getElementById('cardTypes').textContent = typesText;
}

// Save card to collection
async function saveCard() {
    if (window.cardManager) {
        await window.cardManager.saveCard();
    } else {
        // Fallback to old method
        const cardData = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            name: document.getElementById('pokemonName').value || 'Unknown Pokemon',
            author: document.getElementById('cardAuthor').value || 'Unknown',
            type1: document.getElementById('pokemonType').value,
            type2: document.getElementById('pokemonType2').value,
            description: document.getElementById('pokemonDescription').value || 'A mysterious Pokemon',
            hp: document.getElementById('hp').value || 0,
            attack: document.getElementById('attack').value || 0,
            defense: document.getElementById('defense').value || 0,
            abilityName: document.getElementById('abilityName').value || 'Special Ability',
            abilityDescription: document.getElementById('abilityDescription').value || 'An amazing ability!',
            image: window.currentCardImage
        };
        
        // Get existing cards
        const existingCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        
        // Add new card
        existingCards.push(cardData);
        
        // Save to localStorage
        localStorage.setItem('pokemonCards', JSON.stringify(existingCards));
        
        // Refresh collection display
        displayCollection();
        
        alert('🎉 Pokemon card saved to your collection!');
    }
}

// Display saved cards collection
async function displayCollection() {
    let cards = [];
    
    // Try to get cards from new database first
    if (window.cardManager) {
        try {
            cards = await window.cardManager.getAllCards();
        } catch (error) {
            console.error('Error loading cards from database:', error);
            // Fallback to localStorage
            cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        }
    } else {
        // Fallback to localStorage
        cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
    }
    
    const collection = document.getElementById('cardCollection');
    
    if (cards.length === 0) {
        collection.innerHTML = '<p style="text-align: center; color: #666; font-size: 18px; padding: 40px;">✨ No cards saved yet. Create your first Pokemon card! ✨</p>';
        return;
    }
    
    collection.innerHTML = cards.map((card, index) => {
        // Ensure card has an ID
        const cardId = card.id || `card_${index}_${Date.now()}`;
        
        return `
        <div class="card-item" data-card-id="${cardId}" data-card-index="${index}">
            ${card.image ? `<img src="${card.image}" alt="${card.name}">` : `<div style="height: 140px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: white; font-size: 16px; border: 2px solid #ffd700;">🎨 No Image</div>`}
            <h4>${card.name}</h4>
            <p style="font-size: 0.9em; margin: 5px 0; color: #666;">${card.author ? `By: ${card.author}` : ''}</p>
            <p>${getTypeIcon(card.type1)} ${card.type1}${card.type2 ? ' | ' + getTypeIcon(card.type2) + ' ' + card.type2 : ''}</p>
            <div class="stats-mini">
                HP: ${card.hp} | ATK: ${card.attack} | DEF: ${card.defense}
            </div>
            <div class="card-actions" style="display: flex; gap: 5px; margin-top: 10px;">
                <button class="edit-button" onclick="editCardByIndex(${index})" style="background: #ff9800; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; flex: 1;">✏️ Edit</button>
                <button class="delete-button" onclick="deleteCardByIndex(${index})" style="background: #ff4444; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; flex: 1;">🗑️ Delete</button>
            </div>
        </div>
        `;
    }).join('');
}

// Delete card from collection
async function deleteCard(id) {
    if (window.cardManager) {
        await window.cardManager.deleteCard(id);
    } else {
        // Fallback to old method
        if (confirm('Are you sure you want to delete this Pokemon card?')) {
            const cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            const filteredCards = cards.filter(card => card.id !== id);
            localStorage.setItem('pokemonCards', JSON.stringify(filteredCards));
            displayCollection();
        }
    }
}

// Edit a specific card
async function editCard(cardId) {
    if (window.cardManager) {
        await window.cardManager.loadCardForEdit(cardId);
    } else {
        alert('Edit functionality requires the enhanced database system.');
    }
}

// Edit card by index (for main page collection)
async function editCardByIndex(index) {
    try {
        let cards = [];
        
        // Get cards using the same method as displayCollection
        if (window.cardManager) {
            try {
                cards = await window.cardManager.getAllCards();
            } catch (error) {
                console.error('Error loading cards from database:', error);
                cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            }
        } else {
            cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        }
        
        const card = cards[index];
        if (!card) {
            alert('❌ Card not found!');
            return;
        }
        
        if (window.cardManager && card.id) {
            await window.cardManager.loadCardForEdit(card.id);
        } else {
            // Manual edit for cards without proper IDs
            populateFormWithCard(card);
            window.currentEditingCardIndex = index;
            enterEditModeManual();
        }
        
    } catch (error) {
        console.error('Error editing card:', error);
        alert('❌ Error loading card for editing.');
    }
}

// Delete card by index (for main page collection)
async function deleteCardByIndex(index) {
    try {
        let cards = [];
        
        // Get cards using the same method as displayCollection
        if (window.cardManager) {
            try {
                cards = await window.cardManager.getAllCards();
            } catch (error) {
                console.error('Error loading cards from database:', error);
                cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            }
        } else {
            cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        }
        
        const card = cards[index];
        if (!card) {
            alert('❌ Card not found!');
            return;
        }
        
        if (window.cardManager && card.id) {
            await window.cardManager.deleteCard(card.id);
        } else {
            // Manual delete for cards without proper IDs
            if (confirm(`Are you sure you want to delete "${card.name}"? This action cannot be undone.`)) {
                cards.splice(index, 1);
                localStorage.setItem('pokemonCards', JSON.stringify(cards));
                displayCollection();
                alert(`"${card.name}" has been deleted!`);
            }
        }
        
    } catch (error) {
        console.error('Error deleting card:', error);
        alert('❌ Error deleting card.');
    }
}

// Export collection to file
async function exportCollection() {
    if (window.cardManager) {
        await window.cardManager.exportCollection();
    } else {
        // Fallback export from localStorage
        const cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        const exportData = {
            exportDate: new Date().toISOString(),
            cardCount: cards.length,
            cards: cards
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `pokemon-cards-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        alert('📦 Collection exported successfully!');
    }
}

// Import collection from file
async function importCollection(file) {
    if (!file) return;
    
    if (window.cardManager) {
        await window.cardManager.importCollection(file);
    } else {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (importData.cards && Array.isArray(importData.cards)) {
                const existingCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
                const newCards = importData.cards.map(card => ({
                    ...card,
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    importedAt: new Date().toISOString()
                }));
                
                const allCards = [...existingCards, ...newCards];
                localStorage.setItem('pokemonCards', JSON.stringify(allCards));
                
                displayCollection();
                alert(`✅ Imported ${newCards.length} cards successfully!`);
            } else {
                alert('❌ Invalid file format. Please select a valid Pokemon card collection file.');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('❌ Error importing collection. Please check the file format.');
        }
    }
}

// Show collection statistics
async function showStats() {
    if (window.cardManager) {
        try {
            const stats = await window.cardManager.getStats();
            const message = `📊 Collection Statistics:

🎴 Total Cards: ${stats.totalCards}
👥 Unique Authors: ${stats.uniqueAuthors}
🎯 Types Used: ${stats.uniqueTypes}

📋 Authors: ${stats.authors.join(', ') || 'None'}
🔥 Types: ${stats.types.join(', ') || 'None'}

${stats.oldestCard ? `📅 Oldest Card: ${stats.oldestCard.name} (${new Date(stats.oldestCard.createdAt).toLocaleDateString()})` : ''}
${stats.newestCard ? `📅 Newest Card: ${stats.newestCard.name} (${new Date(stats.newestCard.createdAt).toLocaleDateString()})` : ''}`;
            
            alert(message);
        } catch (error) {
            console.error('Error getting stats:', error);
            alert('❌ Error loading statistics.');
        }
    } else {
        // Fallback stats from localStorage
        const cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        const authors = [...new Set(cards.map(card => card.author).filter(Boolean))];
        const types = [...new Set(cards.flatMap(card => [card.type1, card.type2].filter(Boolean)))];
        
        const message = `📊 Collection Statistics:

🎴 Total Cards: ${cards.length}
👥 Unique Authors: ${authors.length}
🎯 Types Used: ${types.length}

📋 Authors: ${authors.join(', ') || 'None'}
🔥 Types: ${types.join(', ') || 'None'}`;
        
        alert(message);
    }
}

// Helper function to populate form with card data
function populateFormWithCard(card) {
    document.getElementById('pokemonName').value = card.name || '';
    document.getElementById('cardAuthor').value = card.author || '';
    document.getElementById('pokemonType').value = card.type1 || 'Electric';
    document.getElementById('pokemonType2').value = card.type2 || '';
    document.getElementById('pokemonDescription').value = card.description || '';
    document.getElementById('hp').value = card.hp || 60;
    document.getElementById('attack').value = card.attack || 40;
    document.getElementById('defense').value = card.defense || 30;
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

// Manual edit mode for cards without proper database integration
function enterEditModeManual() {
    window.isManualEditMode = true;
    
    // Update save button
    const saveButton = document.querySelector('button[onclick="saveCard()"]');
    if (saveButton) {
        saveButton.textContent = '✏️ Update Pokemon Card';
        saveButton.style.background = '#ff9800';
        saveButton.onclick = updateCardManual;
    }
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'button';
    cancelButton.textContent = '❌ Cancel Edit';
    cancelButton.style.background = '#f44336';
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = exitEditModeManual;
    
    saveButton.parentNode.insertBefore(cancelButton, saveButton.nextSibling);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    alert('✏️ Edit mode: Make your changes and click Update!');
}

// Update card manually (for localStorage cards)
function updateCardManual() {
    if (window.currentEditingCardIndex === undefined) {
        alert('❌ No card selected for editing.');
        return;
    }
    
    const cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
    const cardIndex = window.currentEditingCardIndex;
    
    if (cardIndex >= 0 && cardIndex < cards.length) {
        // Update the card with new data
        cards[cardIndex] = {
            ...cards[cardIndex],
            name: document.getElementById('pokemonName').value || 'Unknown Pokemon',
            author: document.getElementById('cardAuthor').value || 'Unknown',
            type1: document.getElementById('pokemonType').value,
            type2: document.getElementById('pokemonType2').value,
            description: document.getElementById('pokemonDescription').value || 'A mysterious Pokemon',
            hp: parseInt(document.getElementById('hp').value) || 60,
            attack: parseInt(document.getElementById('attack').value) || 40,
            defense: parseInt(document.getElementById('defense').value) || 30,
            abilityName: document.getElementById('abilityName').value || 'Special Ability',
            abilityDescription: document.getElementById('abilityDescription').value || 'An amazing ability!',
            image: window.currentCardImage,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('pokemonCards', JSON.stringify(cards));
        displayCollection();
        exitEditModeManual();
        alert('🎉 Card updated successfully!');
    } else {
        alert('❌ Error: Card not found.');
    }
}

// Exit manual edit mode
function exitEditModeManual() {
    window.isManualEditMode = false;
    window.currentEditingCardIndex = undefined;
    
    // Reset save button
    const saveButton = document.querySelector('button[onclick*="updateCardManual"], button[onclick="saveCard()"]');
    if (saveButton) {
        saveButton.textContent = '💾 Save Pokemon Card';
        saveButton.style.background = '#4caf50';
        saveButton.onclick = saveCard;
    }
    
    // Remove cancel button
    const cancelButton = saveButton.parentNode.querySelector('button[onclick*="exitEditModeManual"]');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Clear form
    clearFormToDefaults();
}

// Clear form to default values
function clearFormToDefaults() {
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

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the enhanced card management system
    if (window.cardManager) {
        try {
            await window.cardManager.init();
            console.log('Enhanced card management system initialized');
        } catch (error) {
            console.error('Failed to initialize card management system:', error);
        }
    }
    
    // Check if we need to load a card for editing (from collection page)
    const editCardData = sessionStorage.getItem('editCardData');
    const editMode = sessionStorage.getItem('editMode');
    
    if (editCardData && editMode === 'true') {
        try {
            const card = JSON.parse(editCardData);
            // Clear session storage
            sessionStorage.removeItem('editCardData');
            sessionStorage.removeItem('editMode');
            
            // Load the card for editing
            setTimeout(() => {
                populateFormWithCard(card);
                enterEditModeFromCollection(card);
                // Scroll to top to show the form
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error('Error loading card for editing:', error);
            sessionStorage.removeItem('editCardData');
            sessionStorage.removeItem('editMode');
        }
    }
    
    const inputs = ['pokemonName', 'cardAuthor', 'pokemonType', 'pokemonType2', 'pokemonDescription', 'hp', 'attack', 'defense', 'abilityName', 'abilityDescription'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateCard);
            element.addEventListener('change', updateCard);
        }
    });
    
    // Add image upload event listener
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
    // Load saved OpenAI API key
    const savedOpenAIKey = localStorage.getItem('openaiApiKey');
    if (savedOpenAIKey) {
        document.getElementById('openaiApiKey').value = savedOpenAIKey;
    }
    
    // Save OpenAI API key when changed
    document.getElementById('openaiApiKey').addEventListener('input', function() {
        localStorage.setItem('openaiApiKey', this.value);
    });
    
    // Initial update and load collection
    updateCard();
    displayCollection();
});

// Enter edit mode when coming from collection page
function enterEditModeFromCollection(card) {
    window.isCollectionEditMode = true;
    window.currentEditingCard = card;
    
    // Update save button
    const saveButton = document.querySelector('button[onclick="saveCard()"]');
    if (saveButton) {
        saveButton.textContent = '✏️ Update Pokemon Card';
        saveButton.style.background = '#ff9800';
        saveButton.onclick = updateCardFromCollection;
    }
    
    // Add cancel and back buttons
    const buttonContainer = saveButton.parentNode;
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'button';
    cancelButton.textContent = '❌ Cancel Edit';
    cancelButton.style.background = '#f44336';
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = exitCollectionEditMode;
    
    // Back to collection button
    const backButton = document.createElement('button');
    backButton.className = 'button';
    backButton.textContent = '📚 Back to Collection';
    backButton.style.background = '#2196f3';
    backButton.style.marginLeft = '10px';
    backButton.onclick = () => window.location.href = 'pages/collection.html';
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(backButton);
    
    // Show notification
    showEditNotification('✏️ Editing card from collection. Make your changes and click Update!');
}

// Update card when editing from collection
async function updateCardFromCollection() {
    if (!window.currentEditingCard) {
        alert('❌ No card selected for editing.');
        return;
    }
    
    try {
        const updatedCardData = {
            ...window.currentEditingCard,
            name: document.getElementById('pokemonName').value || 'Unknown Pokemon',
            author: document.getElementById('cardAuthor').value || 'Unknown',
            type1: document.getElementById('pokemonType').value,
            type2: document.getElementById('pokemonType2').value,
            description: document.getElementById('pokemonDescription').value || 'A mysterious Pokemon',
            hp: parseInt(document.getElementById('hp').value) || 60,
            attack: parseInt(document.getElementById('attack').value) || 40,
            defense: parseInt(document.getElementById('defense').value) || 30,
            abilityName: document.getElementById('abilityName').value || 'Special Ability',
            abilityDescription: document.getElementById('abilityDescription').value || 'An amazing ability!',
            image: window.currentCardImage,
            updatedAt: new Date().toISOString()
        };
        
        // Try to update using card manager first
        if (window.cardManager && updatedCardData.id) {
            await window.cardManager.updateCard(updatedCardData);
        } else {
            // Fallback to localStorage update
            const cards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
            const cardIndex = cards.findIndex(c => 
                c.id === updatedCardData.id || 
                (c.name === window.currentEditingCard.name && 
                 c.createdAt === window.currentEditingCard.createdAt)
            );
            
            if (cardIndex !== -1) {
                cards[cardIndex] = updatedCardData;
                localStorage.setItem('pokemonCards', JSON.stringify(cards));
            }
        }
        
        showEditNotification('🎉 Card updated successfully! Redirecting to collection...', 'success');
        
        // Redirect back to collection page after a short delay
        setTimeout(() => {
            window.location.href = 'pages/collection.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error updating card:', error);
        showEditNotification('❌ Error updating card. Please try again.', 'error');
    }
}

// Exit collection edit mode
function exitCollectionEditMode() {
    window.isCollectionEditMode = false;
    window.currentEditingCard = null;
    
    // Reset save button
    const saveButton = document.querySelector('button[onclick*="updateCardFromCollection"], button[onclick="saveCard()"]');
    if (saveButton) {
        saveButton.textContent = '💾 Save Pokemon Card';
        saveButton.style.background = '#4caf50';
        saveButton.onclick = saveCard;
    }
    
    // Remove added buttons
    const buttonContainer = saveButton.parentNode;
    const cancelButton = buttonContainer.querySelector('button[onclick*="exitCollectionEditMode"]');
    const backButton = buttonContainer.querySelector('button[onclick*="collection.html"]');
    
    if (cancelButton) cancelButton.remove();
    if (backButton) backButton.remove();
    
    // Clear form
    clearFormToDefaults();
    
    // Navigate back to collection
    window.location.href = 'pages/collection.html';
}

// Show edit notification
function showEditNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.edit-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `edit-notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 400px;
        font-weight: 500;
        color: white;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background: linear-gradient(135deg, #4caf50, #45a049);' : 
          type === 'error' ? 'background: linear-gradient(135deg, #f44336, #d32f2f);' : 
          'background: linear-gradient(135deg, #2196f3, #1976d2);'}
    `;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 18px; font-weight: bold; cursor: pointer; margin-left: 10px; padding: 0; width: 25px; height: 25px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
