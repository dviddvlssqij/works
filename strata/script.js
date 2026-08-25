/* ============================================================
   STRATA — поведение страницы
   Ноль библиотек. Четыре независимых куска:
   1. разбивка текста на слова для анимаций
   2. параллакс от курсора
   3. выбор жёсткости
   4. выбор размера и сборка заказа
   ============================================================ */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   1. ТЕКСТ ПО СЛОВАМ

   Каждое слово заворачивается в свой <span> и получает номер --i.
   Дальше CSS раздаёт словам разные отрезки прокрутки, и строка
   проявляется слева направо, а не целиком.
   ------------------------------------------------------------ */
function разбитьНаСлова(el) {
  // Берём только текстовые узлы, чтобы не сломать <br> и вложенные теги
  const части = [...el.childNodes];
  let счётчик = 0;
  const собранное = document.createDocumentFragment();

  части.forEach((узел) => {
    if (узел.nodeType === Node.TEXT_NODE) {
      узел.textContent.split(/(\s+)/).forEach((кусок) => {
        if (!kусокЗначим(кусок)) { собранное.appendChild(document.createTextNode(кусок)); return; }
        const s = document.createElement('span');
        s.className = 'w';
        s.style.setProperty('--i', счётчик++);
        s.textContent = кусок;
        собранное.appendChild(s);
      });
    } else {
      собранное.appendChild(узел.cloneNode(true));
    }
  });

  el.textContent = '';
  el.appendChild(собранное);
  el.style.setProperty('--words', счётчик);
}
function kусокЗначим(с) { return с.trim().length > 0; }

document.querySelectorAll('[data-words]').forEach(разбитьНаСлова);

/* ------------------------------------------------------------
   2. ПАРАЛЛАКС ОТ КУРСОРА
   Сдвиг уезжает в CSS-переменные, сам сдвиг делает CSS.
   ------------------------------------------------------------ */
if (!reduced) {
  const сцена = document.querySelector('.hero');
  const цель = document.getElementById('tilt');
  if (сцена && цель) {
    сцена.addEventListener('mousemove', (e) => {
      const r = сцена.getBoundingClientRect();
      // Приводим позицию курсора к диапазону от -0.5 до +0.5
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      цель.style.setProperty('--px', (-px).toFixed(3));
      цель.style.setProperty('--py', (-py).toFixed(3));
    });
    сцена.addEventListener('mouseleave', () => {
      цель.style.setProperty('--px', 0);
      цель.style.setProperty('--py', 0);
    });
  }
}

/* ------------------------------------------------------------
   3. ЖЁСТКОСТЬ
   Меняется только верхняя половина: комфорт и латекс.
   Пружины и основание стоят на месте — это и есть смысл блока.
   ------------------------------------------------------------ */
const ЖЁСТКОСТЬ = {
  soft: {
    name: 'Soft',
    detail: 'A thicker comfort layer lets the shoulder and hip drop in, so the spine stays straight instead of bridging.',
    foam: 62, latex: 34, sink: 18, sinkLabel: 'sinks ~4 cm',
    specs: [['Comfort foam', '60 mm'], ['Latex', '30 mm'], ['Total height', '270 mm']]
  },
  medium: {
    name: 'Medium',
    detail: 'Balanced core: enough give for the shoulder, enough push-back to keep the lower back supported when you roll onto your back.',
    foam: 48, latex: 42, sink: 12, sinkLabel: 'sinks ~2.5 cm',
    specs: [['Comfort foam', '50 mm'], ['Latex', '40 mm'], ['Total height', '260 mm']]
  },
  firm: {
    name: 'Firm',
    detail: 'Less foam, more latex. The surface stays flat under load, which keeps the hips from dropping below the shoulders.',
    foam: 34, latex: 54, sink: 7, sinkLabel: 'sinks ~1.5 cm',
    specs: [['Comfort foam', '35 mm'], ['Latex', '55 mm'], ['Total height', '255 mm']]
  }
};

const ВЕРХ_ПРУЖИН = 220;   // пружины начинаются здесь и не двигаются

function применитьЖёсткость(id) {
  const d = ЖЁСТКОСТЬ[id];
  if (!d) return;

  const latexY = ВЕРХ_ПРУЖИН - d.latex;
  const foamY  = latexY - d.foam;
  const coverY = foamY - 24;

  const поставить = (el, attrs) => { if (el) for (const k in attrs) el.setAttribute(k, attrs[k]); };
  poставитьПару('fLatex', 'fLatexP', { y: latexY, height: d.latex });
  poставитьПару('fFoam',  'fFoamP',  { y: foamY,  height: d.foam  });
  поставить(document.getElementById('fCover'), { y: coverY });

  // Прогиб: неглубокая чаша по центру, глубина зависит от жёсткости
  const t = coverY + 6;
  поставить(document.getElementById('fSink'), {
    d: `M52 ${t} H128 C168 ${t} 168 ${t + d.sink} 210 ${t + d.sink} C252 ${t + d.sink} 252 ${t} 292 ${t} H368`
  });
  const подпись = document.getElementById('fSinkLab');
  if (подпись) { подпись.textContent = d.sinkLabel; подпись.setAttribute('y', t + d.sink + 20); }

  document.getElementById('fName').textContent = d.name;
  document.getElementById('fDetail').textContent = d.detail;
  document.getElementById('fSpecs').innerHTML = d.specs
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  document.querySelectorAll('.fcard').forEach((b) => {
    const on = b.dataset.firm === id;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-selected', String(on));
  });
}
function poставитьПару(idA, idB, attrs) {
  [idA, idB].forEach((id) => {
    const el = document.getElementById(id);
    if (el) for (const k in attrs) el.setAttribute(k, attrs[k]);
  });
}

document.querySelectorAll('.fcard').forEach((b) => {
  b.addEventListener('click', () => применитьЖёсткость(b.dataset.firm));
});
применитьЖёсткость('medium');

/* ------------------------------------------------------------
   4. РАЗМЕР, ЦЕНА И ЗАКАЗ
   ------------------------------------------------------------ */
const РАЗМЕРЫ = {
  single: { name: 'Single', dim: '90 × 200',  price: 1190, cm: 90  },
  double: { name: 'Double', dim: '140 × 200', price: 1490, cm: 140 },
  queen:  { name: 'Queen',  dim: '160 × 200', price: 1690, cm: 160 },
  king:   { name: 'King',   dim: '180 × 200', price: 1890, cm: 180 }
};

const ТЕЛЕФОН = '4942100000000';   // без плюса — так требует wa.me
let выбранныйРазмер = 'queen';
let выбранныйСрок = null;

const евро = (n) => '€' + n.toLocaleString('en-US');

function применитьРазмер(id) {
  const d = РАЗМЕРЫ[id];
  if (!d) return;
  выбранныйРазмер = id;

  document.getElementById('railSize').textContent = d.name;
  const ж = ЖЁСТКОСТЬ[текущаяЖёсткость()];
  const высота = (ж.specs.find(([k]) => k === 'Total height') || [, '260 mm'])[1];
  document.getElementById('railSub').textContent = `${d.dim} cm · ${ж.name.toLowerCase()} · ${высота} high`;
  document.getElementById('railPrice').textContent = евро(d.price);
  document.getElementById('railTotal').textContent = евро(d.price);
  document.getElementById('footDim').textContent = `${d.dim} cm`;
  document.getElementById('footName').textContent = d.name;

  // 200 см комнаты = 560 px рисунка, поэтому все кровати в одном масштабе
  const масштаб = 560 / 200;
  const w = Math.round(d.cm * масштаб);
  const x = Math.round(30 + (560 - w) / 2);
  const rect = document.getElementById('footRect');
  rect.setAttribute('x', x);
  rect.setAttribute('width', w);
  document.getElementById('footName').setAttribute('x', x + w / 2);

  const шир = Math.min(Math.round(w / 2 - 14), 118);
  const подушки = d.cm >= 140
    ? [x + 12, x + w - 12 - шир]
    : [Math.round(x + w / 2 - шир / 2)];
  document.getElementById('footPillows').innerHTML = подушки
    .map((px) => `<rect x="${px}" y="44" width="${шир}" height="34" rx="6"/>`).join('');

  document.querySelectorAll('.scard').forEach((b) => {
    const on = b.dataset.size === id;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-checked', String(on));
  });

  обновитьЗаказ();
}
function текущаяЖёсткость() {
  const on = document.querySelector('.fcard.is-on');
  return on ? on.dataset.firm : 'medium';
}

document.querySelectorAll('.scard').forEach((b) => {
  b.addEventListener('click', () => применитьРазмер(b.dataset.size));
});

document.querySelectorAll('.chips .chip').forEach((c) => {
  c.addEventListener('click', () => {
    c.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.remove('is-on'));
    c.classList.add('is-on');
    выбранныйСрок = c.dataset.value;
    обновитьЗаказ();
  });
});

function обновитьЗаказ() {
  const превью = document.getElementById('orderPreview');
  const кнопка = document.getElementById('orderSend');
  if (!превью || !кнопка) return;

  const d = РАЗМЕРЫ[выбранныйРазмер];
  const ж = ЖЁСТКОСТЬ[текущаяЖёсткость()].name.toLowerCase();

  if (!выбранныйСрок) {
    превью.textContent = 'Choose when you would like it.';
    превью.classList.remove('is-ready');
    кнопка.classList.add('is-off');
    кнопка.setAttribute('aria-disabled', 'true');
    return;
  }

  const текст = `Hello! I would like the STRATA ${d.name} — ${d.dim} cm, ${ж} firmness, ${евро(d.price)}. Delivery: ${выбранныйСрок}.`;
  превью.textContent = текст;
  превью.classList.add('is-ready');
  кнопка.classList.remove('is-off');
  кнопка.removeAttribute('aria-disabled');
  // encodeURIComponent экранирует пробелы и знаки для адресной строки
  кнопка.href = `https://wa.me/${ТЕЛЕФОН}?text=${encodeURIComponent(текст)}`;
  кнопка.target = '_blank';
  кнопка.rel = 'noopener';
}

// Смена жёсткости должна отражаться в сводке и в тексте заказа
document.querySelectorAll('.fcard').forEach((b) => {
  b.addEventListener('click', () => применитьРазмер(выбранныйРазмер));
});

применитьРазмер('queen');
