// Variables globales
let currentGroupIndex = 0;
let currentResultIndex = 0;
const resultsPerGroup = 5; // Ajustar según el número de resultados por grupo

// Función principal para procesar los videos y obtener los enlaces
function processVideos(videoIds) {
    // Llamamos a la función para obtener los enlaces del primer video
    fetchSourceCode(videoIds[0], currentGroupIndex, currentResultIndex);
}

// Función para obtener y verificar los enlaces <source src>
function fetchSourceCode(videoId, groupIndex = currentGroupIndex, resultIndex = 0) {
    // Usamos primero la URL predeterminada
    const watchUrl = `https://yewtu.be/watch?v=${videoId}&listen=1`;
    const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;

    // Intentamos obtener los enlaces de audio desde la URL predeterminada
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

            // Verificar si hay enlaces válidos, si no, intentamos con la URL alternativa
            if (allLinks.length > 0) {
                checkAccessibleLinks(allLinks, videoId, groupIndex, resultIndex);
            } else {
                // Si no se encontraron enlaces, intentamos con la URL alternativa
                const alternativeWatchUrl = `https://inv.nadeko.net/watch?v=${videoId}&listen=1`;
                const alternativeAllOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(alternativeWatchUrl)}`;
                
                // Intentamos obtener los enlaces de audio desde la URL alternativa
                fetch(alternativeAllOriginsUrl)
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
                        console.error('Error fetching alternative source code:', error);
                        displayErrorMessage();
                    });
            }
        })
        .catch(error => {
            console.error('Error fetching source code:', error);
            displayErrorMessage();
        });
}

// Función para verificar la accesibilidad de los enlaces
function checkAccessibleLinks(links, videoId, groupIndex, resultIndex) {
    // Verificamos si los enlaces son accesibles (si la respuesta es correcta)
    links.forEach(link => {
        fetch(link)
            .then(response => {
                if (response.ok) {
                    console.log(`Enlace válido: ${link}`);
                    // Aquí se puede hacer algo con el enlace válido, por ejemplo, mostrarlo al usuario
                } else {
                    console.log(`Enlace no accesible: ${link}`);
                }
            })
            .catch(error => {
                console.error('Error al verificar el enlace:', error);
            });
    });

    // Intentar con el siguiente video si hay más en el grupo
    findNextVideo(groupIndex, resultIndex);
}

// Función para encontrar el siguiente video a procesar
function findNextVideo(groupIndex, resultIndex) {
    currentResultIndex++;
    if (currentResultIndex >= resultsPerGroup) {
        currentResultIndex = 0;
        currentGroupIndex++;
    }

    // Aquí podemos cargar más videos si es necesario
    const videoIds = getVideoIdsForGroup(groupIndex); // Función que obtiene los IDs de videos para el grupo
    if (videoIds.length > 0) {
        fetchSourceCode(videoIds[currentResultIndex], groupIndex, currentResultIndex);
    }
}

// Función para obtener los IDs de videos para un grupo (puede depender de la lógica que utilices)
function getVideoIdsForGroup(groupIndex) {
    // Aquí deberías devolver los IDs de los videos de ese grupo específico
    // Esta función debe ser implementada según la estructura de tus datos
    return [];
}

// Función para mostrar un mensaje de error
function displayErrorMessage() {
    const sourceLinksContainer = document.getElementById('sourceLinksContainer');
    sourceLinksContainer.textContent = 'No se pudo cargar los enlaces de audio desde las URLs proporcionadas.';
    // Intentar con el siguiente video si hay un error
    findNextVideo(currentGroupIndex, currentResultIndex);
}
