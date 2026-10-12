// ===== Datos =====
const CLAVE = 'tension_registros_v1';
const CLAVE_ANIMO = 'tension_animo_v1';
const TOMAS_AL_DIA = 3;

// Límites que ha indicado el médico (en cmHg)
const LIMITE = { altaMax: 13.0, bajaMax: 8.0, bajaMin: 7.0 };

// Estados de ánimo que puede marcar cada día
const ANIMOS = [
  { id: 'energia', emoji: '😄', texto: 'Con energía' },
  { id: 'bien', emoji: '🙂', texto: 'Bien' },
  { id: 'regular', emoji: '😐', texto: 'Regular' },
  { id: 'cansada', emoji: '😩', texto: 'Cansada' },
  { id: 'mareada', emoji: '😵‍💫', texto: 'Mareada' },
  { id: 'dolor', emoji: '🤕', texto: 'Dolor de cabeza' }
];
const animoPorId = (id) => ANIMOS.find((a) => a.id === id);

function leerJSON(clave, defecto) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; }
  catch { return defecto; }
}
let registros = leerJSON(CLAVE, []);
let animos = leerJSON(CLAVE_ANIMO, {}); // { 'AAAA-MM-DD': 'cansada', ... }

function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(registros));
  localStorage.setItem(CLAVE_ANIMO, JSON.stringify(animos));
}

// ===== Utilidades =====
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

const hoyISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const horaActual = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const aFecha = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
const fechaCorta = (iso) => iso.split('-').reverse().join('/');
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Admite cmHg (13,5) y mmHg (135): los números grandes se pasan a cm
const enCm = (v) => (v >= 30 ? v / 10 : v);
const altaMal = (v) => enCm(v) > LIMITE.altaMax;
const bajaMal = (v) => enCm(v) > LIMITE.bajaMax || enCm(v) < LIMITE.bajaMin;
const tomaMal = (r) => altaMal(r.alta) || bajaMal(r.baja);

// Muestra con coma decimal: 12.5 -> "12,5"
const num = (v) => Number(v).toLocaleString('es-ES', { minimumFractionDigits: v < 30 ? 1 : 0, maximumFractionDigits: 2 });
const cifra = (r) =>
  `<span class="${altaMal(r.alta) ? 'mal' : ''}">${num(r.alta)}</span>/<span class="${bajaMal(r.baja) ? 'mal' : ''}">${num(r.baja)}</span>`;

const leer = (id) => Number(String($(id).value).trim().replace(',', '.'));
const porMomento = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora) || a.id - b.id;
const deHoy = () => registros.filter((r) => r.fecha === hoyISO()).sort(porMomento);

function avisar(texto) {
  const a = $('aviso');
  a.textContent = texto;
  a.hidden = false;
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => (a.hidden = true), 2200);
}

// ===== Cabecera: hoy =====
function pintarHoy() {
  const hoy = new Date();
  $('hoyDia').textContent = hoy.toLocaleDateString('es-ES', { weekday: 'long' });
  $('hoyFecha').textContent = hoy.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

  const tomas = deHoy();
  const huecos = Math.max(TOMAS_AL_DIA, tomas.length);
  const cont = $('tomasHoy');
  cont.innerHTML = '';

  for (let i = 0; i < huecos; i++) {
    const r = tomas[i];
    const el = document.createElement(r ? 'button' : 'div');
    el.className = 'slot' + (r ? ' hecha' : '') + (i === tomas.length ? ' siguiente' : '');

    el.innerHTML = r
      ? `<span class="slot-nombre">${r.hora}</span>
         <span class="slot-valor">${cifra(r)}</span>
         <span class="slot-pulso">pulso ${r.pulso}</span>`
      : `<span class="slot-nombre">${i + 1}ª toma</span>
         <span class="slot-falta">${i === tomas.length ? 'Ahora' : 'Pendiente'}</span>`;

    if (r) {
      el.type = 'button';
      el.addEventListener('click', () => verToma(r));
    }
    cont.appendChild(el);
  }
}

// ===== Formulario =====
function actualizarFormulario() {
  const n = deHoy().length;
  $('tituloForm').textContent = n < TOMAS_AL_DIA ? `${n + 1}ª toma de hoy` : 'Tomas de hoy completas';
  $('horaAuto').textContent = `Se guarda con la fecha y hora de ahora (${horaActual()})`;
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const alta = leer('alta');
  const baja = leer('baja');
  const pulso = leer('pulso');

  if (![alta, baja, pulso].every((v) => Number.isFinite(v) && v > 0)) {
    alert('Revisa los números: solo cifras, con coma si hay decimales.');
    return;
  }
  if (baja >= alta) {
    alert('La baja tiene que ser menor que la alta. Revisa los números.');
    return;
  }

  const ahora = new Date();
  registros.push({ id: ahora.getTime(), fecha: hoyISO(ahora), hora: horaActual(ahora), alta, baja, pulso });
  guardar();

  $('alta').value = $('baja').value = $('pulso').value = '';
  document.activeElement.blur();
  pintarTodo();
  avisar('Toma guardada');
});

// Al pulsar "Siguiente" en el teclado, pasa a la casilla siguiente
[['alta', 'baja'], ['baja', 'pulso']].forEach(([id, sig]) => {
  $(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $(sig).focus(); }
  });
});

// ===== Estado de ánimo de hoy =====
function pintarAnimo() {
  const cont = $('animos');
  const elegido = animos[hoyISO()];
  cont.innerHTML = '';

  ANIMOS.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'animo';
    b.setAttribute('aria-pressed', String(elegido === a.id));
    b.innerHTML = `<span class="animo-emoji" aria-hidden="true">${a.emoji}</span><span>${a.texto}</span>`;
    b.addEventListener('click', () => {
      // Tocar el que ya está marcado lo desmarca
      if (animos[hoyISO()] === a.id) {
        delete animos[hoyISO()];
        avisar('Estado de ánimo quitado');
      } else {
        animos[hoyISO()] = a.id;
        avisar('Estado de ánimo guardado');
      }
      guardar();
      pintarAnimo();
    });
    cont.appendChild(b);
  });
}

// ===== Cuaderno: días anteriores =====
function pintarCuaderno() {
  const lista = $('lista');
  lista.innerHTML = '';

  const anteriores = registros.filter((r) => r.fecha !== hoyISO());
  if (anteriores.length === 0) {
    lista.innerHTML = '<p class="vacio">Aquí aparecerán las tomas de los días anteriores.</p>';
    return;
  }

  const porDia = {};
  anteriores.forEach((r) => (porDia[r.fecha] ||= []).push(r));

  Object.keys(porDia).sort().reverse().forEach((fecha) => {
    const d = aFecha(fecha);
    const fila = document.createElement('div');
    fila.className = 'fila-dia';

    const semana = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    const mes = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    const animo = animoPorId(animos[fecha]);
    fila.innerHTML = `<div class="fecha-col"><b>${d.getDate()}</b><small>${semana}, ${mes}</small>${
      animo ? `<span class="fecha-animo" title="${animo.texto}">${animo.emoji}</span>` : ''}</div>`;

    const tomasDia = document.createElement('div');
    tomasDia.className = 'tomas-dia';
    porDia[fecha].sort(porMomento).forEach((r) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lectura';
      b.innerHTML = `<b>${cifra(r)}</b><small>pulso ${r.pulso}</small><small>${r.hora}</small>`;
      b.addEventListener('click', () => verToma(r));
      tomasDia.appendChild(b);
    });
    fila.appendChild(tomasDia);
    lista.appendChild(fila);
  });
}

// ===== Detalle y borrar =====
let tomaAbierta = null;

function verToma(r) {
  tomaAbierta = r;
  const d = aFecha(r.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  $('detTitulo').textContent = mayuscula(d);
  $('detCifra').innerHTML = cifra(r);
  $('detPulso').textContent = `Pulso ${r.pulso}, a las ${r.hora}`;
  $('dlgToma').showModal();
}

$('dlgToma').addEventListener('close', () => {
  if ($('dlgToma').returnValue !== 'borrar' || !tomaAbierta) return;
  if (!confirm('¿Seguro que quieres borrar esta toma?')) return;
  registros = registros.filter((r) => r.id !== tomaAbierta.id);
  guardar();
  pintarTodo();
  avisar('Toma borrada');
});

// ===== PDF =====
$('btnPdf').addEventListener('click', () => {
  if (registros.length === 0) { alert('Todavía no hay tomas para el PDF.'); return; }
  const fechas = registros.map((r) => r.fecha).sort();
  $('pdfDesde').value = fechas[0];
  $('pdfHasta').value = fechas[fechas.length - 1];
  $('dlgPdf').showModal();
});

$('dlgPdf').addEventListener('close', () => {
  if ($('dlgPdf').returnValue === 'ok') crearPdf($('pdfDesde').value, $('pdfHasta').value);
});

const AZUL = [29, 59, 120];
const TEXTO = [19, 39, 79];
const SUAVE = [91, 111, 148];
const ROJO = [196, 66, 58];
const CIELO = [235, 241, 251];
const dec = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 1 });

function crearPdf(desde, hasta) {
  const datos = registros
    .filter((r) => (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta))
    .sort(porMomento);

  if (datos.length === 0) { alert('No hay tomas entre esas fechas.'); return; }

  // Agrupar por día
  const porDia = {};
  datos.forEach((r) => (porDia[r.fecha] ||= []).push(r));
  const dias = Object.keys(porDia).sort();

  // Recuentos
  const diasMal = dias.filter((f) => porDia[f].some(tomaMal));
  const rangos = [
    { texto: `Alta mayor de ${dec(LIMITE.altaMax)}`, test: (r) => altaMal(r.alta) },
    { texto: `Baja mayor de ${dec(LIMITE.bajaMax)}`, test: (r) => enCm(r.baja) > LIMITE.bajaMax },
    { texto: `Baja menor de ${dec(LIMITE.bajaMin)}`, test: (r) => enCm(r.baja) < LIMITE.bajaMin }
  ].map((g) => ({
    ...g,
    mediciones: datos.filter(g.test).length,
    dias: dias.filter((f) => porDia[f].some(g.test)).length
  }));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const ancho = doc.internal.pageSize.getWidth();

  // --- Cabecera ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...TEXTO);
  doc.text('Registro de tensión arterial', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...SUAVE);
  doc.text(`Del ${fechaCorta(dias[0])} al ${fechaCorta(dias[dias.length - 1])}: ${dias.length} días, ${datos.length} mediciones`, 14, 25);
  doc.text(`Valores recomendados: alta hasta ${dec(LIMITE.altaMax)}; baja entre ${dec(LIMITE.bajaMin)} y ${dec(LIMITE.bajaMax)}.`, 14, 31);

  // --- Resumen ---
  doc.setFillColor(...CIELO);
  doc.roundedRect(14, 37, ancho - 28, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...(diasMal.length ? ROJO : AZUL));
  doc.text(`${diasMal.length}`, 20, 50.5);
  const anchoNum = doc.getTextWidth(`${diasMal.length}`);
  doc.setFontSize(12);
  doc.setTextColor(...TEXTO);
  doc.text(`de ${dias.length} días con algún valor fuera de lo recomendado`, 22 + anchoNum, 50);

  doc.autoTable({
    startY: 62,
    head: [['Fuera de rango', 'Mediciones', 'Días']],
    body: rangos.map((g) => [g.texto, g.mediciones, g.dias]),
    styles: { fontSize: 11, textColor: TEXTO, cellPadding: 2.5 },
    headStyles: { fillColor: AZUL, textColor: 255 },
    columnStyles: { 1: { halign: 'center', cellWidth: 35 }, 2: { halign: 'center', cellWidth: 35 } },
    didParseCell: (c) => {
      if (c.section === 'head' && c.column.index > 0) c.cell.styles.halign = 'center';
      if (c.section === 'body' && c.column.index > 0 && Number(c.cell.raw) > 0) {
        c.cell.styles.textColor = ROJO;
        c.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Resumen de estado de ánimo
  const cuenta = {};
  dias.forEach((f) => { if (animos[f]) cuenta[animos[f]] = (cuenta[animos[f]] || 0) + 1; });
  const resumenAnimo = ANIMOS.filter((a) => cuenta[a.id])
    .map((a) => `${a.texto} ${cuenta[a.id]} ${cuenta[a.id] === 1 ? 'día' : 'días'}`).join(', ');
  let y = doc.lastAutoTable.finalY + 8;
  if (resumenAnimo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...SUAVE);
    doc.text(doc.splitTextToSize(`Estado de ánimo: ${resumenAnimo}.`, ancho - 28), 14, y);
    y += 8;
  }

  // --- Una tabla por día ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXTO);
  doc.text('Detalle por día', 14, y + 4);
  y += 9;

  dias.forEach((fecha) => {
    const tomas = porDia[fecha];
    const nombreDia = mayuscula(aFecha(fecha).toLocaleDateString('es-ES', { weekday: 'long' }));
    const animo = animoPorId(animos[fecha]);

    doc.autoTable({
      startY: y,
      // Cada día va junto: si no cabe entero, pasa a la página siguiente
      rowPageBreak: 'avoid',
      pageBreak: y + 20 + tomas.length * 8 > doc.internal.pageSize.getHeight() - 15 ? 'always' : 'auto',
      head: [
        [
          { content: `${nombreDia} ${fechaCorta(fecha)}`, colSpan: 2, styles: { halign: 'left', fontSize: 12 } },
          { content: `Ánimo: ${animo ? animo.texto : 'sin marcar'}`, colSpan: 2,
            styles: { halign: 'right', fontStyle: animo ? 'bold' : 'italic', fontSize: 10 } }
        ],
        ['Hora', 'Alta', 'Baja', 'Pulso']
      ],
      body: tomas.map((r) => [r.hora, num(r.alta), num(r.baja), r.pulso]),
      styles: { fontSize: 11, halign: 'center', textColor: TEXTO, cellPadding: 2.2 },
      headStyles: { fillColor: AZUL, textColor: 255 },
      alternateRowStyles: { fillColor: [244, 247, 252] },
      didParseCell: (c) => {
        if (c.section === 'head' && c.row.index === 1) {
          c.cell.styles.fillColor = CIELO;
          c.cell.styles.textColor = SUAVE;
          c.cell.styles.fontSize = 10;
        }
        if (c.section !== 'body') return;
        const r = tomas[c.row.index];
        if ((c.column.index === 1 && altaMal(r.alta)) || (c.column.index === 2 && bajaMal(r.baja))) {
          c.cell.styles.textColor = ROJO;
          c.cell.styles.fontStyle = 'bold';
        }
      }
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  // Pie de página con número de página
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SUAVE);
    doc.text(`Página ${i} de ${paginas}`, ancho - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  doc.save(`tension_${dias[0]}_a_${dias[dias.length - 1]}.pdf`);
}

// ===== Copia de seguridad =====
$('btnBackup').addEventListener('click', () => {
  const copia = { registros, animos };
  const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tension_copia_${hoyISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('fileRestore').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const datos = JSON.parse(await file.text());
    // Las copias antiguas eran solo la lista de tomas
    const lista = Array.isArray(datos) ? datos : datos.registros;
    if (!Array.isArray(lista)) throw new Error();
    const ids = new Set(registros.map((r) => r.id));
    const nuevos = lista.filter((r) => r && r.fecha && !ids.has(r.id));
    registros = registros.concat(nuevos);
    if (!Array.isArray(datos) && datos.animos) animos = { ...datos.animos, ...animos };
    guardar();
    pintarTodo();
    avisar(`${nuevos.length} tomas recuperadas`);
  } catch {
    alert('Ese archivo no es una copia de esta app.');
  }
  e.target.value = '';
});

// ===== Inicio =====
function pintarTodo() {
  pintarHoy();
  actualizarFormulario();
  pintarAnimo();
  pintarCuaderno();
}

pintarTodo();

// Al volver a la app (o si cambia el día) se refresca
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pintarTodo();
});
setInterval(actualizarFormulario, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
