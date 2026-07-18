import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

/**
 * Markdown ligero + bullets Unicode para los documentos legales del modulo
 * Creadores (T&C y Politica de Privacidad).
 *
 * <p><b>Estructuras soportadas:</b></p>
 * <ul>
 *   <li>{@code # texto} → {@code <h1>}</li>
 *   <li>{@code ## texto} o linea "N. TEXTO_EN_MAYUSCULAS" → {@code <h2>}</li>
 *   <li>{@code ### texto} → {@code <h3>}</li>
 *   <li>{@code **texto**} → {@code <strong>}</li>
 *   <li>{@code `codigo`} → {@code <code>}</li>
 *   <li>Lineas que arrancan con {@code -}, {@code *}, {@code •} o {@code ●} → bullet nivel 1</li>
 *   <li>Lineas que arrancan con {@code o} u {@code ○} → bullet nivel 2 (anidado)</li>
 *   <li>Lineas que arrancan con {@code ■} → bullet nivel 3 (anidado)</li>
 *   <li>Patron {@code "N.M. Titulo:"} al inicio de un item → {@code <strong>}</li>
 *   <li>{@code ---} → {@code <hr>}</li>
 *   <li>Bloques indentados con 6+ espacios → formula destacada en bloque</li>
 * </ul>
 *
 * <p><b>Por que esta flexibilidad?</b> los documentos legales suelen venir
 * de Word como texto con bullets Unicode. El admin los pega directo al
 * formulario sin tener que "convertir" a Markdown. El pipe los entiende,
 * aunque la copia haya perdido saltos de linea o tenga bullets sin espacio
 * pegado al texto.</p>
 */
@Pipe({
    name: "creatorMarkdown",
    standalone: true,
})
export class CreatorMarkdownPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string | null | undefined): SafeHtml {
        if (!value) return "";
        const html = renderMarkdown(value);
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * Aplica bold al patron "N.M. Titulo:" o "N.M. Titulo." al inicio de un item.
 * NO escapa HTML antes (lo hace el caller).
 */
function boldNumberedPrefix(text: string): string {
    const m = text.match(/^(\d+\.\d+\.?\s+[^:.]+:)/);
    if (!m) return escapeHtml(text);
    const prefix = escapeHtml(m[1]);
    const rest   = escapeHtml(text.substring(m[1].length));
    return `<strong>${prefix}</strong>${rest}`;
}

function renderInline(text: string): string {
    let s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`);
    return s;
}

/**
 * Detecta el nivel de bullet al inicio de una linea.
 * Acepta:
 *   nivel 1: - * ● •
 *   nivel 2: o ○
 *   nivel 3: ■ ▪ ▼ ▶
 * NO requiere espacio obligatorio despues del marker (por si el paste lo pierde).
 */
function detectBulletLevel(line: string): number {
    const t = line.trimStart();
    if (/^[-*•●]\s?/.test(t)) return 1;
    if (/^[○o]\s?/.test(t))   return 2;
    if (/^[■▪▼▶]\s?/.test(t)) return 3;
    return 0;
}

function stripBullet(line: string): string {
    return line.trimStart().replace(/^([-*•●○o■▪▼▶])\s?/, "");
}

interface BulletGroup {
    level: number;
    content: string;
}

/**
 * Splitea el contenido en lineas preservando la estructura.
 * Acepta \n, \r\n y tambien lineas largas que el paste haya "juntado"
 * usando el patron "texto texto ● texto texto" (split por bullet char + space).
 */
function splitIntoLines(src: string): string[] {
    const raw = src.split(/\r?\n/);
    const out: string[] = [];
    for (const line of raw) {
        if (line.includes("•") || line.includes("●") || line.includes("■")) {
            // Si una linea corrida trae multiples bullets pegados con espacio
            // (caso tipico de paste "todo en un parrafo"), los separamos aqui.
            const split = line.split(/(?=[•●■])\s*/);
            for (const s of split) {
                if (s.trim()) out.push(s);
            }
        } else {
            if (line.trim()) out.push(line);
        }
    }
    return out;
}

function renderMarkdown(src: string): string {
    const lines = splitIntoLines(src);
    const out: string[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === "") { i++; continue; }
        if (/^-{3,}$/.test(trimmed)) { out.push("<hr />"); i++; continue; }

        if (/^#\s+/.test(trimmed)) {
            out.push(`<h1>${renderInline(trimmed.replace(/^#\s+/, ""))}</h1>`);
            i++; continue;
        }
        if (/^##\s+/.test(trimmed)) {
            out.push(`<h2>${renderInline(trimmed.replace(/^##\s+/, ""))}</h2>`);
            i++; continue;
        }
        if (/^###\s+/.test(trimmed)) {
            out.push(`<h3>${renderInline(trimmed.replace(/^###\s+/, ""))}</h3>`);
            i++; continue;
        }

        // Seccion tipo "1. RELACION ENTRE LAS PARTES Y ACEPTACION"
        if (/^\d+\.\s+[A-Z][A-Z\sÁÉÍÓÚÑ&\-\.]+$/.test(trimmed)) {
            out.push(`<h2>${renderInline(trimmed)}</h2>`);
            i++; continue;
        }

        if (detectBulletLevel(line) > 0) {
            const items: { level: number; content: string }[] = [];
            while (i < lines.length) {
                const t = lines[i];
                if (t.trim() === "") {
                    if (i + 1 < lines.length && detectBulletLevel(lines[i + 1]) > 0) {
                        i++; continue;
                    }
                    break;
                }
                const lvl = detectBulletLevel(t);
                if (lvl === 0) break;
                items.push({ level: lvl, content: stripBullet(t) });
                i++;
            }
            out.push(renderNestedList(items));
            continue;
        }

        // Bloque de formula indentado (6+ espacios).
        if (/^      \S/.test(line)) {
            const buf: string[] = [];
            while (i < lines.length && (/^      \S/.test(lines[i]) || lines[i].trim() === "")) {
                buf.push(lines[i].replace(/^ +/, ""));
                i++;
            }
            out.push(`<pre>${escapeHtml(buf.join("\n"))}</pre>`);
            continue;
        }

        // Parrafo: juntar lineas consecutivas no-bullet hasta fin de bloque.
        const para: string[] = [];
        while (i < lines.length) {
            const t = lines[i].trim();
            if (t === "") break;
            if (detectBulletLevel(lines[i]) > 0) break;
            if (/^(-{3,}|#{1,3}\s+|      \S)/.test(t)) break;
            if (/^\d+\.\s+[A-Z][A-Z\sÁÉÍÓÚÑ&\-\.]+$/.test(t)) break;
            para.push(renderInline(t));
            i++;
        }
        if (para.length) {
            out.push(`<p>${para.join(" ")}</p>`);
        }
    }

    return out.join("\n");
}

function renderNestedList(items: { level: number; content: string }[]): string {
    const html: string[] = [];
    const stack: number[] = [];

    for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const inner = boldNumberedPrefix(it.content);

        while (stack.length > 0 && stack[stack.length - 1] > it.level) {
            html.push("</ul>");
            stack.pop();
            if (stack.length > 0) html.push("</li>");
        }

        if (stack.length === 0 || stack[stack.length - 1] < it.level) {
            const cls = it.level === 1 ? "md-list"
                      : it.level === 2 ? "md-sublist"
                      : "md-subsublist";
            html.push(`<ul class="${cls}">`);
            stack.push(it.level);
        } else if (stack.length > 0 && stack[stack.length - 1] === it.level) {
            html.push("</li>");
        }

        html.push(`<li>${inner}`);
    }

    while (stack.length > 0) {
        html.push("</li>");
        html.push("</ul>");
        stack.pop();
    }

    return html.join("");
}
