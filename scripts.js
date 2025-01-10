<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recomendaciones de Videos</title>
    <style>
        /* Agregar algo de estilo básico */
        body {
            font-family: Arial, sans-serif;
        }

        .video-container {
            margin: 20px 0;
        }

        .video-title {
            font-size: 20px;
            font-weight: bold;
        }

        .suggestions {
            list-style-type: none;
            padding: 0;
        }

        .suggestion-item {
            padding: 5px 0;
        }

        .suggestion-item a {
            color: #007BFF;
            text-decoration: none;
        }

        .suggestion-item a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Recomendaciones de Videos</h1>

    <!-- Contenedor donde se mostrarán los videos -->
    <div id="video-container" class="video-container">
        <!-- El título del video y sus sugerencias aparecerán aquí -->
        <p id="video-title" class="video-title">Cargando video...</p>
        <ul id="suggestions-list" class="suggestions">
            <!-- Las sugerencias de enlaces aparecerán aquí -->
        </ul>
    </div>

    <script>
        // Aquí colocas tu código JavaScript que procesará los videos y sugerencias.
        let currentGroupIndex = 0;
        let currentResultIndex = 0;
        const resultsPerGroup = 5; // Ejemplo de cantidad de resultados por grupo

        // Suponiendo que tienes una lista de IDs de videos
        const videoIdsForGroup = [
            ['videoID1', 'videoID2', 'videoID3', 'videoID4', 'videoID5'], // Grupo 1
            ['videoID6', 'videoID7', 'videoID8', 'videoID9', 'videoID10'], // Grupo 2
        ];

        // Función para obtener los IDs de videos del grupo actual
        function getVideoIdsForGroup(groupIndex) {
            return videoIdsForGroup[groupIndex] || [];
        }

        // Esta función simula la obtención de sugerencias para un video
        function fetchSourceCode(videoId, groupIndex, resultIndex) {
            const allOriginsUrl = `https://example.com/video/${videoId}`; // URL ficticia para obtener los enlaces

            fetch(allOriginsUrl)
                .then(response => response.text())
                .then(data => {
                    // Procesar el HTML recibido para encontrar los enlaces
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data, 'text/html');
                    const sourceElements = doc.querySelectorAll('source[src]');
                    const audioElements = doc.querySelectorAll('audio[src]');
                    const allLinks = [...sourceElements, ...audioElements].map(element => element.src);

                    // Mostrar el título del video y las sugerencias
                    const videoTitle = `Video ${groupIndex + 1} - ${resultIndex + 1}`;
                    document.getElementById('video-title').textContent = videoTitle;

                    const suggestionsList = document.getElementById('suggestions-list');
                    suggestionsList.innerHTML = ''; // Limpiar las sugerencias anteriores

                    allLinks.forEach(link => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('suggestion-item');
                        const anchor = document.createElement('a');
                        anchor.href = link;
                        anchor.textContent = link;
                        listItem.appendChild(anchor);
                        suggestionsList.appendChild(listItem);
                    });

                    // Llamar a la siguiente sugerencia después de un pequeño retraso
                    setTimeout(() => findNextVideo(groupIndex, resultIndex), 2000);
                })
                .catch(error => {
                    console.error('Error al obtener los enlaces:', error);
                });
        }

        // Función para avanzar al siguiente video y procesar
        function findNextVideo(groupIndex, resultIndex) {
            currentResultIndex++;
            if (currentResultIndex >= resultsPerGroup) {
                currentResultIndex = 0;
                currentGroupIndex++;
            }

            const videoIds = getVideoIdsForGroup(groupIndex);
            if (videoIds.length > 0) {
                fetchSourceCode(videoIds[currentResultIndex], groupIndex, currentResultIndex);
            } else {
                console.log('No hay más videos para procesar en este grupo');
            }
        }

        // Inicialización: empezar a cargar el primer grupo de videos
        findNextVideo(currentGroupIndex, currentResultIndex);
    </script>
</body>
</html>
