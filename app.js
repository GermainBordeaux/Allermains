// Éléments du DOM
const cardsGrid = document.getElementById('cardsGrid');
const searchInput = document.getElementById('searchInput');
const rarityFilter = document.getElementById('rarityFilter');
const refreshBtn = document.getElementById('refreshBtn');
const errorMessage = document.getElementById('errorMessage');

// Variables globales
let allCards = [];

// Fonction pour afficher une erreur
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Fonction pour charger les cartes depuis Supabase
async function loadCards() {
    cardsGrid.innerHTML = '<div class="loading">Chargement des cartes...</div>';
    
    try {
        const { data, error } = await supabase
            .from('cards')
            .select('*');

        if (error) {
            throw new Error(`Erreur Supabase: ${error.message}`);
        }

        if (!data || data.length === 0) {
            cardsGrid.innerHTML = '<div class="loading">Aucune carte trouvée</div>';
            return;
        }

        allCards = data;
        filterAndDisplayCards();
    } catch (error) {
        console.error('Erreur:', error);
        showError(`Impossible de charger les cartes : ${error.message}`);
        cardsGrid.innerHTML = '<div class="loading">Erreur de chargement</div>';
    }
}

// Fonction pour afficher les cartes
function displayCards(cards) {
    if (cards.length === 0) {
        cardsGrid.innerHTML = '<div class="loading">Aucune carte ne correspond à votre recherche</div>';
        return;
    }

    cardsGrid.innerHTML = cards.map(card => createCardElement(card)).join('');
}

// Fonction pour créer un élément de carte
function createCardElement(card) {
    const rarityClass = `rarity-${card.rarity || 'common'}`.toLowerCase();
    const imageUrl = card.image_url || '';
    const imageHtml = imageUrl 
        ? `<img src="${imageUrl}" alt="${card.allergy_name}">`
        : `<div style="font-size: 3em;">🧬</div>`;

    return `
        <div class="card">
            <div class="card-image">
                ${imageHtml}
            </div>
            <div class="card-content">
                <div class="card-title">${card.allergy_name}</div>
                <div class="card-code">#${card.code}</div>
                <div class="card-description">${card.description || 'Pas de description'}</div>
                <div class="card-rarity ${rarityClass}">${card.rarity || 'Commun'}</div>
            </div>
        </div>
    `;
}

// Fonction pour filtrer et afficher les cartes
function filterAndDisplayCards() {
    let filtered = allCards;

    // Filtrer par recherche
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(card =>
            card.allergy_name.toLowerCase().includes(searchTerm) ||
            card.code.toLowerCase().includes(searchTerm) ||
            (card.description && card.description.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrer par rareté
    const rarityValue = rarityFilter.value;
    if (rarityValue) {
        filtered = filtered.filter(card =>
            (card.rarity || 'common').toLowerCase() === rarityValue.toLowerCase()
        );
    }

    displayCards(filtered);
}

// Événements
searchInput.addEventListener('input', filterAndDisplayCards);
rarityFilter.addEventListener('change', filterAndDisplayCards);
refreshBtn.addEventListener('click', loadCards);

// Charger les cartes au démarrage
loadCards();
