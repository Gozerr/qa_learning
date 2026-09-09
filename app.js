const topics = [
  {
    id: "basics", order: 1, title: "Основы тестирования", description: "Понять, что такое тестирование и зачем оно нужно.", icon: "01",
    definition: "Тестирование ПО — это процесс проверки программного продукта и связанных с ним материалов, который помогает оценить качество, соответствие требованиям и обнаружить дефекты.",
    simple: "Тестировщик не просто нажимает кнопки. Он собирает информацию о продукте, сравнивает поведение с ожиданиями и ищет ситуации, в которых система может подвести пользователя.",
    why: "Без базового понимания качества и дефектов легко проверять случайные вещи и пропускать важные риски.",
    how: ["Изучить требования и контекст продукта.", "Выбрать важные сценарии и данные.", "Выполнить проверки и записать наблюдения.", "Сравнить ожидаемый и фактический результат.", "Передать команде понятную информацию о найденных рисках."],
    example: "В интернет-магазине проверяем добавление товара в корзину: количество, цену, удаление товара и сохранение корзины после обновления страницы.",
    qa: "Для формы входа проверяем корректные и некорректные данные, пустые поля, сообщения об ошибках, восстановление пароля и поведение после нескольких попыток.",
    mistakes: ["Считать, что успешный тест доказывает отсутствие всех дефектов.", "Проверять только позитивный сценарий.", "Описывать проблему без шагов и ожидаемого результата."],
    remember: "Тестирование показывает наличие дефектов, но не доказывает их полное отсутствие.",
    task: "Возьми любую форму на сайте и составь 10 проверок: позитивные, негативные, граничные и проверки удобства.",
    related: ["Виды и уровни тестирования", "Тест-дизайн", "Тестовая документация"]
  },
  {
    id: "types", order: 2, title: "Виды и уровни тестирования", description: "Разобраться в классификациях тестирования.", icon: "02",
    definition: "Виды тестирования описывают цель и способ проверки, а уровни — масштаб объекта, который проверяется: от отдельного компонента до системы целиком.",
    simple: "Один и тот же продукт можно проверять с разных сторон: работает ли функция, быстро ли она работает, не сломалось ли старое после изменений.",
    why: "Классификация помогает выбрать подходящий набор проверок, а не называть любой прогон тестов «регрессией».",
    how: ["Функциональное — проверяет, что система делает.", "Нефункциональное — проверяет характеристики: скорость, безопасность, удобство.", "Smoke — быстро оценивает стабильность сборки.", "Retest — проверяет конкретное исправление.", "Regression — ищет побочные эффекты изменений."],
    example: "После изменения скидки retest проверит сам расчёт скидки, а regression дополнительно проверит корзину, оплату и итоговую сумму.",
    qa: "На уровне интеграции можно проверить, что форма заказа передаёт данные в API, а API корректно сохраняет их в базе.",
    mistakes: ["Использовать smoke как замену полному тестированию.", "Путать retest и regression.", "Смешивать вид тестирования и уровень тестирования."],
    remember: "Retest отвечает на вопрос «исправлен ли этот дефект?», regression — «не сломалось ли что-то ещё?»",
    task: "Для изменения «добавили промокод» составь отдельные списки smoke, retest и regression-проверок.",
    related: ["Основы тестирования", "Жизненный цикл разработки", "Тестовая документация"]
  },
  {
    id: "sdlc", order: 3, title: "Жизненный цикл разработки и тестирования", description: "Понять, где находится QA в процессе создания продукта.", icon: "03",
    definition: "SDLC — жизненный цикл разработки ПО. STLC — совокупность процессов и активностей, связанных с тестированием продукта.",
    simple: "QA подключается не только в момент, когда разработчик уже написал код. Хорошие вопросы можно задавать на этапе требований, дизайна и планирования.",
    why: "Раннее обнаружение неоднозначного требования обычно дешевле и полезнее, чем поиск проблемы после релиза.",
    how: ["Анализ требований и рисков.", "Планирование подхода к тестированию.", "Подготовка тестовой документации и данных.", "Проверка сборки и окружения.", "Выполнение тестов, отчётность и завершение тестирования."],
    example: "В user story про восстановление пароля заранее уточняем срок жизни ссылки, поведение неизвестного email и требования к новому паролю.",
    qa: "В Scrum тестировщик участвует в refinement, проверяет критерии приёмки в спринте и делится рисками на review и retrospective.",
    mistakes: ["Воспринимать QA как финальный фильтр перед релизом.", "Начинать тесты без понимания критериев приёмки.", "Игнорировать изменения требований."],
    remember: "Качество — ответственность всей команды, а не только человека, который выполняет тесты.",
    task: "Возьми простую user story и выпиши вопросы, которые нужно задать до начала разработки.",
    related: ["Основы тестирования", "Тестовая документация", "Тест-дизайн"]
  },
  {
    id: "design", order: 4, title: "Тест-дизайн", description: "Научиться придумывать эффективные проверки.", icon: "04",
    definition: "Тест-дизайн — процесс выбора тестовых условий и случаев, которые дают достаточное покрытие при разумных затратах.",
    simple: "Вместо случайного перебора значений мы выбираем representative cases: классы эквивалентности, границы, комбинации условий и вероятные ошибки.",
    why: "Время ограничено. Техники тест-дизайна помогают находить больше важных дефектов меньшим количеством проверок.",
    how: ["Разделить входные данные на эквивалентные классы.", "Проверить значения на границах и рядом с ними.", "Использовать таблицу решений для комбинаций условий.", "Описать переходы между состояниями.", "Добавить проверки на основе опыта — error guessing."],
    example: "Для возраста 18–65 достаточно начать с 17, 18, 19, 30, 64, 65 и 66, а не проверять каждый год.",
    qa: "Для формы оплаты таблица решений может комбинировать авторизацию пользователя, наличие товара и доступность способа оплаты.",
    mistakes: ["Проверять только среднее допустимое значение.", "Забывать отрицательные классы.", "Создавать много дубликатов, не покрывающих новые риски."],
    remember: "Хороший тест — не самый длинный, а тот, который проверяет конкретный риск.",
    task: "Составь набор тестов для поля «пароль от 8 до 20 символов» с эквивалентными классами и границами.",
    related: ["Основы тестирования", "Тестовая документация", "Виды и уровни тестирования"]
  },
  {
    id: "documentation", order: 5, title: "Тестовая документация", description: "Научиться работать с чек-листами, тест-кейсами и баг-репортами.", icon: "05",
    definition: "Тестовая документация фиксирует условия, проверки, результаты и найденные проблемы так, чтобы другой участник команды мог понять и повторить работу.",
    simple: "Документ — это не бюрократия ради бюрократии. Он помогает не держать проверки в голове и передавать контекст без потери смысла.",
    why: "Понятный баг-репорт экономит время разработчикам, а хороший чек-лист делает повторную проверку стабильной.",
    how: ["Чек-лист перечисляет проверки кратко.", "Тест-кейс описывает предусловия, шаги, данные и ожидаемый результат.", "Bug report описывает окружение, шаги, expected и actual result, severity и priority."],
    example: "Заголовок бага: «[Cart] Товар не удаляется после нажатия “Удалить”». Далее — окружение, шаги, ожидание и факт.",
    qa: "Если дефект воспроизводится только после обновления страницы, это обязательно указываем в предусловиях или шагах.",
    mistakes: ["Писать заголовок вроде «Не работает корзина».", "Смешивать ожидаемый и фактический результат.", "Не указывать окружение и данные."],
    remember: "Хороший отчёт позволяет воспроизвести проблему без устного объяснения.",
    task: "Оформи баг-репорт для любого дефекта на демо-сайте: добавь точный заголовок, шаги, expected, actual и severity.",
    related: ["Тест-дизайн", "Виды и уровни тестирования", "Веб-тестирование"]
  },
  {
    id: "web", order: 6, title: "Веб-тестирование", description: "Понять, как работают браузер, клиент, сервер и HTTP.", icon: "06",
    definition: "Веб-тестирование проверяет работу веб-приложения в браузере, включая интерфейс, сетевое взаимодействие, данные, совместимость и ошибки.",
    simple: "Браузер — клиент: он отправляет запросы. Сервер обрабатывает их и возвращает HTML, JSON, изображения или ошибку.",
    why: "Понимание цепочки клиент → сеть → сервер помогает искать причину, а не только фиксировать внешний симптом.",
    how: ["Проверить интерфейс и состояния элементов.", "Посмотреть запрос в Network.", "Проверить HTTP-метод, статус, headers и body.", "Сравнить поведение в разных браузерах и размерах экрана.", "Проверить cookies и localStorage."],
    example: "Если список не загрузился, в DevTools проверяем: ушёл ли запрос, какой статус вернулся и что лежит в response.",
    qa: "Для формы регистрации проверяем валидацию на клиенте, ответ API, повторную отправку и отображение ошибки сервера.",
    mistakes: ["Проверять только happy path.", "Не отличать ошибку интерфейса от ошибки API.", "Не проверять мобильный viewport."],
    remember: "Визуальная проблема и проблема данных могут иметь разные причины.",
    task: "Открой DevTools на любом сайте и найди один GET-запрос: запиши URL, статус, метод и кратко опиши response.",
    related: ["DevTools", "API", "Основы тестирования"]
  },
  {
    id: "devtools", order: 7, title: "DevTools", description: "Научиться исследовать веб-приложение через инструменты браузера.", icon: "07",
    definition: "Chrome DevTools — набор инструментов разработчика для исследования DOM, CSS, JavaScript, сети, хранилищ и производительности страницы.",
    simple: "Это рабочая лупа тестировщика: можно увидеть, что реально отрисовано, какие запросы ушли и какие ошибки возникли.",
    why: "DevTools помогает быстро локализовать проблему и приложить к багу полезные технические данные.",
    how: ["Elements — DOM и стили.", "Console — сообщения и JavaScript-ошибки.", "Network — запросы, статусы, headers, response.", "Application — cookies, localStorage и sessionStorage."],
    example: "В Network можно включить Preserve log, воспроизвести ошибку и сохранить запрос с ответом для анализа.",
    qa: "Если кнопка выглядит доступной, но не работает, Console и Network часто показывают ошибку обработчика или API.",
    mistakes: ["Менять CSS в DevTools и считать, что это исправило продукт.", "Смотреть только статус запроса без response.", "Не фиксировать timestamp и окружение."],
    remember: "DevTools — источник наблюдений, а не доказательство причины без проверки гипотезы.",
    task: "Найди на странице элемент через Elements, измени ему стиль и проверь в Network один запрос при взаимодействии.",
    related: ["Веб-тестирование", "API", "Тестовая документация"]
  },
  {
    id: "api", order: 8, title: "API и Postman", description: "Понять HTTP API и научиться проверять API.", icon: "08",
    definition: "API — интерфейс взаимодействия программ по заранее определённым правилам. HTTP API использует запросы и ответы: метод, URL, заголовки, тело и статус.",
    simple: "Клиент отправляет договорённый запрос, сервер возвращает результат. Тестировщик проверяет не только статус, но и смысл ответа.",
    why: "Проверка API помогает находить дефекты быстрее и отделять проблемы интерфейса от проблем сервера.",
    how: ["Выбрать метод и URL.", "Добавить параметры, headers и body.", "Отправить запрос.", "Проверить status code, schema, данные, права и время ответа.", "Проверить некорректные входные данные."],
    example: "GET /users/42 должен вернуть пользователя 42. POST /users с валидным JSON должен создать ресурс и вернуть 201.",
    qa: "Для endpoint авторизации проверяем успешный вход, неверный пароль, пустые поля, 401/403 и отсутствие лишних данных в ответе.",
    mistakes: ["Считать 200 доказательством корректного результата.", "Не проверять обязательные поля и типы данных.", "Не тестировать права доступа."],
    remember: "Статус-код, тело ответа и headers нужно оценивать вместе.",
    task: "Создай в Postman коллекцию из GET и POST-запросов к публичному API и добавь минимум три негативные проверки.",
    related: ["Веб-тестирование", "DevTools", "Тестовая документация"]
  },
  {
    id: "sql", order: 9, title: "SQL", description: "Научиться получать и проверять данные в базе.", icon: "09",
    definition: "SQL — язык для работы с реляционными базами данных: получения, фильтрации, сортировки, группировки и объединения данных.",
    simple: "Через SQL тестировщик может проверить, что действие в приложении привело к правильному состоянию данных.",
    why: "UI показывает только часть состояния. База помогает подтвердить, что запись действительно создана, изменена или связана с другой записью.",
    how: ["SELECT получает данные.", "WHERE фильтрует строки.", "ORDER BY сортирует.", "GROUP BY агрегирует.", "JOIN объединяет таблицы по связанному полю."],
    example: "SELECT * FROM users WHERE id = 10; найдёт пользователя с id 10.",
    qa: "После оформления заказа проверяем запись заказа, его статус и связь с user_id и товарами.",
    mistakes: ["Запускать UPDATE или DELETE без WHERE.", "Путать фильтр и сортировку.", "Проверять только наличие строки, но не значения и связи."],
    remember: "SQL-проверка должна отвечать на конкретный вопрос о состоянии данных.",
    task: "На учебной базе напиши запросы для поиска пользователей без email, подсчёта заказов по статусам и объединения users с orders.",
    related: ["Веб-тестирование", "API", "Основы тестирования"]
  },
  {
    id: "practice", order: 10, title: "Практика", description: "Перенести знания на реальные задачи.", icon: "10",
    definition: "Практика — самостоятельное применение изученных техник к продукту, задаче или учебному окружению с фиксацией результата.",
    simple: "Знание термина становится навыком, когда ты можешь выбрать проверку, объяснить риск и оформить наблюдение.",
    why: "Практика показывает пробелы, которые невозможно заметить при чтении теории.",
    how: ["Выбрать объект и цель проверки.", "Описать риски и границы.", "Составить проверки.", "Выполнить их в разных условиях.", "Оформить результаты и выводы."],
    example: "На демо-магазине составляем чек-лист корзины, проверяем его на desktop и mobile, затем оформляем найденные дефекты.",
    qa: "Практическое портфолио может содержать чек-лист, несколько тест-кейсов, баг-репорты и коллекцию API-запросов.",
    mistakes: ["Собирать только скриншоты без объяснения.", "Проверять продукт бессистемно.", "Не перепроверять найденный дефект."],
    remember: "Практика — это не количество кликов, а качество вопросов и выводов.",
    task: "Выбери знакомый сайт и подготовь мини-отчёт: цель, риски, 15 проверок, найденные проблемы и рекомендации.",
    related: ["Тестовая документация", "Тест-дизайн", "Веб-тестирование"]
  },
  {
    id: "automation", order: 11, title: "Автоматизация", description: "Познакомиться с автоматизацией тестирования.", icon: "11",
    definition: "Автоматизация тестирования — использование программ и скриптов для выполнения проверок и обработки результатов с минимальным ручным вмешательством.",
    simple: "Повторяющийся сценарий можно описать кодом, чтобы запускать его быстро и одинаково. Но автоматизация не заменяет исследовательское мышление.",
    why: "Автотесты полезны для повторяемых проверок, smoke и regression, особенно после изменений.",
    how: ["Выбрать стабильный сценарий.", "Найти элементы локаторами.", "Дождаться нужного состояния.", "Выполнить действия и assertions.", "Сохранить результат и диагностические данные."],
    example: "Тест открывает страницу входа, вводит данные, нажимает кнопку и проверяет появление личного кабинета.",
    qa: "Playwright поддерживает локаторы, auto-waiting, browser contexts, tracing и параллельный запуск.",
    mistakes: ["Автоматизировать нестабильный сценарий.", "Использовать длинные sleep вместо ожидания состояния.", "Писать тест без понятного assertion."],
    remember: "Сначала нужно понимать, что и зачем проверять вручную, а уже потом автоматизировать.",
    task: "Выбери один стабильный сценарий и опиши его как автотест: setup, действия, локаторы, ожидания и assertions.",
    related: ["Тест-дизайн", "DevTools", "Практика"]
  }
];

const practiceResources = [
  { title: "Manual QA", description: "Чек-листы, тест-кейсы и баг-репорты на учебных веб-продуктах.", type: "Практика", url: "https://www.guru99.com/software-testing.html" },
  { title: "API", description: "Отправка запросов, проверки ответов и работа с коллекциями.", type: "API", url: "https://www.postman.com/" },
  { title: "SQL", description: "Запросы к учебным базам и тренировка фильтрации данных.", type: "Базы данных", url: "https://www.sql-practice.com/" },
  { title: "Test Design", description: "Граничные значения, классы эквивалентности и таблицы решений.", type: "Тест-дизайн", url: "https://istqb.org/" },
  { title: "Automation", description: "Первые сценарии в браузере и знакомство с Playwright.", type: "Автоматизация", url: "https://playwright.dev/docs/intro" }
];

const tools = [
  { title: "Chrome DevTools", category: "Браузер", description: "DOM, Console, Network и Application.", url: "https://developer.chrome.com/docs/devtools/" },
  { title: "Postman", category: "API", description: "Запросы, коллекции и проверки API.", url: "https://www.postman.com/" },
  { title: "DBeaver", category: "База данных", description: "Работа с SQL-базами через удобный интерфейс.", url: "https://dbeaver.io/" },
  { title: "Git", category: "Версии", description: "История изменений и совместная работа с кодом.", url: "https://git-scm.com/docs" },
  { title: "Playwright", category: "Автоматизация", description: "Современная автоматизация браузеров.", url: "https://playwright.dev/docs/intro" }
];

const progressKey = "qa-guide-progress";
let completed = new Set(JSON.parse(localStorage.getItem(progressKey) || "[]"));
let selectedTopicId = topics[0].id;

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify([...completed]));
}

function renderProgress() {
  const percent = Math.round((completed.size / topics.length) * 100);
  $("#progress-value").textContent = `${completed.size} из ${topics.length}`;
  $("#progress-bar").style.width = `${percent}%`;
  $("#progress-title").textContent = percent ? `Пройдено ${percent}% маршрута` : "Твой прогресс";
}

function renderTopicList(list = topics) {
  $("#topic-count").textContent = `${list.length} ${list.length === 1 ? "тема" : "тем"}`;
  $("#topic-list").innerHTML = list.length
    ? list.map((topic) => `<button class="topic-item ${topic.id === selectedTopicId ? "active" : ""}" type="button" data-topic-id="${topic.id}"><span class="topic-index">${topic.icon}</span><span><strong>${escapeHtml(topic.title)}</strong><small>${escapeHtml(topic.description)}</small></span><span class="topic-status">${completed.has(topic.id) ? "✓" : "→"}</span></button>`).join("")
    : '<p class="no-results">Ничего не найдено. Попробуй другой запрос.</p>';
}

function renderArticle() {
  const topic = topics.find((item) => item.id === selectedTopicId) || topics[0];
  selectedTopicId = topic.id;
  const isCompleted = completed.has(topic.id);
  $("#article-view").innerHTML = `
    <div class="article-topline"><span class="article-order">Шаг ${topic.order} из ${topics.length}</span><span class="article-complete">${isCompleted ? "Пройдено ✓" : "В процессе"}</span></div>
    <h2>${escapeHtml(topic.title)}</h2>
    <p class="article-lead">${escapeHtml(topic.description)}</p>
    <div class="article-section"><h3>Короткое определение</h3><p>${escapeHtml(topic.definition)}</p></div>
    <div class="article-section"><h3>Простыми словами</h3><p>${escapeHtml(topic.simple)}</p></div>
    <div class="article-section"><h3>Зачем это нужно тестировщику</h3><p>${escapeHtml(topic.why)}</p></div>
    <div class="article-section"><h3>Как это работает</h3><ol>${topic.how.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></div>
    <div class="article-example"><div><span>Пример</span><p>${escapeHtml(topic.example)}</p></div><div><span>Из реального QA</span><p>${escapeHtml(topic.qa)}</p></div></div>
    <div class="article-section"><h3>Типичные ошибки</h3><ul>${topic.mistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
    <div class="remember-box"><strong>Что нужно запомнить</strong><p>${escapeHtml(topic.remember)}</p></div>
    <div class="task-box"><span>Практическое задание</span><p>${escapeHtml(topic.task)}</p></div>
    <div class="related-topics"><strong>Связанные темы</strong>${topic.related.map((title) => `<button type="button" data-related-title="${escapeHtml(title)}">${escapeHtml(title)}</button>`).join("")}</div>
    <div class="article-navigation"><button id="previous-topic" type="button">← Предыдущая тема</button><button id="complete-topic" class="${isCompleted ? "done" : ""}" type="button">${isCompleted ? "Отметить непройденной" : "Отметить пройденной"}</button><button id="next-topic" type="button">Следующая тема →</button></div>
  `;
  $("#complete-topic").addEventListener("click", () => {
    if (completed.has(topic.id)) completed.delete(topic.id); else completed.add(topic.id);
    saveProgress(); renderProgress(); renderTopicList(); renderArticle();
  });
  $("#previous-topic").addEventListener("click", () => selectTopic(Math.max(0, topic.order - 2)));
  $("#next-topic").addEventListener("click", () => selectTopic(Math.min(topics.length - 1, topic.order)));
  $("#article-view").querySelectorAll("[data-related-title]").forEach((button) => button.addEventListener("click", () => {
    const next = topics.find((item) => item.title === button.dataset.relatedTitle);
    if (next) selectTopic(topics.indexOf(next));
  }));
}

function selectTopic(index) {
  const topic = topics[index];
  if (!topic) return;
  selectedTopicId = topic.id;
  renderTopicList();
  renderArticle();
  $("#article-view").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResources() {
  $("#practice-grid").innerHTML = practiceResources.map((resource) => `<a class="resource-card" href="${resource.url}" target="_blank" rel="noreferrer"><span class="resource-type">${escapeHtml(resource.type)}</span><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.description)}</p><span class="resource-link">Открыть ресурс ↗</span></a>`).join("");
  $("#tools-grid").innerHTML = tools.map((tool) => `<a class="tool-card" href="${tool.url}" target="_blank" rel="noreferrer"><span class="tool-category">${escapeHtml(tool.category)}</span><h3>${escapeHtml(tool.title)}</h3><p>${escapeHtml(tool.description)}</p><span class="tool-arrow">↗</span></a>`).join("");
}

function searchMaterials(query) {
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? topics.filter((topic) => `${topic.title} ${topic.description} ${topic.definition} ${topic.simple} ${topic.why} ${topic.example} ${topic.qa} ${topic.task} ${topic.related.join(" ")}`.toLowerCase().includes(normalized)) : topics;
  renderTopicList(filtered);
  if (filtered.length && !filtered.some((topic) => topic.id === selectedTopicId)) selectTopic(topics.indexOf(filtered[0]));
}

$("#topic-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-topic-id]");
  if (button) selectTopic(topics.findIndex((topic) => topic.id === button.dataset.topicId));
});
$("#search-form").addEventListener("submit", (event) => event.preventDefault());
$("#global-search").addEventListener("input", (event) => {
  searchMaterials(event.target.value);
  if (event.target.value.trim()) $("#materials").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#reset-progress").addEventListener("click", () => {
  completed.clear(); saveProgress(); renderProgress(); renderTopicList(); renderArticle();
});
$("#mobile-menu-button").addEventListener("click", () => {
  const expanded = $("#mobile-menu-button").getAttribute("aria-expanded") === "true";
  $("#mobile-menu-button").setAttribute("aria-expanded", String(!expanded));
  $("#main-nav").classList.toggle("is-open", !expanded);
});
$("#main-nav").addEventListener("click", () => {
  $("#main-nav").classList.remove("is-open");
  $("#mobile-menu-button").setAttribute("aria-expanded", "false");
});

renderProgress();
renderTopicList();
renderArticle();
renderResources();
