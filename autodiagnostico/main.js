const todasLasPreguntas = [
    ...(typeof preguntasCompromiso !== 'undefined' ? preguntasCompromiso : []),
    ...(typeof preguntasPolitica !== 'undefined' ? preguntasPolitica : []),
    ...(typeof preguntasPlaneamiento !== 'undefined' ? preguntasPlaneamiento : []),
    ...(typeof preguntasImplementacion !== 'undefined' ? preguntasImplementacion : []),
    ...(typeof preguntasEvaluacion !== 'undefined' ? preguntasEvaluacion : []),
    ...(typeof preguntasMedicion !== 'undefined' ? preguntasMedicion : []),
    ...(typeof preguntasControl !== 'undefined' ? preguntasControl : []),
    ...(typeof preguntasRevision !== 'undefined' ? preguntasRevision : [])
];

console.log("Preguntas cargadas:", todasLasPreguntas.length);


let indiceActual = 0;
let respuestas = [];

function startQuiz() {
    document.getElementById('view-start').style.display = 'none';
    renderizarPregunta();
}

function renderizarPregunta() {
    const q = todasLasPreguntas[indiceActual];
    const contenedor = document.querySelector('.content');
    
    contenedor.innerHTML = `
        <div style="margin-top: -24px; margin-bottom: 12px;">
            <img alt="Logo APCP" height="68" src="LogoAPCPtransp.gif" width="72" onerror="this.style.display='none'">
        </div>
        <div style="background-color: #131a22; border-left: 3px solid #2b7d9b; color: #ffffff; padding: 10px; border-radius: 7px; margin-bottom: 24px; font-size: 12px; line-height: 1.5; text-align: left;">
            Mediante la Resolución Ministerial N° 050-2013-TR, el MTPE aprobó la lista de verificación de 115 preguntas para los lineamientos del SGSST. Este instrumento legal es el estándar obligatorio para evaluar el nivel de cumplimiento de una empresa frente a la Ley N° 29783
        </div>
        <div class="quiz-meta">Pregunta ${indiceActual + 1} de ${todasLasPreguntas.length}</div>
        <div class="lineamiento-badge">${q.categoria}</div>
        <div class="quiz-question">${q.pregunta}</div>
        <div class="quiz-options">
            <button class="btn-option yes" onclick="responder('SI')">SÍ</button>
            <button class="btn-option no" onclick="responder('NO')">NO</button>
        </div>
        <div style="background-color: #555; color: #ffffff; padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 11px; line-height: 1.45; text-align: center;">
            Cumplir con las Normas de Seguridad y Salud en el Trabajo no es un simple trámite; es un Compromiso con la vida de nuestros trabajadores y la Clave para vitar sanciones severas por parte de SUNAFIL
        </div>
    `;
}

function responder(valor) {
    respuestas.push({
        categoria: todasLasPreguntas[indiceActual].categoria,
        pregunta: todasLasPreguntas[indiceActual].pregunta,
        respuesta: valor
    });
    indiceActual++;
    
    if (indiceActual < todasLasPreguntas.length) {
        renderizarPregunta();
    } else {
        mostrarResultado();
    }
}

function cargarJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();

    const fuentes = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
    ];

    return new Promise((resolve, reject) => {
        const cargarFuente = indice => {
            if (indice >= fuentes.length) {
                reject(new Error('No se pudo cargar el generador de PDF.'));
                return;
            }

            const script = document.createElement('script');
            script.src = fuentes[indice];
            script.onload = () => {
                if (window.jspdf && window.jspdf.jsPDF) resolve();
                else cargarFuente(indice + 1);
            };
            script.onerror = () => cargarFuente(indice + 1);
            document.head.appendChild(script);
        };

        cargarFuente(0);
    });
}

function cargarImagenComoDataUrl(url) {
    return new Promise((resolve, reject) => {
        const imagen = new Image();
        imagen.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = imagen.naturalWidth || 72;
            canvas.height = imagen.naturalHeight || 68;
            canvas.getContext('2d').drawImage(imagen, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        imagen.onerror = reject;
        imagen.src = url;
    });
}

function exportarReportePDF() {
    const escapar = texto => String(texto).replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[caracter]));

    const totalSi = respuestas.filter(r => r.respuesta === 'SI').length;
    const totalNo = respuestas.filter(r => r.respuesta === 'NO').length;
    const porcentaje = ((totalSi / todasLasPreguntas.length) * 100).toFixed(1);
    const porcentajeNumerico = Number(porcentaje);
    const nivel = porcentajeNumerico >= 80 ? 'Nivel de Cumplimiento ALTO' : porcentajeNumerico >= 50 ? 'Nivel de Cumplimiento MEDIO' : 'Nivel de Cumplimiento BAJO';
    const fechaHoraLima = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        dateStyle: 'long',
        timeStyle: 'short'
    }).format(new Date());
    const logoUrl = new URL('LogoAPCPtransp.gif', window.location.href).href;
    const brechas = respuestas.filter(r => r.respuesta === 'NO');
    const brechasHtml = brechas.length
        ? brechas.map((r, indice) => `<li><strong>${indice + 1}. [${escapar(r.categoria)}]</strong><br>${escapar(r.pregunta)}</li>`).join('')
        : '<li>¡Excelente! No se detectaron brechas de cumplimiento.</li>';

    const ventana = window.open('', '_blank');
    if (!ventana) {
        alert('Permite las ventanas emergentes para abrir el reporte.');
        return;
    }

    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Autodiagnóstico SST - Ley 29783</title>
    <style>
        body { font-family: Arial, sans-serif; color: #202830; max-width: 780px; margin: 0 auto; padding: 28px; }
        header { text-align: center; border-bottom: 2px solid #2b7d9b; padding-bottom: 18px; margin-bottom: 22px; }
        header img { width: 72px; height: 68px; object-fit: contain; }
        h1 { color: #17212b; margin: 12px 0 6px; font-size: 24px; }
        h2 { color: #17212b; font-size: 17px; margin: 22px 0 10px; }
        .date { color: #667582; font-size: 12px; }
        .score { color: #229653; font-size: 42px; font-weight: 800; text-align: center; margin: 18px 0 8px; }
        .level { background: #555; color: #fff; font-weight: 700; text-align: center; padding: 10px; border-radius: 5px; }
        .summary { display: flex; gap: 12px; margin: 18px 0; }
        .summary div { flex: 1; padding: 12px; text-align: center; border-radius: 5px; background: #eef2f5; }
        .summary strong { display: block; font-size: 21px; }
        .yes { color: #229653; } .no { color: #c0392b; }
        ul { padding-left: 22px; } li { margin-bottom: 12px; line-height: 1.4; }
        .footer { margin-top: 26px; color: #667582; font-size: 11px; text-align: center; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <header>
        <img src="${logoUrl}" alt="Logo APCP">
        <h1>Reporte de Autodiagnóstico SST</h1>
        <div class="date">Ley 29783 · Lima, Perú · ${escapar(fechaHoraLima)}</div>
    </header>
    <h2>Resultado Final</h2>
    <div class="score">${porcentaje}%</div>
    <div class="level">${nivel}</div>
    <div class="summary">
        <div><strong class="yes">${totalSi}</strong>Respuestas SÍ</div>
        <div><strong class="no">${totalNo}</strong>Brechas detectadas</div>
        <div><strong>${todasLasPreguntas.length}</strong>Total de preguntas</div>
    </div>
    <h2>Brechas o lineamientos por subsanar</h2>
    <ul>${brechasHtml}</ul>
    <div class="footer">Documento generado desde el autodiagnóstico de cumplimiento de SST.</div>
</body>
</html>`);
    ventana.document.close();
    ventana.focus();
    ventana.onload = () => setTimeout(() => ventana.print(), 400);
}

window.exportarReportePDF = exportarReportePDF;

function mostrarResultado() {
    const totalSi = respuestas.filter(r => r.respuesta === 'SI').length;
    const porcentaje = ((totalSi / todasLasPreguntas.length) * 100).toFixed(1);
    const porcentajeNumerico = Number(porcentaje);
    const nivel = porcentajeNumerico >= 80 ? 'Nivel de Cumplimiento ALTO' : porcentajeNumerico >= 50 ? 'Nivel de Cumplimiento MEDIO' : 'Nivel de Cumplimiento BAJO';
    const brechas = respuestas.filter(r => r.respuesta === 'NO');
    const brechasHtml = brechas.length
        ? brechas.map(r => `<li><strong>[${r.categoria}]</strong> ${r.pregunta}</li>`).join('')
        : '<li>¡Excelente! No se detectaron brechas de cumplimiento.</li>';
    
    document.querySelector('.content').innerHTML = `
        <div style="margin-bottom: 15px;">
            <img alt="Logo APCP" height="68" src="LogoAPCPtransp.gif" width="72" onerror="this.style.display='none'">
        </div>
        <h1>Resultado Final</h1>
        <div class="score-badge" style="font-size: 42px; color: #2ccf6d; margin: 10px 0;">${porcentaje}%</div>
        <div style="background-color: #555; color: #ffffff; padding: 9px 12px; border-radius: 7px; margin: 6px auto 8px; font-size: 12px; font-weight: 700; text-align: center;">${nivel}</div>
        <p style="font-size: 11.5px; color: #9aa8b3; line-height: 1.4; margin-bottom: 10px;">Existen varios lineamientos que aún deben subsanarse</p>
        <div style="max-height: 180px; overflow-y: auto; text-align: left; font-size: 11.5px; color: #9aa8b3; background-color: #131a22; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <ul style="padding-left: 16px; margin: 0;">
                ${brechasHtml}
            </ul>
        </div>
        <button class="btn-primary" style="background-color: #7c5cff; margin-bottom: 10px;" onclick="exportarReportePDF()">Exportar reporte PDF</button>
        <button class="btn-primary" onclick="location.reload()">Reiniciar Autodiagnóstico</button>
        <a href="https://wa.me/51934883877" target="_blank" class="btn-whatsapp">
            <svg viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            Asesoría por WhatsApp
        </a>
    `;
}