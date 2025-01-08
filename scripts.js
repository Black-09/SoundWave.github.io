const suggestionsContainer = document.getElementById('suggestions-container');
const sourceLinksContainer = document.getElementById('source-links');
const audioPlayer = document.getElementById('audio-player');
const filteredContent = document.getElementById('filtered-content');
let selectedVideoId = null;
let selectedTitle = null;
let currentSuggestions = []; // Almacenar las sugerencias actuales
let originalSearchTerm = ''; // Variable para almacenar el término de búsqueda original
let currentGroupIndex = 0; // Índice del grupo actual
let groupedResults = []; // Almacenar los resultados agrupados

// Permitir la reproducción automática después de cualquier interacción del usuario
document.addEventListener('click', enableAutoplay, { once: true });

function enableAutoplay() {
    console.log('Interacción del usuario detectada. La reproducción automática está habilitada.');
}

// Función de debouncing
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Lógica para mostrar sugerencias mientras se escribe (con debouncing)
document.getElementById('song-name').addEventListener('input', debounce(function () {
    const songName = this.value;
    suggestionsContainer.innerHTML = ''; // Limpiar sugerencias anteriores

    if (songName) {
        originalSearchTerm = songName.toLowerCase(); // Normalizar el término de búsqueda
        fetchSuggestions(songName); // Llamar a la función de búsqueda
    } else {
        // Si el campo está vacío, limpiar las sugerencias y la lista de resultados
        clearSuggestionsAndResults();
    }
}, 300)); // 300 ms de retraso

// Lógica para buscar y mostrar resultados al presionar "Buscar"
document.getElementById('search-button').addEventListener('click', function () {
    const songName = document.getElementById('song-name').value;
    if (songName) {
        originalSearchTerm = songName.toLowerCase(); // Normalizar el término de búsqueda
        suggestionsContainer.innerHTML = ''; // Limpiar las sugerencias al buscar
        fetchSearchResults(songName); // Llamar a la función de búsqueda
    } else {
        alert('Por favor, ingresa el nombre de una canción o artista.');
    }
});

// Función para limpiar sugerencias y resultados
function clearSuggestionsAndResults() {
    suggestionsContainer.innerHTML = ''; // Limpiar sugerencias
    filteredContent.innerHTML = ''; // Limpiar resultados
    sourceLinksContainer.innerHTML = ''; // Limpiar enlaces de audio
    stopAudioPlayer(); // Detener el reproductor de audio
}

// Función para mostrar sugerencias o resultados
function showItems(items, container, isSuggestion = false) {
    // Crear un fragmento de documento para evitar múltiples actualizaciones del DOM
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.textContent = item.title; // Mostrar el título
        itemElement.classList.add('suggestion');
        itemElement.addEventListener('click', function () {
            if (isSuggestion) {
                // Si es una sugerencia, llenar el campo de búsqueda con el título
                document.getElementById('song-name').value = item.title;

                // Ocultar las sugerencias
                suggestionsContainer.style.display = 'none';

                // Ocultar los enlaces de audio
                sourceLinksContainer.innerHTML = '';

                // Buscar automáticamente
                fetchSearchResults(item.title);
            } else {
                // Si es un resultado, seleccionar la canción
                selectedVideoId = item.videoId;
                selectedTitle = item.title;
                stopAudioPlayer(); // Detener el reproductor de audio
                clearSourceLinks(); // Limpiar los enlaces anteriores
                fetchSourceCode(selectedVideoId); // Obtener y verificar los enlaces <source src>
            }
        });
        fragment.appendChild(itemElement);
    });

    // Limpiar el contenedor y agregar el fragmento
    container.innerHTML = '';
    container.appendChild(fragment);

    // Mostrar el contenedor
    container.style.display = 'block';
}

// Función para buscar sugerencias mientras se escribe
function fetchSuggestions(songName) {
    const url = 'https://inv.nadeko.net/search?q=' + encodeURIComponent(songName);

    fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url))
        .then(response => {
            if (response.ok) return response.text();
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const divs = doc.querySelectorAll('div.video-card-row');

            // Filtrar y mostrar sugerencias
            const newSuggestions = Array.from(divs)
                .map(div => {
                    const link = div.querySelector('a');
                    const titleElement = link ? link.querySelector('p') : null;
                    const title = titleElement ? titleElement.innerText : 'Sin título';
                    const videoId = link ? link.getAttribute('href').split('v=')[1] : null;
                    const lengthElement = div.querySelector('.length'); // Obtener la duración del video
                    const length = lengthElement ? lengthElement.innerText : 'Desconocida'; // Obtener duración si existe
                    return { title, videoId, length }; // Agregar duración
                })
                .filter(suggestion => {
                    // Filtrar sugerencias que incluyan el nombre del artista o canción
                    const searchTerm = originalSearchTerm.toLowerCase();
                    const songTitle = suggestion.title.toLowerCase();

                    // Verificar si el título incluye el nombre del artista o canción
                    const includesSearchTerm = (
                        songTitle.includes(searchTerm) || // Coincidencia parcial
                        searchTerm.split(' ').every(term => songTitle.includes(term)) // Coincidencia de todas las palabras
                    );

                    // Excluir canciones que contengan "oficial" o "Official" (opcional)
                    const excludesOfficial = !songTitle.includes('oficial') && !songTitle.includes('official');

                    return includesSearchTerm && excludesOfficial;
                });

            // Limitar a 5 sugerencias
            const limitedSuggestions = newSuggestions.slice(0, 5);

            // Comparar con las sugerencias actuales
            if (JSON.stringify(limitedSuggestions) !== JSON.stringify(currentSuggestions)) {
                currentSuggestions = limitedSuggestions;
                showItems(currentSuggestions, suggestionsContainer, true);
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            suggestionsContainer.innerHTML = '<div class="suggestion">Error al cargar las sugerencias.</div>';
        });
}

// Función para buscar en múltiples páginas
async function fetchSearchResults(songName) {
    const maxPages = 6; // Número máximo de páginas a buscar
    let allResults = [];

    for (let page = 1; page <= maxPages; page++) {
        const url = `https://inv.nadeko.net/search?q=${encodeURIComponent(songName)}&page=${page}`;

        try {
            const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
            if (!response.ok) throw new Error('Network response was not ok.');

            const data = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const divs = doc.querySelectorAll('div.video-card-row');

            // Filtrar y mostrar resultados
            const searchResults = Array.from(divs)
                .map(div => {
                    const link = div.querySelector('a');
                    const titleElement = link ? link.querySelector('p') : null;
                    const title = titleElement ? titleElement.innerText : 'Sin título';
                    const videoId = link ? link.getAttribute('href').split('v=')[1] : null;
                    return { title, videoId }; // Retornar el título y el videoId como resultado
                })
                .filter(result => {
                    // Filtrar resultados que incluyan el nombre del artista o canción
                    const searchTerm = originalSearchTerm.toLowerCase();
                    const songTitle = result.title.toLowerCase();

                    // Verificar si el título incluye el nombre del artista o canción
                    const includesSearchTerm = (
                        songTitle.includes(searchTerm) || // Coincidencia parcial
                        searchTerm.split(' ').every(term => songTitle.includes(term)) // Coincidencia de todas las palabras
                    );

                    // Excluir canciones que contengan "oficial" o "Official" (opcional)
                    const excludesOfficial = !songTitle.includes('oficial') && !songTitle.includes('official');

                    return includesSearchTerm && excludesOfficial;
                });

            // Agregar los resultados de esta página a la lista completa
            allResults = allResults.concat(searchResults);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    // Agrupar resultados en bloques de 5
    groupedResults = [];
    for (let i = 0; i < allResults.length; i += 5) {
        groupedResults.push(allResults.slice(i, i + 5));
    }

    // Mostrar el primer grupo de resultados
    currentGroupIndex = 0;
    showGroupedResults();
}

// Función para mostrar resultados agrupados
function showGroupedResults() {
    filteredContent.innerHTML = ''; // Limpiar contenedor

    // Mostrar el grupo actual
    const currentGroup = groupedResults[currentGroupIndex];
    showItems(currentGroup, filteredContent); // Mostrar los resultados

    // Mostrar el número de grupo
    const groupInfo = document.createElement('div');
    groupInfo.classList.add('group-info');
    groupInfo.textContent = `Grupo ${currentGroupIndex + 1} de ${groupedResults.length}`;
    filteredContent.appendChild(groupInfo);

    // Agregar botones de navegación si hay más de un grupo
    if (groupedResults.length > 1) {
        const separator = document.createElement('div');
        separator.classList.add('group-separator');

        // Botón para retroceder
        if (currentGroupIndex > 0) {
            const prevButton = document.createElement('button');
            prevButton.textContent = '<';
            prevButton.addEventListener('click', function () {
                currentGroupIndex--;
                showGroupedResults();
            });
            separator.appendChild(prevButton);
        }

        // Botón para avanzar
        if (currentGroupIndex < groupedResults.length - 1) {
            const nextButton = document.createElement('button');
            nextButton.textContent = '>';
            nextButton.addEventListener('click', function () {
                currentGroupIndex++;
                showGroupedResults();
            });
            separator.appendChild(nextButton);
        }

        filteredContent.appendChild(separator);
    }
}

// Función para obtener y verificar los enlaces <source src>
function fetchSourceCode(videoId, groupIndex = currentGroupIndex, resultIndex = 0) {
    const watchUrl = `https://inv.nadeko.net/watch?v=${videoId}&listen=1`;
    const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;

    fetch(allOriginsUrl)
        .then(response => {
            if (response.ok) return response.text();
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const sourceElements = doc.querySelectorAll('source[src]');
            const audioElements = doc.querySelectorAll('audio[src]');

            // Obtener todos los enlaces de audio
            const sourceLinks = Array.from(sourceElements).map(source => source.src);
            const audioLinks = Array.from(audioElements).map(audio => audio.src);
            const allLinks = [...sourceLinks, ...audioLinks];

            // Verificar la accesibilidad de los enlaces
            checkAccessibleLinks(allLinks, videoId, groupIndex, resultIndex);
        })
        .catch(error => {
            console.error('Error fetching source code:', error);
            sourceLinksContainer.textContent = 'No se pudo cargar el código fuente.';
            // Intentar con el siguiente video si hay un error
            findNextVideo(groupIndex, resultIndex);
        });
}

// Función para verificar la accesibilidad de los enlaces
async function checkAccessibleLinks(links, videoId, groupIndex, resultIndex) {
    const accessibleLinks = [];

    // Verificar cada enlace en paralelo
    const linkChecks = links.map(link =>
        fetch(link)
            .then(response => {
                if (response.ok) {
                    accessibleLinks.push(link); // Agregar enlace válido a la lista
                    return true; // Enlace válido
                } else {
                    return false; // Enlace no válido
                }
            })
            .catch(() => false) // Enlace no válido si hay un error
    );

    // Esperar a que todas las verificaciones terminen
    await Promise.all(linkChecks);

    if (accessibleLinks.length > 0) {
        // Si hay enlaces válidos, mostrarlos en la lista y reproducir el primero
        sourceLinksContainer.innerHTML = accessibleLinks
            .map(link => `<div class="audio-link">${link}</div>`)
            .join('\n');
        playAudio(accessibleLinks[0]);
    } else {
        // Si no hay enlaces válidos, buscar en el siguiente video
        findNextVideo(groupIndex, resultIndex);
    }
}

// Función para buscar en el siguiente video
function findNextVideo(groupIndex, resultIndex) {
    // Verificar si hay más resultados en el grupo actual
    if (resultIndex < groupedResults[groupIndex].length - 1) {
        // Buscar en el siguiente resultado del grupo actual
        const nextResult = groupedResults[groupIndex][resultIndex + 1];
        selectedVideoId = nextResult.videoId;
        selectedTitle = nextResult.title;
        fetchSourceCode(selectedVideoId, groupIndex, resultIndex + 1);
    } else if (groupIndex < groupedResults.length - 1) {
        // Buscar en el primer resultado del siguiente grupo
        const nextGroup = groupedResults[groupIndex + 1];
        if (nextGroup.length > 0) {
            const nextResult = nextGroup[0];
            selectedVideoId = nextResult.videoId;
            selectedTitle = nextResult.title;
            fetchSourceCode(selectedVideoId, groupIndex + 1, 0);
        }
    } else {
        // No hay más videos para buscar
        sourceLinksContainer.textContent = 'No se encontraron enlaces de audio válidos.';
    }
}

// Función para reproducir audio automáticamente
function playAudio(audioUrl) {
    audioPlayer.src = audioUrl;
    audioPlayer.play()
        .then(() => {
            console.log('Audio reproducido automáticamente.');

            // Ocultar la lista de sugerencias y resultados
            suggestionsContainer.style.display = 'none'; // Ocultar sugerencias
            filteredContent.style.display = 'none'; // Ocultar resultados
        })
        .catch(error => {
            console.error('Error al reproducir el audio automáticamente:', error);
            alert('Haz clic en el botón de reproducción del reproductor de audio.');
        });
}

// Funciones auxiliares
function showSelectedSong() {
    if (selectedVideoId && selectedTitle) {
        filteredContent.innerHTML = `<strong>${selectedTitle}</strong>`; // Solo mostrar el título
    } else {
        filteredContent.innerHTML = 'No se ha seleccionado ninguna canción.';
    }
}

function stopAudioPlayer() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = ''; // Limpiar la fuente de audio
}

function clearSourceLinks() {
    sourceLinksContainer.innerHTML = '';
}