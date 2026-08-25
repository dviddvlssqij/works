/* ============================================================
   ЗАКАЗ БЕЗ БЭКЕНДА
   Тот же приём, что в работе «Контур»: выбор превращается
   в готовое сообщение и открывает мессенджер владельца.
   Маленькому магазину это дешевле и надёжнее формы с сервером.
   ============================================================ */
const выбор = { item:null, when:null };
const ТЕЛЕФОН = '4942100000000';   // без плюса — так требует wa.me

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

function обновить(){
  const превью = document.getElementById('preview');
  const кнопка = document.getElementById('send');

  if (!выбор.item || !выбор.when) {
    превью.textContent = !выбор.item ? 'Выберите растение.' : 'Осталось выбрать день.';
    превью.classList.remove('is-ready');
    кнопка.classList.add('is-disabled');
    кнопка.setAttribute('aria-disabled','true');
    return;
  }

  const текст = `Здравствуйте! Хочу заказать ${выбор.item}. Доставка — ${выбор.when}.`;
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
