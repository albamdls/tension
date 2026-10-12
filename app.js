// ===== Datos =====
const CLAVE = 'tension_registros_v1';
const TOMAS_AL_DIA = 3;

function cargar() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || []; }
  catch { return []; }
}
function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(registros));
}
let registros = cargar();

// ===== Utilidades =====
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

const hoyISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const horaActual = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const aFecha = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
const fechaCorta = (iso) => iso.split('-').reverse().join('/');
// Admite mmHg (138,5) y cmHg (13,8): si el número es pequeño se entiende en cm
const enMm = (v) => (v < 30 ? v * 10 : v);
const esAlta = (r) => enMm(r.alta) >= 140 || enMm(r.baja) >= 90;
// Muestra con coma decimal: 12.5 -> "12,5"
const num = (v) => Number(v).toLocaleString('es-ES', { maximumFractionDigits: 2 });
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
         <span class="slot-valor${esAlta(r) ? ' alta' : ''}">${num(r.alta)}/${num(r.baja)}</span>
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
  registros.push({
    id: ahora.getTime(),
    fecha: hoyISO(ahora),
    hora: horaActual(ahora),
    alta,
    baja,
    pulso
  });
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
    fila.innerHTML = `<div class="fecha-col"><b>${d.getDate()}</b><small>${semana}, ${mes}</small></div>`;

    const tomasDia = document.createElement('div');
    tomasDia.className = 'tomas-dia';
    porDia[fecha].sort(porMomento).forEach((r) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lectura' + (esAlta(r) ? ' alta' : '');
      b.innerHTML = `<b>${num(r.alta)}/${num(r.baja)}</b><small>pulso ${r.pulso}</small><small>${r.hora}</small>`;
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
  $('detTitulo').textContent = d.charAt(0).toUpperCase() + d.slice(1);
  $('detCifra').textContent = `${num(r.alta)}/${num(r.baja)}`;
  $('detCifra').className = 'det-cifra' + (esAlta(r) ? ' alta' : '');
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

function crearPdf(desde, hasta) {
  const datos = registros
    .filter((r) => (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta))
    .sort(porMomento);

  if (datos.length === 0) { alert('No hay tomas entre esas fechas.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(19, 39, 79);
  doc.text('Registro de tensión arterial', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(91, 111, 148);
  doc.text(`Del ${fechaCorta(datos[0].fecha)} al ${fechaCorta(datos[datos.length - 1].fecha)}, ${datos.length} tomas`, 14, 26);

  doc.autoTable({
    startY: 32,
    head: [['Fecha', 'Hora', 'Alta', 'Baja', 'Pulso']],
    body: datos.map((r) => [fechaCorta(r.fecha), r.hora, num(r.alta), num(r.baja), r.pulso]),
    styles: { fontSize: 11, halign: 'center', textColor: [19, 39, 79] },
    headStyles: { fillColor: [29, 59, 120], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 247, 252] }
  });

  doc.save(`tension_${datos[0].fecha}_a_${datos[datos.length - 1].fecha}.pdf`);
}

// ===== Copia de seguridad =====
$('btnBackup').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(registros, null, 2)], { type: 'application/json' });
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
    const importados = JSON.parse(await file.text());
    if (!Array.isArray(importados)) throw new Error();
    const ids = new Set(registros.map((r) => r.id));
    const nuevos = importados.filter((r) => r && r.fecha && !ids.has(r.id));
    registros = registros.concat(nuevos);
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
  pintarCuaderno();
}

pintarTodo();

// Al volver a la app (o si cambia el día) se refresca la hora
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pintarTodo();
});
setInterval(actualizarFormulario, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
