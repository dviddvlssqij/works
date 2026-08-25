/* ============================================================
   МЕРИДИАН — поведение страницы
   Ноль библиотек. Три куска: разбивка текста, калькулятор, заявка.
   ============================================================ */

/* --- Текст по словам: каждое получает номер --i для анимации --- */
document.querySelectorAll('[data-words]').forEach((el) => {
  const собранное = document.createDocumentFragment();
  let n = 0;
  [...el.childNodes].forEach((узел) => {
    if (узел.nodeType === Node.TEXT_NODE) {
      узел.textContent.split(/(\s+)/).forEach((кусок) => {
        if (!кусок.trim()) { собранное.appendChild(document.createTextNode(кусок)); return; }
        const s = document.createElement('span');
        s.className = 'w';
        s.style.setProperty('--i', n++);
        s.textContent = кусок;
        собранное.appendChild(s);
      });
    } else {
      собранное.appendChild(узел.cloneNode(true));
    }
  });
  el.textContent = '';
  el.appendChild(собранное);
});

/* ============================================================
   КАЛЬКУЛЯТОР

   Тарифы — рыночные диапазоны 2026 года. Берём нижнюю границу
   как базовую ставку и снижаем её на объёме: перевозчики дают
   10–20% скидки от тонны, и это отражено честно.
   ============================================================ */
const СПОСОБЫ = {
  air:  { имя: 'Авиа',              ставка: 6.50, срок: '7–10 дней',   мин: 1,   минСумма: 45 },
  rail: { имя: 'Железная дорога',   ставка: 2.80, срок: '18–25 дней',  мин: 20,  минСумма: 70 },
  sea:  { имя: 'Море',              ставка: 1.20, срок: '35–45 дней',  мин: 100, минСумма: 140 }
};

let вес = 60;
let способ = 'rail';
let куда = 'Германию';
let груз = null;

const ТЕЛЕФОН = '4942100000000';   // без плюса — так требует wa.me

// Скидка растёт ступенями: чем больше партия, тем ниже цена килограмма
function скидка(кг) {
  if (кг >= 1000) return 0.20;
  if (кг >= 500)  return 0.14;
  if (кг >= 200)  return 0.08;
  return 0;
}

function евро(n) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' €';
}
function ставкаТекстом(n) {
  return n.toFixed(2).replace('.', ',') + ' €/кг';
}

function пересчитать() {
  const s = СПОСОБЫ[способ];
  const ск = скидка(вес);
  const ставка = s.ставка * (1 - ск);
  // Ниже минимальной суммы перевозчик всё равно не поедет
  const итог = Math.max(Math.round(вес * ставка), s.минСумма);

  document.getElementById('wOut').textContent = вес + ' кг';
  document.getElementById('qPrice').textContent = евро(итог);
  document.getElementById('qRate').textContent = ставкаТекстом(ставка);
  document.getElementById('qWay').textContent = s.имя;
  document.getElementById('qDays').textContent = s.срок;
  document.getElementById('qDisc').textContent = ск ? '−' + Math.round(ск * 100) + '%' : '—';

  // Заполнение ползунка красим до бегунка
  const ползунок = document.getElementById('w');
  ползунок.style.setProperty('--fill', ((вес - 1) / (1200 - 1) * 100).toFixed(1) + '%');

  // Подсказка ведёт себя как консультант: предупреждает, а не молчит
  const примечание = document.getElementById('qNote');
  if (вес < s.мин) {
    примечание.textContent = `Минимум для этого способа — ${s.мин} кг. Посчитано по минимальной сумме ${евро(s.минСумма)}.`;
  } else if (способ === 'air' && вес >= 200) {
    примечание.textContent = 'На таком весе авиа обычно уже невыгодна — железная дорога дешевле более чем вдвое.';
  } else if (ск) {
    примечание.textContent = `Скидка за объём применена: от ${вес >= 1000 ? '1 тонны' : вес >= 500 ? '500 кг' : '200 кг'}.`;
  } else {
    примечание.textContent = 'От 200 кг включается скидка за объём.';
  }

  собратьЗаявку(итог, s);
}

function собратьЗаявку(итог, s) {
  const превью = document.getElementById('orderPreview');
  const кнопка = document.getElementById('orderSend');

  if (!груз) {
    превью.textContent = 'Выберите, что за груз.';
    превью.classList.remove('is-ready');
    кнопка.classList.add('is-off');
    кнопка.setAttribute('aria-disabled', 'true');
    return;
  }

  const текст = `Здравствуйте! Нужно привезти ${груз} из Гуанчжоу в ${куда}. `
              + `Вес около ${вес} кг, способ — ${s.имя.toLowerCase()}. `
              + `По вашему расчёту вышло ${евро(итог)}, срок ${s.срок}. Подскажите точную сумму?`;

  превью.textContent = текст;
  превью.classList.add('is-ready');
  кнопка.classList.remove('is-off');
  кнопка.removeAttribute('aria-disabled');
  // encodeURIComponent экранирует пробелы и кириллицу для адресной строки
  кнопка.href = `https://wa.me/${ТЕЛЕФОН}?text=${encodeURIComponent(текст)}`;
  кнопка.target = '_blank';
  кнопка.rel = 'noopener';
}

/* --- Слушатели --- */
document.getElementById('w').addEventListener('input', (e) => {
  вес = +e.target.value;
  пересчитать();
});

document.querySelectorAll('.chips').forEach((группа) => {
  группа.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    группа.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-on'));
    chip.classList.add('is-on');

    if (chip.dataset.way)   способ = chip.dataset.way;
    if (chip.dataset.dest)  куда   = chip.dataset.dest;
    if (chip.dataset.cargo) груз   = chip.dataset.cargo;
    пересчитать();
  });
});

пересчитать();
