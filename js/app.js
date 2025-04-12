class PuzzleGame {
    constructor() {
        console.log('Inicializando PuzzleGame');
        this.container = document.getElementById('puzzle-container');
        this.piecesContainer = document.getElementById('pieces-container');
        this.pieces = [];
        this.numPieces = 16; // Fijo a 16 piezas
        this.selectedCharacter = null;
        this.image = new Image();
        this.snapThreshold = 40; // Aumentado de 20 a 40 para hacer más fácil el ajuste
        this.draggedPiece = null;
        this.initialX = 0;
        this.initialY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.offset = { x: 0, y: 0 };
        this.gridSize = 4; // 4x4 para 16 piezas
        
        // Variables para la paginación
        this.currentPage = 1;
        this.charactersPerPage = 12; // Cambiado de 9 a 12
        this.totalPages = 0;
        this.allCharacters = [];
        
        // Cargar personajes completados del localStorage
        this.completedCharacters = this.loadCompletedCharacters();
        
        this.setupEventListeners();
        this.loadCharacters();
    }

    // Cargar personajes completados del localStorage
    loadCompletedCharacters() {
        const savedCharacters = localStorage.getItem('completedCharacters');
        return savedCharacters ? JSON.parse(savedCharacters) : [];
    }

    // Guardar un personaje completado en localStorage
    saveCompletedCharacter(character) {
        // Verificar si el personaje ya está en la lista
        const isAlreadyCompleted = this.completedCharacters.some(c => c.id === character.id);
        
        if (!isAlreadyCompleted) {
            this.completedCharacters.push(character);
            localStorage.setItem('completedCharacters', JSON.stringify(this.completedCharacters));
            console.log(`Personaje ${character.name} guardado como completado`);
        }
    }

    // Verificar si un personaje ya ha sido completado
    isCharacterCompleted(characterId) {
        return this.completedCharacters.some(c => c.id === characterId);
    }

    async loadCharacters() {
        try {
            // Obtener la información de paginación de la API
            const initialResponse = await fetch('https://rickandmortyapi.com/api/character');
            const initialData = await initialResponse.json();
            
            // Calcular el número total de páginas
            const totalPages = initialData.info.pages;
            console.log(`Total de páginas: ${totalPages}`);
            
            // Inicializar el array de personajes con los resultados de la primera página
            this.allCharacters = [...initialData.results];
            
            // Cargar el resto de las páginas
            const fetchPromises = [];
            for (let page = 2; page <= totalPages; page++) {
                fetchPromises.push(
                    fetch(`https://rickandmortyapi.com/api/character?page=${page}`)
                        .then(response => response.json())
                        .then(data => {
                            this.allCharacters = [...this.allCharacters, ...data.results];
                            console.log(`Página ${page} cargada: ${data.results.length} personajes`);
                        })
                        .catch(error => console.error(`Error al cargar la página ${page}:`, error))
                );
            }
            
            // Esperar a que todas las páginas se carguen
            await Promise.all(fetchPromises);
            
            console.log(`Total de personajes cargados: ${this.allCharacters.length}`);
            
            // Actualizar la información de paginación para la interfaz
            this.totalPages = Math.ceil(this.allCharacters.length / this.charactersPerPage);
            
            // Actualizar la información de paginación
            this.updatePaginationInfo();
            
            // Cargar la primera página
            this.displayCharactersForCurrentPage();
        } catch (error) {
            console.error('Error al cargar los personajes:', error);
        }
    }
    
    updatePaginationInfo() {
        const pageInfo = document.getElementById('page-info');
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        // Mostrar solo el número de página actual
        pageInfo.textContent = this.currentPage;
        
        // Habilitar/deshabilitar botones según la página actual
        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = this.currentPage === this.totalPages;
    }
    
    displayCharactersForCurrentPage() {
        const characterGrid = document.getElementById('character-grid');
        characterGrid.innerHTML = ''; // Limpiar la cuadrícula
        
        // Calcular el rango de personajes para la página actual
        const startIndex = (this.currentPage - 1) * this.charactersPerPage;
        const endIndex = Math.min(startIndex + this.charactersPerPage, this.allCharacters.length);
        
        // Mostrar los personajes de la página actual
        for (let i = startIndex; i < endIndex; i++) {
            const character = this.allCharacters[i];
            const characterOption = document.createElement('div');
            characterOption.className = 'character-option';
            characterOption.dataset.id = character.id;
            characterOption.dataset.image = character.image;
            
            // Verificar si el personaje ya ha sido completado
            if (this.isCharacterCompleted(character.id)) {
                characterOption.classList.add('completed');
                characterOption.classList.add('disabled');
                characterOption.style.cursor = 'not-allowed';
                characterOption.style.opacity = '0.7';
                characterOption.title = 'Ya has completado este personaje';
            } else {
                // Solo agregar el evento de clic si el personaje no está completado
                characterOption.addEventListener('click', () => {
                    this.selectedCharacter = character;
                    this.image.src = character.image;
                    this.startGame();
                });
            }
            
            const img = document.createElement('img');
            img.src = character.image;
            img.alt = character.name;
            
            const span = document.createElement('span');
            span.textContent = character.name;
            
            characterOption.appendChild(img);
            characterOption.appendChild(span);
            
            characterGrid.appendChild(characterOption);
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners');
        document.getElementById('start-game').addEventListener('click', () => this.showScreen('character-select-screen'));
        document.getElementById('play-again').addEventListener('click', () => this.showScreen('character-select-screen'));
        document.getElementById('back-to-start').addEventListener('click', () => this.showScreen('start-screen'));
        document.getElementById('back-to-character-select').addEventListener('click', () => this.showScreen('character-select-screen'));
        document.getElementById('view-completed').addEventListener('click', () => {
            this.displayCompletedCharacters();
            this.showScreen('completed-screen');
        });
        document.getElementById('back-to-start-from-completed').addEventListener('click', () => this.showScreen('start-screen'));
        
        // Event listeners para la paginación
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updatePaginationInfo();
                this.displayCharactersForCurrentPage();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.updatePaginationInfo();
                this.displayCharactersForCurrentPage();
            }
        });
    }

    showScreen(screenId) {
        console.log(`Mostrando pantalla: ${screenId}`);
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    startGame() {
        console.log('Iniciando juego');
        this.showScreen('game-screen');
        this.createPuzzlePieces();
    }

    createPuzzlePieces() {
        console.log('Creando piezas del puzzle');
        const container = document.getElementById('puzzle-container');
        const piecesContainer = document.getElementById('pieces-container');
        container.innerHTML = '';
        piecesContainer.innerHTML = '';
        this.pieces = [];

        const rows = this.gridSize;
        const pieceWidth = Math.floor(container.offsetWidth / rows);
        const pieceHeight = Math.floor(container.offsetHeight / rows);

        console.log(`Dimensiones de pieza: ${pieceWidth}x${pieceHeight}`);

        // Ajustar el tamaño de la imagen al contenedor
        const imageAspectRatio = this.image.width / this.image.height;
        const containerAspectRatio = container.offsetWidth / container.offsetHeight;
        
        let scaledWidth, scaledHeight;
        if (imageAspectRatio > containerAspectRatio) {
            scaledWidth = container.offsetWidth;
            scaledHeight = container.offsetWidth / imageAspectRatio;
        } else {
            scaledHeight = container.offsetHeight;
            scaledWidth = container.offsetHeight * imageAspectRatio;
        }

        console.log(`Dimensiones escaladas: ${scaledWidth}x${scaledHeight}`);

        // Crear la cuadrícula de guía
        for (let i = 0; i < this.numPieces; i++) {
            const row = Math.floor(i / rows);
            const col = i % rows;

            const guideCell = document.createElement('div');
            guideCell.className = 'puzzle-guide-cell';
            guideCell.style.width = `${pieceWidth}px`;
            guideCell.style.height = `${pieceHeight}px`;
            guideCell.style.position = 'absolute';
            guideCell.style.left = `${col * pieceWidth}px`;
            guideCell.style.top = `${row * pieceHeight}px`;
            guideCell.style.border = '1px dashed #999';
            container.appendChild(guideCell);

            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.style.width = `${pieceWidth}px`;
            piece.style.height = `${pieceHeight}px`;
            piece.style.position = 'absolute';
            piece.style.zIndex = '10';

            // Calcular la posición del background para mostrar la parte correcta de la imagen
            const bgX = (col * pieceWidth);
            const bgY = (row * pieceHeight);

            piece.style.backgroundImage = `url(${this.image.src})`;
            piece.style.backgroundSize = `${container.offsetWidth}px ${container.offsetHeight}px`;
            piece.style.backgroundPosition = `-${bgX}px -${bgY}px`;

            // Guardar la posición correcta como datos del elemento
            piece.dataset.row = row;
            piece.dataset.col = col;
            piece.dataset.correctX = col * pieceWidth;
            piece.dataset.correctY = row * pieceHeight;

            this.setupDragAndDrop(piece);
            piecesContainer.appendChild(piece);
            this.pieces.push(piece);
        }

        this.shufflePieces();
    }

    setupDragAndDrop(piece) {
        let isDragging = false;
        let currentContainer = null;

        const onStart = (e) => {
            e.preventDefault();
            console.log('Inicio de arrastre');
            
            isDragging = true;
            this.draggedPiece = piece;
            currentContainer = piece.parentElement;
            
            const rect = piece.getBoundingClientRect();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            this.offset = {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
            
            piece.style.zIndex = '1000';
            piece.classList.add('dragging');
        };

        const onMove = (e) => {
            if (!isDragging || !this.draggedPiece) return;
            
            const containerRect = currentContainer.getBoundingClientRect();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            const x = clientX - containerRect.left - this.offset.x;
            const y = clientY - containerRect.top - this.offset.y;
            
            this.draggedPiece.style.transform = `translate(${x}px, ${y}px)`;
            
            // Verificar si estamos cerca de una posición correcta mientras arrastramos
            const puzzleContainerRect = this.container.getBoundingClientRect();
            const mouseX = clientX - puzzleContainerRect.left;
            const mouseY = clientY - puzzleContainerRect.top;
            
            if (mouseX >= 0 && mouseX <= puzzleContainerRect.width &&
                mouseY >= 0 && mouseY <= puzzleContainerRect.height) {
                
                const cells = this.container.getElementsByClassName('puzzle-guide-cell');
                let closestCell = null;
                let minDistance = Infinity;
                
                for (const cell of cells) {
                    const cellRect = cell.getBoundingClientRect();
                    const cellCenterX = cellRect.left + cellRect.width / 2;
                    const cellCenterY = cellRect.top + cellRect.height / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(clientX - cellCenterX, 2) +
                        Math.pow(clientY - cellCenterY, 2)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCell = cell;
                    }
                }
                
                // Resaltar la celda más cercana
                cells.forEach(cell => cell.classList.remove('highlight'));
                if (closestCell && minDistance < this.snapThreshold) {
                    closestCell.classList.add('highlight');
                }
            }
        };

        const onEnd = (e) => {
            if (!isDragging || !this.draggedPiece) return;
            
            isDragging = false;
            console.log('Fin de arrastre');
            this.draggedPiece.classList.remove('dragging');
            
            const puzzleContainerRect = this.container.getBoundingClientRect();
            const clientX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.changedTouches[0].clientY : e.clientY;
            
            const mouseX = clientX - puzzleContainerRect.left;
            const mouseY = clientY - puzzleContainerRect.top;
            
            // Verificar si el mouse está sobre el contenedor del puzzle
            if (mouseX >= 0 && mouseX <= puzzleContainerRect.width &&
                mouseY >= 0 && mouseY <= puzzleContainerRect.height) {
                
                // Encontrar la celda más cercana
                const cells = this.container.getElementsByClassName('puzzle-guide-cell');
                let closestCell = null;
                let minDistance = Infinity;
                
                for (const cell of cells) {
                    const cellRect = cell.getBoundingClientRect();
                    const cellCenterX = cellRect.left + cellRect.width / 2;
                    const cellCenterY = cellRect.top + cellRect.height / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(clientX - cellCenterX, 2) +
                        Math.pow(clientY - cellCenterY, 2)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCell = cell;
                    }
                }
                
                // Si la distancia es menor que el umbral, ajustar la pieza
                if (minDistance < this.snapThreshold) {
                    const cellRect = closestCell.getBoundingClientRect();
                    
                    const x = cellRect.left - puzzleContainerRect.left;
                    const y = cellRect.top - puzzleContainerRect.top;
                    
                    // Mover la pieza al contenedor del puzzle
                    this.container.appendChild(this.draggedPiece);
                    this.draggedPiece.style.transform = `translate(${x}px, ${y}px)`;
                    this.draggedPiece.classList.add('snap');
                    
                    // Verificar si la pieza está en la posición correcta
                    const correctX = parseInt(this.draggedPiece.dataset.correctX);
                    const correctY = parseInt(this.draggedPiece.dataset.correctY);
                    
                    if (Math.abs(x - correctX) < 10 && Math.abs(y - correctY) < 10) {
                        this.draggedPiece.classList.add('correct');
                        this.checkWin();
                    }
                } else {
                    // Si no está cerca de ninguna celda, devolver la pieza al contenedor de piezas
                    this.piecesContainer.appendChild(this.draggedPiece);
                    const randomX = Math.random() * (this.piecesContainer.offsetWidth - this.draggedPiece.offsetWidth);
                    const randomY = Math.random() * (this.piecesContainer.offsetHeight - this.draggedPiece.offsetHeight);
                    this.draggedPiece.style.transform = `translate(${randomX}px, ${randomY}px)`;
                }
            } else {
                // Si está fuera del contenedor del puzzle, devolver la pieza al contenedor de piezas
                this.piecesContainer.appendChild(this.draggedPiece);
                const randomX = Math.random() * (this.piecesContainer.offsetWidth - this.draggedPiece.offsetWidth);
                const randomY = Math.random() * (this.piecesContainer.offsetHeight - this.draggedPiece.offsetHeight);
                this.draggedPiece.style.transform = `translate(${randomX}px, ${randomY}px)`;
            }
            
            // Quitar el resaltado de todas las celdas
            const cells = this.container.getElementsByClassName('puzzle-guide-cell');
            cells.forEach(cell => cell.classList.remove('highlight'));
        };

        // Eventos de mouse
        piece.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Eventos táctiles
        piece.addEventListener('touchstart', onStart);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);
    }

    shufflePieces() {
        console.log('Barajando piezas');
        const container = document.getElementById('pieces-container');
        const containerRect = container.getBoundingClientRect();
        
        this.pieces.forEach(piece => {
            const x = Math.random() * (containerRect.width - piece.offsetWidth);
            const y = Math.random() * (containerRect.height - piece.offsetHeight);
            piece.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    checkWin() {
        // Verificar que todas las piezas estén en el contenedor del puzzle y en la posición correcta
        const allCorrect = this.pieces.every(piece => {
            const isInPuzzleContainer = piece.parentElement === this.container;
            const isCorrect = piece.classList.contains('correct');
            return isInPuzzleContainer && isCorrect;
        });

        console.log(`Verificando victoria: ${allCorrect ? '¡Ganaste!' : 'Sigue intentando'}`);
        
        if (allCorrect) {
            // Guardar el personaje completado
            this.saveCompletedCharacter(this.selectedCharacter);
            
            // Actualizar la imagen y el mensaje en la pantalla de victoria
            const victoryImage = document.querySelector('.victory-logo');
            const victoryMessage = document.querySelector('.victory-message');
            victoryImage.src = this.selectedCharacter.image;
            victoryImage.alt = this.selectedCharacter.name;
            victoryMessage.textContent = `¡Has conseguido a ${this.selectedCharacter.name}!`;
            
            // Mostrar la pantalla de victoria después de un breve retraso
            setTimeout(() => this.showScreen('victory-screen'), 500);
        }
    }

    // Mostrar los personajes completados
    displayCompletedCharacters() {
        const completedGrid = document.getElementById('completed-characters');
        completedGrid.innerHTML = ''; // Limpiar la cuadrícula
        
        // Mantener el encabezado
        const header = document.createElement('div');
        header.className = 'character-grid-header';
        header.textContent = 'Tus personajes completados';
        completedGrid.appendChild(header);
        
        if (this.completedCharacters.length === 0) {
            const noCompleted = document.createElement('div');
            noCompleted.className = 'no-completed-message';
            noCompleted.textContent = 'Aún no has completado ningún personaje. ¡Comienza a jugar!';
            completedGrid.appendChild(noCompleted);
            return;
        }
        
        // Mostrar los personajes completados
        this.completedCharacters.forEach(character => {
            const characterOption = document.createElement('div');
            characterOption.className = 'character-option';
            characterOption.dataset.id = character.id;
            characterOption.dataset.image = character.image;
            
            const img = document.createElement('img');
            img.src = character.image;
            img.alt = character.name;
            
            const span = document.createElement('span');
            span.textContent = character.name;
            
            characterOption.appendChild(img);
            characterOption.appendChild(span);
            
            // Agregar evento de clic para mostrar el modal con los detalles
            characterOption.addEventListener('click', () => {
                this.showCharacterDetails(character);
            });
            
            completedGrid.appendChild(characterOption);
        });
    }
    
    // Método para mostrar los detalles del personaje en el modal
    showCharacterDetails(character) {
        const modal = document.getElementById('character-modal');
        const modalName = document.getElementById('modal-character-name');
        const modalImage = document.getElementById('modal-character-image');
        const modalStatus = document.getElementById('modal-character-status');
        const modalSpecies = document.getElementById('modal-character-species');
        const modalOrigin = document.getElementById('modal-character-origin');
        const modalLocation = document.getElementById('modal-character-location');
        
        // Llenar el modal con los datos del personaje
        modalName.textContent = character.name;
        modalImage.src = character.image;
        modalImage.alt = character.name;
        modalStatus.textContent = character.status;
        modalSpecies.textContent = character.species;
        modalOrigin.textContent = character.origin.name;
        modalLocation.textContent = character.location.name;
        
        // Mostrar el modal
        modal.classList.add('active');
        
        // Agregar evento para cerrar el modal
        const closeButton = document.getElementById('modal-close');
        closeButton.onclick = () => {
            modal.classList.remove('active');
        };
        
        // Cerrar el modal al hacer clic fuera de él
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    }
}

// Inicializar el juego cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada, inicializando juego');
    const game = new PuzzleGame();
}); 
