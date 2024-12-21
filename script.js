(function() {
    var secretData = 'datos ocultos'; // Variable oculta
    console.log('Intenta inspeccionar esto:', secretData); // Intento de mostrar el dato pero está encapsulado
})();

window.onkeydown = function(event) {
    if ((event.ctrlKey || event.shiftKey) && event.key === 'I') {
        event.preventDefault(); // Evita abrir las DevTools con Ctrl + I
    }
    if ((event.ctrlKey || event.shiftKey) && event.key === 'J') {
        event.preventDefault(); // Evita abrir las DevTools con Ctrl + J
    }
    if ((event.ctrlKey || event.shiftKey) && event.key === 'U') {
        event.preventDefault(); // Evita ver el código fuente con Ctrl + U
    }
};

document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Evita el menú contextual
});
