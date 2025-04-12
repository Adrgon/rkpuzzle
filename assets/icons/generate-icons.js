const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fondo
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(0, 0, size, size);
    
    // Texto
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size/4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Puzzle', size/2, size/2);
    
    // Guardar como PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-${size}x${size}.png`, buffer);
    console.log(`Icono ${size}x${size} generado correctamente`);
}

// Generar ambos iconos
generateIcon(192);
generateIcon(512); 
