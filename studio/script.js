/* ============================================================
   ЗАПИСЬ БЕЗ БЭКЕНДА

   Идея: сайту не нужна база и сервер, чтобы принимать запись.
   Человек выбирает варианты — из них собирается текст сообщения,
   и открывается WhatsApp с уже заполненным полем.

   Для маленькой студии это лучше формы: заявка сразу попадает
   в тот же чат, где владелец и так сидит целый день.
   ============================================================ */

// Здесь копится выбор пользователя
const выбор = { service:null, master:null, day:null, time:null };

const ТЕЛЕФОН = '4942100000000';           // без плюса — так требует wa.me
const ЧАСЫ = ['10:00','11:30','13:00','14:30','16:00','17:30','19:00'];

/* ---------- Ближайшие дни ----------
   Строим список на неделю вперёд, пропуская выходные студии
   (воскресенье и понедельник). */
function ближайшиеДни() {
  const дни = [];
  const названия = ['вс','пн','вт','ср','чт','пт','сб'];
  const дата = new Date();

  for (let i = 0; дни.length < 5 && i < 14; i++) {
    const д = new Date(дата);
    д.setDate(дата.getDate() + i);
    const деньНедели = д.getDay();

    if (деньНедели === 0 || деньНедели === 1) continue;   // выходные

    дни.push({
      подпись: i === 0 ? 'сегодня' : `${названия[деньНедели]} ${д.getDate()}`,
      значение: i === 0 ? 'сегодня' : `${д.getDate()}.${String(д.getMonth()+1).padStart(2,'0')}`
    });
  }
  return дни;
}

/* ---------- Рисуем кнопки дней и времени ---------- */
function создатьКнопки(группа, список) {
  const контейнер = document.querySelector(`.chips[data-group="${группа}"]`);
  if (!контейнер) return;
  контейнер.innerHTML = '';
  список.forEach(эл => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = эл.подпись ?? эл;
    b.dataset.value = эл.значение ?? эл;
    контейнер.appendChild(b);
  });
}

createChips();
function createChips() {
  создатьКнопки('day', ближайшиеДни());
  создатьКнопки('time', ЧАСЫ);
}

/* ---------- Клик по кнопке ----------
   Слушаем клики на всём документе, а не на каждой кнопке:
   кнопки дней создаются позже, и отдельные обработчики к ним
   пришлось бы вешать заново. */
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  const группа = chip.parentElement.dataset.group;

  // Снимаем выделение с соседей в той же группе
  chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
  chip.classList.add('is-active');

  выбор[группа] = chip.dataset.value;
  обновить();
});

/* ---------- Собираем сообщение ---------- */
function обновить() {
  const превью = document.getElementById('preview');
  const кнопка = document.getElementById('send');

  const готово = выбор.service && выбор.master && выбор.day && выбор.time;

  if (!готово) {
    const чего = [];
    if (!выбор.service) чего.push('услугу');
    if (!выбор.master)  чего.push('мастера');
    if (!выбор.day || !выбор.time) чего.push('время');
    превью.textContent = `Осталось выбрать: ${чего.join(', ')}.`;
    превью.classList.remove('is-ready');
    кнопка.classList.add('is-disabled');
    кнопка.setAttribute('aria-disabled','true');
    return;
  }

  const текст = `Здравствуйте! Хочу записаться: ${выбор.service}, ${выбор.master}, ${выбор.day} в ${выбор.time}.`;

  превью.textContent = текст;
  превью.classList.add('is-ready');
  кнопка.classList.remove('is-disabled');
  кнопка.removeAttribute('aria-disabled');

  // encodeURIComponent экранирует пробелы и кириллицу для адресной строки
  кнопка.href = `https://wa.me/${ТЕЛЕФОН}?text=${encodeURIComponent(текст)}`;
  кнопка.target = '_blank';
  кнопка.rel = 'noopener';
}

обновить();
