const SUPABASE_URL = "https://hberfcawhmudegydhtnb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_W99wvJK_aI_NOhLx9-y8TQ_tx9FQct_";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { detectSessionInUrl: true } });
const $ = (selector) => document.querySelector(selector);
const state = { user: null, member: null, articles: [], adminArticles: [], course: "manual", selectedId: null, completed: new Set(), authMode: "password" };
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
const message = (selector, text, success = false) => { const element = $(selector); element.textContent = text; element.classList.toggle("success", success); };

function redirectUrl() {
  return window.location.hostname.endsWith(".github.io") ? window.location.href.split("?")[0] : "https://gozerr.github.io/qa_learning/";
}

async function getMember(user) {
  const { data, error } = await db.from("access_members").select("id,email,is_admin,status").eq("email", user.email.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

async function enterApp(session) {
  const member = await getMember(session.user);
  if (!member || member.status !== "approved") {
    await db.auth.signOut();
    message("#auth-message", member?.status === "pending" ? "Заявка ещё рассматривается администратором." : "Доступ для этого email не одобрен.");
    return;
  }
  state.user = session.user; state.member = member;
  $("#auth-screen").classList.add("hidden"); $("#app").classList.remove("hidden");
  $("#admin-open").classList.toggle("hidden", !member.is_admin);
  $("#current-user").textContent = session.user.email;
  await Promise.all([loadArticles(), loadProgress()]);
}

async function loadProgress() {
  const { data, error } = await db.from("article_progress").select("article_id").eq("user_id", state.user.id);
  if (error) throw error;
  state.completed = new Set((data || []).map((row) => String(row.article_id)));
}

async function loadArticles() {
  const { data, error } = await db.from("articles").select("*").eq("status", "published").order("course").order("sort_order").order("created_at");
  if (error) throw error;
  state.articles = data || [];
  $("#article-count").textContent = state.articles.length;
  const first = state.articles.find((article) => article.course === state.course);
  state.selectedId = state.articles.some((article) => String(article.id) === String(state.selectedId)) ? state.selectedId : first?.id;
  renderCourse();
  renderResources();
}

function currentArticles() {
  const query = $("#search-input").value.trim().toLowerCase();
  return state.articles.filter((article) => article.course === state.course && `${article.title} ${article.description} ${article.content} ${article.tags || ""}`.toLowerCase().includes(query));
}

function renderCourse() {
  const articles = currentArticles();
  $("#course-title").textContent = state.course === "manual" ? "Manual QA" : "Automation QA — Python";
  $("#course-count").textContent = `${articles.length} ${articles.length === 1 ? "тема" : "тем"}`;
  $("#article-list").innerHTML = articles.length ? articles.map((article, index) => `<button class="article-item ${String(article.id) === String(state.selectedId) ? "active" : ""}" data-id="${article.id}" type="button"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.description)}</small><b>${state.completed.has(String(article.id)) ? "✓" : "→"}</b></button>`).join("") : '<p class="empty-state">По этому запросу ничего не найдено.</p>';
  renderReader();
}

function renderReader() {
  const article = state.articles.find((item) => String(item.id) === String(state.selectedId));
  if (!article) { $("#reader").innerHTML = '<div class="empty-reader"><h2>Выбери тему</h2><p>Открой материал из списка слева.</p></div>'; return; }
  const done = state.completed.has(String(article.id));
  const safeContent = window.DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } });
  $("#reader").innerHTML = `<div class="reader-meta"><span>${article.course === "manual" ? "Manual QA" : "Automation QA — Python"}</span><span>${done ? "Пройдено ✓" : article.read_time || "Учебный материал"}</span></div><h2>${escapeHtml(article.title)}</h2><p class="reader-lead">${escapeHtml(article.description)}</p><div class="article-body">${safeContent}</div><div class="reader-actions"><button id="complete-button" class="${done ? "done" : ""}" type="button">${done ? "Отметить непройденной" : "Отметить пройденной"}</button></div>`;
  $("#complete-button").addEventListener("click", async () => {
    const nextDone = !done;
    const result = nextDone ? await db.from("article_progress").upsert({ user_id: state.user.id, article_id: article.id }) : await db.from("article_progress").delete().eq("user_id", state.user.id).eq("article_id", article.id);
    if (result.error) { message("#search-caption", result.error.message); return; }
    if (nextDone) state.completed.add(String(article.id)); else state.completed.delete(String(article.id));
    renderCourse(); renderProgress();
  });
}

function renderProgress() {
  const total = state.articles.length; const done = state.completed.size; const percent = total ? Math.round(done / total * 100) : 0;
  $("#completed-count").textContent = done; $("#progress-percent").textContent = `${percent}%`;
}

function renderResources() {
  const practice = [{ title: "Bug report", text: "Описывай дефекты с шагами, expected/actual и evidence.", url: "https://www.guru99.com/software-testing.html" }, { title: "API checks", text: "Тренируй status code, schema, негативные сценарии и авторизацию.", url: "https://www.postman.com/" }, { title: "SQL tasks", text: "Проверяй данные после действий пользователя запросами SELECT и JOIN.", url: "https://www.sql-practice.com/" }];
  const tools = [{ title: "Chrome DevTools", category: "Browser", text: "DOM, Console, Network и Application.", url: "https://developer.chrome.com/docs/devtools/" }, { title: "Postman", category: "API", text: "Коллекции, environments и API assertions.", url: "https://www.postman.com/" }, { title: "Playwright", category: "Python automation", text: "Локаторы, auto-waiting, tracing и assertions.", url: "https://playwright.dev/python/" }, { title: "Python", category: "Language", text: "Официальная документация языка и стандартной библиотеки.", url: "https://docs.python.org/3/" }];
  $("#practice-grid").innerHTML = practice.map((item) => `<a class="resource-card" href="${item.url}" target="_blank" rel="noreferrer"><span>ПРАКТИКА</span><h3>${item.title}</h3><p>${item.text}</p><b>Открыть ↗</b></a>`).join("");
  $("#tools-grid").innerHTML = tools.map((item) => `<a class="resource-card" href="${item.url}" target="_blank" rel="noreferrer"><span>${item.category}</span><h3>${item.title}</h3><p>${item.text}</p><b>Документация ↗</b></a>`).join("");
}

async function submitAuth(event) {
  event.preventDefault();
  const email = $("#auth-email").value.trim().toLowerCase();
  const result = state.authMode === "password" ? await db.auth.signInWithPassword({ email, password: $("#auth-password").value }) : await db.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl() } });
  if (result.error) { message("#auth-message", result.error.message); return; }
  message("#auth-message", state.authMode === "password" ? "Вход выполнен." : "Проверь почту и открой последнюю ссылку.", true);
}

$("#auth-form").addEventListener("submit", submitAuth);
$("#auth-mode-toggle").addEventListener("click", () => { state.authMode = state.authMode === "password" ? "magic" : "password"; $("#password-field").classList.toggle("hidden", state.authMode !== "password"); $("#auth-password").required = state.authMode === "password"; $("#auth-mode-toggle").textContent = state.authMode === "password" ? "Войти по ссылке из email" : "Войти по паролю"; $("#auth-submit-label").textContent = state.authMode === "password" ? "Войти" : "Отправить ссылку"; });
$("#request-access-button").addEventListener("click", () => { $("#request-modal").classList.remove("hidden"); $("#request-email").value = $("#auth-email").value; });
document.querySelectorAll("[data-close-request]").forEach((element) => element.addEventListener("click", () => $("#request-modal").classList.add("hidden")));
$("#request-form").addEventListener("submit", async (event) => { event.preventDefault(); const email = $("#request-email").value.trim().toLowerCase(); const { error } = await db.from("access_requests").insert({ name: $("#request-name").value.trim(), email, message: $("#request-message").value.trim() }); message("#request-status", error ? error.message : "Заявка отправлена. Администратор рассмотрит её.", !error); if (!error) event.target.reset(); });
$("#logout-button").addEventListener("click", () => db.auth.signOut());
document.querySelectorAll(".course-tab").forEach((button) => button.addEventListener("click", () => { state.course = button.dataset.course; const first = state.articles.find((article) => article.course === state.course); state.selectedId = first?.id; document.querySelectorAll(".course-tab").forEach((tab) => tab.classList.toggle("active", tab === button)); renderCourse(); }));
$("#article-list").addEventListener("click", (event) => { const button = event.target.closest("[data-id]"); if (button) { state.selectedId = button.dataset.id; renderCourse(); } });
$("#search-input").addEventListener("input", renderCourse);

function openAdmin() { $("#admin-modal").classList.remove("hidden"); renderAdminList(); }
async function renderAdminList() { const { data, error } = await db.from("articles").select("*").order("course").order("sort_order"); if (error) { message("#admin-message", error.message); return; } state.adminArticles = data || []; $("#admin-list").innerHTML = state.adminArticles.map((article) => `<div class="admin-row"><span><strong>${escapeHtml(article.title)}</strong><small>${article.course} · ${article.status}</small></span><button data-edit="${article.id}" type="button">Изменить</button><button class="danger-button" data-delete="${article.id}" type="button">Удалить</button></div>`).join(""); }
$("#admin-open").addEventListener("click", openAdmin);
document.querySelectorAll("[data-close-admin]").forEach((element) => element.addEventListener("click", () => $("#admin-modal").classList.add("hidden")));
$("#article-form").addEventListener("submit", async (event) => { event.preventDefault(); const id = $("#edit-id").value; const payload = { course: $("#edit-course").value, title: $("#edit-title").value.trim(), description: $("#edit-description").value.trim(), content: $("#edit-content").value, status: $("#edit-status").value, sort_order: Number($("#edit-order").value || 0) }; const result = id ? await db.from("articles").update(payload).eq("id", id) : await db.from("articles").insert(payload); if (result.error) { message("#admin-message", result.error.message); return; } message("#admin-message", "Статья сохранена.", true); event.target.reset(); $("#edit-id").value = ""; await renderAdminList(); await loadArticles(); });
$("#admin-list").addEventListener("click", async (event) => { const edit = event.target.closest("[data-edit]"); const remove = event.target.closest("[data-delete]"); if (edit) { const article = state.adminArticles.find((item) => String(item.id) === edit.dataset.edit); if (article) { $("#edit-id").value = article.id; $("#edit-course").value = article.course; $("#edit-title").value = article.title; $("#edit-description").value = article.description; $("#edit-content").value = article.content; $("#edit-status").value = article.status; $("#edit-order").value = article.sort_order; } } if (remove && window.confirm("Удалить статью безвозвратно? Связанный прогресс также будет удалён.")) { const { error } = await db.from("articles").delete().eq("id", remove.dataset.delete); if (error) { message("#admin-message", error.message); return; } message("#admin-message", "Статья удалена.", true); await renderAdminList(); await loadArticles(); } });

db.auth.getSession().then(({ data }) => data.session && enterApp(data.session).catch((error) => message("#auth-message", error.message)));
db.auth.onAuthStateChange((_event, session) => { if (session && !state.user) enterApp(session).catch((error) => message("#auth-message", error.message)); if (!session) { state.user = null; $("#auth-screen").classList.remove("hidden"); $("#app").classList.add("hidden"); } });
