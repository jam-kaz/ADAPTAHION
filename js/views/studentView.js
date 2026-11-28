import { db } from '../store/db.js';
import { authService } from '../services/authService.js';
import { $, T, head, tg, bar, sw, lk } from '../components/uiKit.js';

function calculateSurveyScore(survey, answers) {
    let totalPoints = 0;
    const maxPerQuestion = 100 / survey.questions.length;

    survey.questions.forEach((q, idx) => {
        const ans = answers[idx];
        if (q.type === 'checkbox') {
            totalPoints += Array.isArray(ans) && ans.length > 0 ? maxPerQuestion : maxPerQuestion * 0.4;
        } else {
            if (ans === 0) totalPoints += maxPerQuestion;
            else if (ans === 1) totalPoints += maxPerQuestion * 0.65;
            else totalPoints += maxPerQuestion * 0.3;
        }
    });

    return Math.round(totalPoints);
}

window.submitStudentSurvey = surveyIndex => {
    const user = authService.getUser();
    if (!user) return;

    const surveys = db.getSurveys();
    const survey = surveys[surveyIndex];
    if (!survey) return;

    const answers = [];
    for (let qIdx = 0; qIdx < survey.questions.length; qIdx++) {
        const q = survey.questions[qIdx];
        if (q.type === 'checkbox') {
            const checked = Array.from(
                document.querySelectorAll(`input[name="sq_${survey.id}_${qIdx}"]:checked`)
            ).map(el => el.value);
            if (checked.length === 0) {
                T('Пожалуйста, выберите хотя бы один вариант в вопросе №' + (qIdx + 1));
                return;
            }
            answers.push(checked);
        } else {
            const selected = document.querySelector(`input[name="sq_${survey.id}_${qIdx}"]:checked`);
            if (!selected) {
                T('Пожалуйста, ответьте на все вопросы анкеты (вопрос №' + (qIdx + 1) + ')');
                return;
            }
            answers.push(Number(selected.value));
        }
    }

    const score = calculateSurveyScore(survey, answers);
    db.saveSurveyResult({
        userId: user.id,
        groupId: user.groupId,
        surveyId: survey.id,
        score,
        maxScore: 100,
        answers
    });

    T(`Опрос «${survey.title}» сохранён! Ваш результат: ${score}% — данные переданы куратору и в деканат.`);
    if (typeof window.rerenderCurrentView === 'function') {
        window.rerenderCurrentView();
    }
};

window.toggleStudentEvent = eventId => {
    const user = authService.getUser();
    if (!user) return;
    const isReg = db.toggleEventRegistration(user.id, eventId);
    T(isReg ? 'Вы успешно записаны на мероприятие!' : 'Запись на мероприятие отменена');
    if (typeof window.rerenderCurrentView === 'function') {
        window.rerenderCurrentView();
    }
};

window.sendStudentAppeal = () => {
    const user = authService.getUser();
    if (!user) return;
    const topicEl = $('#app-topic');
    const textEl = $('#app-text');
    const topic = topicEl ? topicEl.value.trim() : '';
    const text = textEl ? textEl.value.trim() : '';

    if (!topic) {
        T('Укажите тему обращения');
        return;
    }

    db.addAppeal({
        userId: user.id,
        userName: user.name,
        groupId: user.groupId,
        topic,
        text
    });

    T(`Обращение отправлено куратору группы ${user.groupId}!`);
    if (typeof window.rerenderCurrentView === 'function') {
        window.rerenderCurrentView();
    }
};

export function renderStudentView(tab, user, goTab) {
    const myResults = db.getResultsByUser(user.id);
    const surveys = db.getSurveys();
    const events = db.getEvents();
    const myAppeals = db.getAppealsByUser(user.id);
    const extraResult = myResults.find(r => r.surveyId === 'extra');
    const firstAnswer = extraResult && Array.isArray(extraResult.answers) ? extraResult.answers.at(0) : null;
    const realInterests = Array.isArray(firstAnswer) ? firstAnswer : [];


    const avgScore = myResults.length
        ? Math.round(myResults.reduce((sum, r) => sum + r.score, 0) / myResults.length)
        : 0;

    if (tab === 'home') {
        const eventsHtml = events.slice(0, 2).map(ev => {
            const isReg = db.isUserRegistered(user.id, ev.id);
            return `
                <div class="row" style="padding:10px 0;border-bottom:1px solid var(--ln)">
                    <div>
                        <b>${ev.title}</b>
                        <div style="font-size:13px;color:var(--mu)">${ev.date} · ${tg(ev.tag)}</div>
                    </div>
                    <button class="${isReg ? 'b2' : 'b'}" onclick="toggleStudentEvent('${ev.id}')">
                        ${isReg ? 'Вы записаны ✓' : 'Записаться'}
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div class="hero">
                <h1>Добро пожаловать, ${user.name}!</h1>
                <p style="margin:0;opacity:.92">
                    Группа: <b>${user.groupId}</b> (${user.course} курс) · Ваши ответы в тестах автоматически учитываются в аналитике куратора и деканата.
                </p>
            </div>
            <div class="g">
                <div class="c">
                    <div class="k">${myResults.length} из ${surveys.length}<small>пройдено адаптационных тестов</small></div>
                </div>
                <div class="c">
                    <div class="k">${avgScore}%<small>мой средний индекс адаптации</small></div>
                </div>
                <div class="c">
                    <div class="k">${myAppeals.length}<small>моих обращений куратору</small></div>
                </div>
            </div>
            <div class="c" style="margin-bottom:16px">
                <h2>Мои интересы и рекомендации</h2>
                <div style="margin-bottom:12px">
                    ${(user.interests || []).map(i => tg(i)).join(' ') || '<span style="color:var(--mu)">Интересы пока не выбраны</span>'}
                </div>
                <button class="b" onclick="window.switchTab('surveys')">Пройти адаптационные тесты →</button>
            </div>
            <div class="c">
                <h2>Ближайшие мероприятия для вас</h2>
                ${eventsHtml}
            </div>
        `;
    }

    if (tab === 'events') {
        const cards = events.map(ev => {
            const isReg = db.isUserRegistered(user.id, ev.id);
            return `
                <div class="c">
                    ${tg(ev.tag)}
                    <h2 style="margin-top:8px">${ev.title}</h2>
                    <div style="color:var(--mu);font-size:13px;margin-bottom:12px">${ev.date} · ${ev.place}</div>
                    <button class="${isReg ? 'b2' : 'b'}" onclick="toggleStudentEvent('${ev.id}')">
                        ${isReg ? 'Отменить запись ✓' : 'Записаться'}
                    </button>
                </div>
            `;
        }).join('');

        return `
            ${head('Мероприятия и события', 'Записывайтесь на хакатоны, встречи со стажёрами и мероприятия факультета')}
            <div class="g">${cards}</div>
        `;
    }

    if (tab === 'surveys') {
        const surveysHtml = surveys.map((s, sIdx) => {
            const saved = myResults.find(r => r.surveyId === s.id);
            const statusBadge = saved
                ? tg(`Пройдено: ${saved.score}% (${saved.date})`, 'g')
                : tg('Ожидает прохождения', 'y');

            const questionsHtml = s.questions.map((q, qIdx) => {
                const prevAns = saved ? saved.answers[qIdx] : null;
                let optionsHtml = '';

                if (q.type === 'checkbox') {
                    optionsHtml = q.options.map(opt => {
                        const isChecked = Array.isArray(prevAns) && prevAns.includes(opt) ? 'checked' : '';
                        return `
                            <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer">
                                <input type="checkbox" name="sq_${s.id}_${qIdx}" value="${opt}" ${isChecked} style="width:auto">
                                <span>${opt}</span>
                            </label>
                        `;
                    }).join('');
                } else {
                    const opts = q.options || ['Да', 'Частично', 'Нет'];
                    optionsHtml = opts.map((opt, oIdx) => {
                        const isChecked = prevAns === oIdx ? 'checked' : '';
                        return `
                            <label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;cursor:pointer">
                                <input type="radio" name="sq_${s.id}_${qIdx}" value="${oIdx}" ${isChecked} style="width:auto">
                                <span>${opt}</span>
                            </label>
                        `;
                    }).join('');
                }

                return `
                    <div style="padding:12px 0;border-bottom:1px solid var(--ln)">
                        <div style="font-weight:600;margin-bottom:8px">${qIdx + 1}. ${q.text}</div>
                        <div>${optionsHtml}</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="c" style="margin-bottom:16px">
                    <div class="row">
                        <div>
                            <h2 style="margin:0">${s.title}</h2>
                            <div style="font-size:13px;color:var(--mu)">${s.description}</div>
                        </div>
                        ${statusBadge}
                    </div>
                    ${questionsHtml}
                    <div style="margin-top:14px">
                        <button class="b" onclick="submitStudentSurvey(${sIdx})">
                            ${saved ? 'Обновить ответы и пересчитать балл' : 'Отправить ответы'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            ${head('Тесты и адаптационные опросы', `Ваши результаты автоматически сохраняются за группой ${user.groupId} и передаются куратору и в деканат.`)}
            ${surveysHtml}
        `;
    }

    if (tab === 'clubs') {
        return `
            ${head('Студенческие коллективы', 'Клубы, научные общества и спортивные секции Финуниверситета')}
            <div class="g">
                ${lk('Студенческий совет', 'Организация мероприятий, волонтёрство и самоуправление', 'https://www.fa.ru')}
                ${lk('Научное студенческое общество (НСО)', 'Конференции, кейс-чемпионаты и публикации', 'https://www.fa.ru')}
                ${lk('Спортивный клуб «Финансист»', 'Сборные команды по футболу, баскетболу и плаванию', 'https://www.fa.ru')}
                ${lk('Творческий центр', 'Вокал, танцы, КВН и театральная студия', 'https://www.fa.ru')}
            </div>
        `;
    }

    if (tab === 'links') {
        return `
            ${head('Полезные цифровые сервисы', 'Официальные порталы Финансового университета')}
            <div class="g">
                ${lk('Личный кабинет студента', 'lk.fa.ru — зачётка, справки, стипендии и БРС', 'https://lk.fa.ru')}
                ${lk('Электронное расписание', 'ruz.fa.ru — расписание пар группы ' + user.groupId, 'https://ruz.fa.ru')}
                ${lk('Образовательный портал Moodle', 'org.fa.ru — учебные курсы, лекции и задания', 'https://org.fa.ru')}
                ${lk('Библиотечно-информационный комплекс', 'library.fa.ru — электронные учебники и статьи', 'http://library.fa.ru')}
            </div>
        `;
    }

    if (tab === 'profile') {
        const resultsRows = myResults.map(r => {
            const sInfo = surveys.find(s => s.id === r.surveyId);
            return `
                <tr>
                    <td>${sInfo ? sInfo.title : r.surveyId}</td>
                    <td><b>${r.score} / ${r.maxScore}</b></td>
                    <td>${r.date}</td>
                    <td>${tg('Передано в деканат', 'g')}</td>
                </tr>
            `;
        }).join('');

        return `
            ${head('Мой профиль и настройки', 'Персональная карточка студента Финуниверситета')}
            <div class="c" style="margin-bottom:16px">
                <h2>Учётные данные</h2>
                <div class="g" style="margin-bottom:0">
                    <div><small style="color:var(--mu)">ФИО студента</small><div><b>${user.name}</b></div></div>
                    <div><small style="color:var(--mu)">Учебная группа</small><div><b>${user.groupId} (${user.course} курс)</b></div></div>
                    <div><small style="color:var(--mu)">Логин в системе</small><div><b>${user.login}</b></div></div>
                </div>
            </div>
            <div class="c" style="margin-bottom:16px">
                <h2>История моих пройденных тестов</h2>
                ${myResults.length ? `
                    <table>
                        <tr><th>Тест / Опрос</th><th>Результат</th><th>Дата</th><th>Статус</th></tr>
                        ${resultsRows}
                    </table>
                ` : '<p style="color:var(--mu)">Вы ещё не прошли ни одного теста. Перейдите во вкладку «Тесты и опросы».</p>'}
            </div>
            <div class="c">
                <h2>Уведомления и приватность (ФЗ-152)</h2>
                <div class="row" style="padding:8px 0;border-bottom:1px solid var(--ln)">
                    <span>Напоминания о новых адаптационных тестах</span>
                    ${sw(true, "T('Настройка уведомлений обновлена')")}
                </div>
                <div class="row" style="padding:8px 0">
                    <span>Согласие на передачу обезличенной статистики в деканат</span>
                    ${sw(true, "T('Согласие подтверждено')")}
                </div>
            </div>
        `;
    }

    if (tab === 'appeals') {
        const rows = myAppeals.map(a => `
            <tr>
                <td><b>${a.topic}</b><div style="font-size:12px;color:var(--mu)">${a.text || ''}</div></td>
                <td>${a.date}</td>
                <td>${tg(a.status, a.statusClass)}</td>
            </tr>
        `).join('');

        return `
            ${head('Обращения к куратору группы ' + user.groupId, 'Задайте вопрос по учёбе, БРС или внеучебной жизни')}
            <div class="c" style="margin-bottom:16px">
                <h2>Новое обращение</h2>
                <div style="margin-bottom:10px">
                    <input id="app-topic" type="text" placeholder="Тема обращения (например: Вопрос по баллам БРС)">
                </div>
                <div style="margin-bottom:12px">
                    <textarea id="app-text" rows="3" placeholder="Опишите ваш вопрос подробнее..."></textarea>
                </div>
                <button class="b" onclick="sendStudentAppeal()">Отправить куратору</button>
            </div>
            <div class="c">
                <h2>Мои обращения (${myAppeals.length})</h2>
                ${myAppeals.length ? `
                    <table>
                        <tr><th>Тема</th><th>Дата</th><th>Статус</th></tr>
                        ${rows}
                    </table>
                ` : '<p style="color:var(--mu)">У вас пока нет отправленных обращений.</p>'}
            </div>
        `;
    }

    return '';
}
