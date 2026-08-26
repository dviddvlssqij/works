/* ВАНІЛЬ — три речі: калькулятор, збірка замовлення, збільшення фото.
   Жодних бібліотек. Кожен блок працює сам по собі: якщо на сторінці
   немає потрібного елемента, блок мовчки пропускається. */

// ── 1. Калькулятор ціни ────────────────────────────────────────────
(function () {
  const кг = document.getElementById('kg');
  if (!кг) return;

  const вихід = document.getElementById('kgOut');
  const декор = document.getElementById('dec');
  const терміново = document.getElementById('fast');
  const сума = document.getElementById('total');
  const підказка = document.getElementById('hint');

  const ЦІНА_КГ = 750;

  // Розділяємо тисячі вузьким пробілом: 2 275, а не 2275.
  const грн = (n) => n.toLocaleString('uk-UA').replace(/,/g, ' ') + ' грн';

  function перерахувати() {
    const вага = parseFloat(кг.value);
    const дод = parseInt(декор.value, 10);
    const швидко = терміново.checked ? 400 : 0;
    const разом = Math.round(вага * ЦІНА_КГ) + дод + швидко;

    вихід.textContent = вага.toFixed(1).replace('.', ',') + ' кг';

    // Якщо цифра справді змінилась — коротко підсвічуємо її. Без цього
    // людина крутить повзунок і не помічає, що сума вже інша.
    const нова = грн(разом);
    if (сума.textContent && сума.textContent !== нова) {
      сума.classList.remove('blink');
      void сума.offsetWidth;          // перезапуск анімації: браузеру треба «моргнути»
      сума.classList.add('blink');
    }
    сума.textContent = нова;

    // Заповнення доріжки повзунка: від 0% на 1,5 кг до 100% на 6 кг.
    const частка = ((вага - 1.5) / (6 - 1.5)) * 100;
    кг.style.setProperty('--fill', частка + '%');

    // Чесна порада замість мовчазного числа.
    if (вага >= 5) {
      підказка.textContent = 'Від 5 кг торт зазвичай роблять ярусним — так він тримає форму. Це впливає на оформлення, обговоримо окремо.';
    } else if (терміново.checked) {
      підказка.textContent = 'Терміново — це можливо, але вибір начинок буде вужчим: деякі потребують ночі на просочення.';
    } else {
      підказка.textContent = 'Це орієнтир, а не рахунок. Точну суму назву після того, як обговоримо оформлення.';
    }
  }

  [кг, декор, терміново].forEach((e) => {
    e.addEventListener('input', перерахувати);
    e.addEventListener('change', перерахувати);
  });
  перерахувати();
})();

// ── 2. Збірка замовлення в месенджер ───────────────────────────────
(function () {
  const форма = document.getElementById('form');
  if (!форма) return;

  const ім = document.getElementById('fName');
  const дата = document.getElementById('fDate');
  const начинка = document.getElementById('fFill');
  const нотатка = document.getElementById('fNote');
  const прев = document.getElementById('prev');
  const viber = document.getElementById('toViber');
  const tg = document.getElementById('toTg');

  function датаСловами(значення) {
    if (!значення) return '';
    const [р, м, д] = значення.split('-');
    return `${д}.${м}.${р}`;
  }

  function зібрати() {
    const рядки = ['Доброго дня! Хочу замовити торт.'];
    if (ім.value.trim()) рядки.push('Мене звати ' + ім.value.trim() + '.');
    if (дата.value) рядки.push('Потрібно на ' + датаСловами(дата.value) + '.');
    if (начинка.selectedIndex > 0) рядки.push('Начинка: ' + начинка.value + '.');

    // Підтягуємо те, що людина вже накрутила в калькуляторі — щоб не питати
    // вдруге. Декор і терміновість теж переносимо: вони входять у суму, і без
    // них цифра виглядає взятою зі стелі.
    const кг = document.getElementById('kg');
    const сума = document.getElementById('total');
    const декор = document.getElementById('dec');
    const терміново = document.getElementById('fast');
    if (кг && сума) {
      const шматки = ['Приблизно ' + parseFloat(кг.value).toFixed(1).replace('.', ',') + ' кг'];
      if (декор && parseInt(декор.value, 10) > 0) {
        // з тексту опції беремо тільки назву, до тире: «Просте: ягоди або шоколад»
        шматки.push('оформлення — ' + декор.options[декор.selectedIndex].text.split('—')[0].trim());
      }
      if (терміново && терміново.checked) шматки.push('потрібно терміново');
      рядки.push(шматки.join(', ') + '. За калькулятором вийшло ' + сума.textContent + '.');
    }
    if (нотатка.value.trim()) рядки.push('Побажання: ' + нотатка.value.trim());

    return рядки.join('\n');
  }

  function оновити() {
    const текст = зібрати();
    прев.textContent = текст;
    // encodeURIComponent екранує переноси рядків і кирилицю,
    // інакше посилання розсиплеться на пробілі.
    const екрановано = encodeURIComponent(текст);
    viber.href = 'viber://chat?number=%2B380000000000&text=' + екрановано;
    tg.href = 'https://t.me/share/url?url=&text=' + екрановано;
  }

  форма.addEventListener('input', оновити);
  форма.addEventListener('change', оновити);
  форма.addEventListener('submit', (e) => e.preventDefault());
  оновити();
})();

// ── 3. Збільшення фото ─────────────────────────────────────────────
(function () {
  const сітка = document.getElementById('grid');
  const шар = document.getElementById('lb');
  if (!сітка || !шар) return;

  const кнопки = [...сітка.querySelectorAll('.shot')];
  const велике = document.getElementById('lbImg');
  const лічильник = document.getElementById('lbCount');
  let поточне = 0;
  let звідкиПрийшли = null;   // куди повернути фокус після закриття

  function показати(і) {
    поточне = (і + кнопки.length) % кнопки.length;
    const img = кнопки[поточне].querySelector('img');
    const src = кнопки[поточне].querySelector('source');
    // Беремо той самий webp, що вже завантажений у сітці — миттєво,
    // без другого запиту в мережу.
    велике.src = src ? src.getAttribute('srcset') : img.src;
    велике.alt = img.alt;
    лічильник.textContent = (поточне + 1) + ' / ' + кнопки.length;
  }

  function відкрити(і) {
    звідкиПрийшли = document.activeElement;
    показати(і);
    шар.hidden = false;
    document.body.style.overflow = 'hidden';   // сторінка під шаром не їде
    document.getElementById('lbX').focus();
  }

  function закрити() {
    шар.hidden = true;
    document.body.style.overflow = '';
    if (звідкиПрийшли) звідкиПрийшли.focus();  // фокус повертається на те саме фото
  }

  кнопки.forEach((к, і) => к.addEventListener('click', () => відкрити(і)));
  document.getElementById('lbX').addEventListener('click', закрити);
  document.getElementById('lbPrev').addEventListener('click', () => показати(поточне - 1));
  document.getElementById('lbNext').addEventListener('click', () => показати(поточне + 1));

  // Клік по тлу закриває, клік по самому фото — ні.
  шар.addEventListener('click', (e) => { if (e.target === шар) закрити(); });

  document.addEventListener('keydown', (e) => {
    if (шар.hidden) return;
    if (e.key === 'Escape') закрити();
    if (e.key === 'ArrowLeft') показати(поточне - 1);
    if (e.key === 'ArrowRight') показати(поточне + 1);
  });
})();

// ── 4. Вибір начинки прямо в сітці ─────────────────────────────────
(function () {
  const сітка = document.querySelector('.fills');
  const підказка = document.getElementById('fillsHint');
  const уФормі = document.getElementById('fFill');
  if (!сітка || !уФормі) return;

  const кнопки = [...сітка.querySelectorAll('button[data-fill]')];
  const обрані = [];               // максимум два: у торті можна поєднати два смаки

  function оновити() {
    кнопки.forEach((к) =>
      к.setAttribute('aria-pressed', обрані.includes(к.dataset.fill) ? 'true' : 'false'));

    if (обрані.length === 0) {
      підказка.textContent = '';
    } else if (обрані.length === 1) {
      підказка.textContent = 'Обрано: ' + обрані[0] + '. Можна додати другий смак — доплати немає.';
    } else {
      підказка.textContent = 'Обрано два смаки: ' + обрані.join(' і ') + '. Це вже готове замовлення — воно нижче у формі.';
    }

    // Підставляємо у форму. Якщо смаків два — беремо перший зі списку,
    // а другий дописуємо в побажання: у select двох значень не буває.
    const перший = обрані[0];
    if (перший) {
      const збіг = [...уФормі.options].findIndex((o) => o.text === перший);
      if (збіг > -1) уФормі.selectedIndex = збіг;
    }

    const нотатка = document.getElementById('fNote');
    if (нотатка) {
      // Прибираємо попередній рядок про другий смак, щоб він не множився.
      нотатка.value = нотатка.value.replace(/\n?Другий смак: [^\n]*/g, '');
      if (обрані[1]) нотатка.value = (нотатка.value + '\nДругий смак: ' + обрані[1]).trim();
    }

    document.getElementById('form')
      ?.dispatchEvent(new Event('input', { bubbles: true }));
  }

  кнопки.forEach((к) => к.addEventListener('click', () => {
    const смак = к.dataset.fill;
    const де = обрані.indexOf(смак);
    if (де > -1) обрані.splice(де, 1);
    else if (обрані.length < 2) обрані.push(смак);
    else { обрані.shift(); обрані.push(смак); }   // третій витісняє найстаріший
    оновити();
  }));
})();
