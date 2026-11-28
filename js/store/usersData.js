export const USERS = [
    // Группа ПИ25-1 (5 студентов)
    { id: 's_pi25_1', login: '101', password: 'ааа', role: 'student', name: 'Алексей Смирнов', groupId: 'ПИ25-1', course: 2, interests: [] },
    { id: 's_pi25_2', login: '102', password: 'ааа', role: 'student', name: 'Мария Иванова', groupId: 'ПИ25-1', course: 2, interests: [] },
    { id: 's_pi25_3', login: '103', password: 'ааа', role: 'student', name: 'Дмитрий Козлов', groupId: 'ПИ25-1', course: 2, interests: [] },
    { id: 's_pi25_4', login: '104', password: 'ааа', role: 'student', name: 'Елена Соколова', groupId: 'ПИ25-1', course: 2, interests: [] },
    { id: 's_pi25_5', login: '105', password: 'ааа', role: 'student', name: 'Артём Морозов', groupId: 'ПИ25-1', course: 2, interests: [] },

    // Группа ПИ26-1 (5 студентов)
    { id: 's_pi26_1', login: '106', password: 'ааа', role: 'student', name: 'Анна Кузнецова', groupId: 'ПИ26-1', course: 1, interests: [] },
    { id: 's_pi26_2', login: '107', password: 'ааа', role: 'student', name: 'Максим Попов', groupId: 'ПИ26-1', course: 1, interests: [] },
    { id: 's_pi26_3', login: '108', password: 'ааа', role: 'student', name: 'София Лебедева', groupId: 'ПИ26-1', course: 1, interests: [] },
    { id: 's_pi26_4', login: '109', password: 'ааа', role: 'student', name: 'Никита Новиков', groupId: 'ПИ26-1', course: 1, interests: [] },
    { id: 's_pi26_5', login: '110', password: 'ааа', role: 'student', name: 'Виктория Волкова', groupId: 'ПИ26-1', course: 1, interests: [] },

    // Группа ПМ24-1 (5 студентов)
    { id: 's_pm24_1', login: '111', password: 'ааа', role: 'student', name: 'Иван Соловьёв', groupId: 'ПМ24-1', course: 3, interests: [] },
    { id: 's_pm24_2', login: '112', password: 'ааа', role: 'student', name: 'Дарья Васильева', groupId: 'ПМ24-1', course: 3, interests: [] },
    { id: 's_pm24_3', login: '113', password: 'ааа', role: 'student', name: 'Кирилл Зайцев', groupId: 'ПМ24-1', course: 3, interests: [] },
    { id: 's_pm24_4', login: '114', password: 'ааа', role: 'student', name: 'Полина Павлова', groupId: 'ПМ24-1', course: 3, interests: [] },
    { id: 's_pm24_5', login: '115', password: 'ааа', role: 'student', name: 'Егор Семёнов', groupId: 'ПМ24-1', course: 3, interests: [] },

    // Группа ИБ25-1 (5 студентов)
    { id: 's_ib25_1', login: '116', password: 'ааа', role: 'student', name: 'Роман Голубев', groupId: 'ИБ25-1', course: 2, interests: [] },
    { id: 's_ib25_2', login: '117', password: 'ааа', role: 'student', name: 'Алина Виноградова', groupId: 'ИБ25-1', course: 2, interests: [] },
    { id: 's_ib25_3', login: '118', password: 'ааа', role: 'student', name: 'Тимур Богданов', groupId: 'ИБ25-1', course: 2, interests: [] },
    { id: 's_ib25_4', login: '119', password: 'ааа', role: 'student', name: 'Ксения Воробьёва', groupId: 'ИБ25-1', course: 2, interests: [] },
    { id: 's_ib25_5', login: '120', password: 'ааа', role: 'student', name: 'Владислав Фёдоров', groupId: 'ИБ25-1', course: 2, interests: [] },

    // Группа ИБ26-1 (5 студентов)
    { id: 's_ib26_1', login: '121', password: 'ааа', role: 'student', name: 'Екатерина Михайлова', groupId: 'ИБ26-1', course: 1, interests: [] },
    { id: 's_ib26_2', login: '122', password: 'ааа', role: 'student', name: 'Денис Беляев', groupId: 'ИБ26-1', course: 1, interests: [] },
    { id: 's_ib26_3', login: '123', password: 'ааа', role: 'student', name: 'Валерия Тарасова', groupId: 'ИБ26-1', course: 1, interests: [] },
    { id: 's_ib26_4', login: '124', password: 'ааа', role: 'student', name: 'Арсений Белов', groupId: 'ИБ26-1', course: 1, interests: [] },
    { id: 's_ib26_5', login: '125', password: 'ааа', role: 'student', name: 'Юлия Комарова', groupId: 'ИБ26-1', course: 1, interests: [] },

    // 3 Куратора с доступом только к своим группам
    { id: 'k_1', login: '201', password: 'ббб', role: 'curator', name: 'Мария Петрова (Куратор 1)', assignedGroups: ['ПИ25-1', 'ПИ26-1'] },
    { id: 'k_2', login: '202', password: 'ббб', role: 'curator', name: 'Сергей Волков (Куратор 2)', assignedGroups: ['ПМ24-1'] },
    { id: 'k_3', login: '203', password: 'ббб', role: 'curator', name: 'Ольга Морозова (Куратор 3)', assignedGroups: ['ИБ25-1', 'ИБ26-1'] },

    // Деканат (доступ ко всем 5 группам)
    { id: 'd_1', login: '333', password: 'ввв', role: 'dean', name: 'Вадим Фёдоров (Деканат)' },

    // Администратор
    { id: 'a_1', login: '444', password: 'ггг', role: 'admin', name: 'IT-администратор' }
];
