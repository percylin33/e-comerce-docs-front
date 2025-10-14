import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatoTerminos' })
export class FormatoTerminosPipe implements PipeTransform {
	transform(value: string): string {
		if (!value) return '';

	 // Limpieza básica
    value = value.replace(/""/g, '"').trim();

    // 🔹 Títulos numerados (10.1, 2.3.4, etc.)
    // Ejemplo: 10.1 Cálculo de Comisiones -> <h3><strong>10.1</strong> Cálculo de Comisiones</h3>
    value = value.replace(
      /(^|\n)(\d+(\.\d+)*)(\s+[^\n]+)/g,
      (_match, _start, numero, _sub, texto) =>
        `<h3><strong>${numero}</strong>${texto}</h3>`
    );

    // 🔹 Subapartados con letras (A., a., B., b., etc.)
    // Ejemplo: a. Ser mayor de edad -> <p><strong>a.</strong> Ser mayor de edad</p>
    value = value.replace(
      /(^|\n)([A-Za-z]\.)(\s+[^\n]+)/g,
      (_match, _start, letra, texto) => `<p><strong>${letra}</strong>${texto}</p>`
    );

    // 🔹 Listas con guiones (-)
    // Ejemplo: - Punto -> <ul><li>Punto</li></ul>
    value = value.replace(/(^|\n)-\s+([^\n]+)/g, '<li>$2</li>');
    value = value.replace(/(<li>[\s\S]*?<\/li>)(?!(\s*<li>|<\/ul>))/g, '<ul>$1</ul>');

    // 🔹 Negrita para títulos antes de los dos puntos (Ej: "Código Promocional:")
    // Asegura que solo se afecten las frases cortas antes de ":"
    value = value.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{2,}):/g, '<strong>$1:</strong>');

    // 🔹 Manejo de saltos de línea y párrafos
    value = value.replace(/\n{2,}/g, '</p><p>');
    value = value.replace(/\n/g, ' ');

    // 🔹 Asegurar envoltura general en <p>
    if (!value.startsWith('<h') && !value.startsWith('<p>')) value = '<p>' + value;
    if (!value.endsWith('</p>')) value += '</p>';

    // 🔹 Eliminar párrafos vacíos
    value = value.replace(/<p>\s*<\/p>/g, '');

  return value;
	}
}
