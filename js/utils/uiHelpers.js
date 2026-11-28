// Короткий селектор DOM-элементов
export const $ = s => document.querySelector(s);

// Всплывающее уведомление (Toast)
export const T = m => {
    const t = $('#toast');
    t.textContent = m;
    t.style.display = 'block';
    clearTimeout(T.i);
    T.i = setTimeout(() => t.style.display = 'none', 2600);
};

// Заглушка логирования событий (из макета)
export const ev = () => {};

// Прогресс-бар с заголовком и процентом
export const bar = (l, p, r) => `
    <div class="row" style="font-size:13px">
        <span>${l}</span>
        <b>${p}%</b>
    </div>
    <div class="bar ${r ? 'r' : ''}">
        <i style="width:${p}%"></i>
    </div>
`;

// Тег / статусный бейдж
export const tg = (t, c = '') => `<span class="tag ${c}">${t}</span>`;

// Переключатель (Switch)
export const sw = (on, f = '') => `
    <button class="sw ${on ? 'on' : ''}" onclick="this.classList.toggle('on');${f}"></button>
`;

// Заголовок и подзаголовок экрана
export const head = (t, s) => `<h1>${t}</h1><p class="sub">${s}</p>`;

// Модальное окно
export const mod = h => {
    $('#mb').innerHTML = h + '<p><button class="b2" onclick="$(\'#mod\').style.display=\'none\'">Закрыть</button></p>';
    $('#mod').style.display = 'grid';
};

// Карточка внешней ссылки / раздела
export const lk = (n, d, u) => `
    <div class="c">
        <h2>${n}</h2>
        <div style="color:var(--mu);margin-bottom:12px;font-size:13px;word-break:break-all">${d}</div>
        <a class="b" href="${u}" target="_blank" rel="noopener">Перейти</a>
    </div>
`;

// Виджет «Интерес студентов по направлениям» (для куратора, декана и админа)
export const ints = () => `
    <div class="c">
        <h2>Интерес студентов по направлениям</h2>
        ${bar('Мероприятия', 64)}
        ${bar('Стажировки', 52)}
        ${bar('Студенческий совет', 41)}
        ${bar('Спортклуб', 37)}
        ${bar('Наука', 33)}
        ${bar('Творческие коллективы', 27)}
        <div style="font-size:12px;color:var(--mu)">
            Доля студентов, проявивших интерес (опрос «Интересы и внеучебка» и переходы по вкладкам)
        </div>
    </div>
`;

// Виджет «Популярные мероприятия» (для куратора, декана и админа)
export const evs = () => `
    <div class="c">
        <h2>Популярные мероприятия</h2>
        <table>
            <tr><th>Мероприятие</th><th>Записей</th></tr>
            <tr><td>Хакатон «FinTech Case»</td><td>86</td></tr>
            <tr><td>Встреча со стажёрами Яндекса</td><td>74</td></tr>
            <tr><td>День первокурсника</td><td>61</td></tr>
            <tr><td>Финансовая грамотность: практикум</td><td>48</td></tr>
        </table>
    </div>
`;

// Экран «Отчёты и экспорт» (общий для куратора и декана)
export const rep = r => `
    ${head('Отчёты и экспорт', 'PDF — для всех ролей, Excel — только куратор и декан; экспорт в рабочее время 08:00–20:00.')}
    <div class="c">
        <div class="row">
            <div>
                <b>Сводный отчёт по интересам студентов, 1–2 курс</b>
                <div class="sub" style="margin:0">Период: сентябрь–октябрь 2026</div>
            </div>
            <div>
                <button class="b" onclick="ev('export pdf');T('PDF сформирован за 4,2 с (норма ≤ 10 с)')">Скачать PDF</button>
                <button class="b2" ${r == 'k' || r == 'd' ? '' : 'disabled'} onclick="ev('export xlsx');T('Excel сформирован. Роль и время проверены ✓')">Excel</button>
            </div>
        </div>
        <div class="note">Общефакультетские отчёты обезличены. История отчётов хранится 12 месяцев, затем архивируется.</div>
        <table>
            <tr><th>Отчёт</th><th>Дата</th><th>Формат</th></tr>
            <tr><td>Вовлечённость, сентябрь</td><td>01.10.2026</td><td>PDF</td></tr>
            <tr><td>Эффективность партнёров, Q3</td><td>15.09.2026</td><td>PDF / Excel</td></tr>
        </table>
    </div>
`;
