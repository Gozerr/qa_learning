const SUPABASE_URL = "https://hberfcawhmudegydhtnb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_W99wvJK_aI_NOhLx9-y8TQ_tx9FQct_";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { detectSessionInUrl: true } });
const $ = (selector) => document.querySelector(selector);
const state = { user: null, member: null, articles: [], adminArticles: [], resources: [], course: "manual", selectedId: null, completed: new Set(), authMode: "password" };
let articleEditor;
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
const message = (selector, text, success = false) => { const element = $(selector); element.textContent = text; element.classList.toggle("success", success); };

function redirectUrl() {
  return window.location.hostname.endsWith(".github.io") ? window.location.href.split("?")[0] : "https://gozerr.github.io/qa_learning/";
}

async function getMember(user) {
  const email = user.email?.trim().toLowerCase();
  if (!email) throw new Error("У аккаунта Supabase отсутствует email.");
  const { data, error } = await db.from("access_members").select("id,email,is_admin,status").eq("email", email).maybeSingle();
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
  $("#admin-open").textContent = member.is_admin ? "CMS · Admin" : "CMS";
  $("#current-user").textContent = `${member.is_admin ? "Администратор" : "Участник"} · ${session.user.email}`;
  await Promise.all([loadArticles(), loadProgress(), loadResources()]);
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
  const adminActions = state.member?.is_admin ? '<button id="inline-edit-article" class="inline-edit-button" type="button" title="Редактировать статью">✎</button>' : "";
  $("#reader").innerHTML = `<div class="reader-meta"><span>${article.course === "manual" ? "Manual QA" : "Automation QA — Python"}</span><span>${done ? "Пройдено ✓" : article.read_time || "Учебный материал"}</span></div><div class="reader-title-row"><h2>${escapeHtml(article.title)}</h2>${adminActions}</div><p class="reader-lead">${escapeHtml(article.description)}</p><div class="article-body">${safeContent}</div><div class="reader-actions"><button id="complete-button" class="${done ? "done" : ""}" type="button">${done ? "Отметить непройденной" : "Отметить пройденной"}</button></div>`;
  if (state.member?.is_admin) $("#inline-edit-article").addEventListener("click", () => renderInlineArticleEditor(article));
  $("#complete-button").addEventListener("click", async () => {
    const nextDone = !done;
    const result = nextDone ? await db.from("article_progress").upsert({ user_id: state.user.id, article_id: article.id }) : await db.from("article_progress").delete().eq("user_id", state.user.id).eq("article_id", article.id);
    if (result.error) { message("#search-caption", result.error.message); return; }
    if (nextDone) state.completed.add(String(article.id)); else state.completed.delete(String(article.id));
    renderCourse(); renderProgress();
  });
}

function renderInlineArticleEditor(article) {
  const editor = $("#reader");
  editor.innerHTML = `<div class="inline-editor"><div class="inline-editor-header"><strong>Редактирование статьи</strong><div><button id="inline-save-article" class="primary-button" type="button">Сохранить</button><button id="inline-cancel-article" class="secondary-button" type="button">Отмена</button></div></div><label>Название<input id="inline-title" value="${escapeHtml(article.title)}" /></label><label>Краткое описание<input id="inline-description" value="${escapeHtml(article.description)}" /></label><div class="inline-toolbar"><button type="button" data-inline-command="bold"><strong>B</strong></button><button type="button" data-inline-command="italic"><em>I</em></button><button type="button" data-inline-command="insertUnorderedList">• Список</button><button type="button" data-inline-command="formatBlock" data-inline-value="h3">H3</button><button type="button" data-inline-action="link">Ссылка</button></div><div id="inline-content" class="inline-content-editor" contenteditable="true">${safeInlineContent(article.content)}</div></div>`;
  document.querySelectorAll("[data-inline-command]").forEach((button) => button.addEventListener("click", () => { $("#inline-content").focus(); const command = button.dataset.inlineCommand; document.execCommand(command, false, command === "formatBlock" ? `<${button.dataset.inlineValue}>` : undefined); }));
  document.querySelector("[data-inline-action='link']").addEventListener("click", () => { const url = window.prompt("URL ссылки"); if (url) { $("#inline-content").focus(); document.execCommand("createLink", false, url.trim()); } });
  $("#inline-cancel-article").addEventListener("click", renderCourse);
  $("#inline-save-article").addEventListener("click", () => saveInlineArticle(article));
}

function safeInlineContent(content) {
  return window.DOMPurify.sanitize(content || "", { USE_PROFILES: { html: true } }).replace(/<script[\s\S]*?<\/script>/gi, "");
}

async function saveInlineArticle(article) {
  const content = window.DOMPurify.sanitize($("#inline-content").innerHTML, { USE_PROFILES: { html: true } });
  const payload = { title: $("#inline-title").value.trim(), description: $("#inline-description").value.trim(), content };
  const { error } = await db.from("articles").update(payload).eq("id", article.id);
  if (error) { message("#search-caption", error.message); return; }
  article.title = payload.title; article.description = payload.description; article.content = payload.content;
  await writeAudit("inline_update", article.id);
  renderCourse();
}

function renderProgress() {
  const total = state.articles.length; const done = state.completed.size; const percent = total ? Math.round(done / total * 100) : 0;
  $("#completed-count").textContent = done; $("#progress-percent").textContent = `${percent}%`;
}

async function loadResources() {
  const { data, error } = await db.from("resources").select("*").eq("status", "published").order("resource_type").order("sort_order");
  if (error) throw error;
  state.resources = data || [];
  renderResources();
}
function renderResources() {
  const card = (item) => `<div class="resource-card-wrap"><a class="resource-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(item.category || (item.resource_type === "practice" ? "ПРАКТИКА" : "ИНСТРУМЕНТ"))}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><b>Открыть ↗</b></a>${state.member?.is_admin ? `<div class="resource-admin-actions"><button type="button" data-resource-inline-edit="${item.id}" title="Редактировать">✎</button><button type="button" data-resource-inline-delete="${item.id}" title="Удалить">×</button></div>` : ""}</div>`;
  $("#practice-grid").innerHTML = state.resources.filter((item) => item.resource_type === "practice").map(card).join("");
  $("#tools-grid").innerHTML = state.resources.filter((item) => item.resource_type === "tool").map(card).join("");
  bindResourceActions();
}

function bindResourceActions() {
  document.querySelectorAll("[data-resource-inline-edit]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); const item = state.resources.find((resource) => String(resource.id) === button.dataset.resourceInlineEdit); if (item) renderInlineResourceEditor(item); }));
  document.querySelectorAll("[data-resource-inline-delete]").forEach((button) => button.addEventListener("click", async (event) => { event.preventDefault(); event.stopPropagation(); if (!window.confirm("Удалить этот блок?")) return; const { error } = await db.from("resources").delete().eq("id", button.dataset.resourceInlineDelete); if (error) { message("#search-caption", error.message); return; } await loadResources(); }));
}

function renderInlineResourceEditor(item) {
  const wrapper = document.querySelector(`[data-resource-inline-edit="${item.id}"]`).closest(".resource-card-wrap");
  wrapper.innerHTML = `<form class="inline-resource-editor"><div class="form-grid"><label>Тип<select name="resource_type"><option value="practice">Практика</option><option value="tool">Инструмент</option></select></label><label>Категория<input name="category" value="${escapeHtml(item.category)}" /></label></div><label>Название<input name="title" value="${escapeHtml(item.title)}" required /></label><label>Описание<input name="description" value="${escapeHtml(item.description)}" required /></label><label>Ссылка<input name="url" type="url" value="${escapeHtml(item.url)}" required /></label><div class="admin-form-actions"><button class="primary-button" type="submit">Сохранить</button><button class="secondary-button" type="button" data-resource-inline-cancel>Отмена</button></div></form>`;
  wrapper.querySelector("[name='resource_type']").value = item.resource_type;
  wrapper.querySelector("form").addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.target); const { error } = await db.from("resources").update({ resource_type: form.get("resource_type"), category: form.get("category").trim(), title: form.get("title").trim(), description: form.get("description").trim(), url: form.get("url").trim() }).eq("id", item.id); if (error) { message("#search-caption", error.message); return; } await loadResources(); });
  wrapper.querySelector("[data-resource-inline-cancel]").addEventListener("click", renderResources);
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

function openAdmin() { $("#admin-modal").classList.remove("hidden"); renderAdminList(); renderResourceAdminList(); }
async function renderAdminList() { const { data, error } = await db.from("articles").select("*").order("course").order("sort_order"); if (error) { message("#admin-message", error.message); return; } state.adminArticles = data || []; $("#admin-list").innerHTML = state.adminArticles.map((article) => `<div class="admin-row"><span><strong>${escapeHtml(article.title)}</strong><small>${article.course} · ${article.status} · ${article.level || "beginner"}</small></span><button data-edit="${article.id}" type="button">Изменить</button><button data-duplicate="${article.id}" type="button">Дубль</button><button class="danger-button" data-delete="${article.id}" type="button">Удалить</button></div>`).join(""); }
async function renderResourceAdminList() {
  const { data, error } = await db.from("resources").select("*").order("resource_type").order("sort_order");
  if (error) { message("#admin-message", error.message); return; }
  const resources = data || [];
  $("#resource-admin-list").innerHTML = resources.map((item) => `<div class="admin-row"><span><strong>${escapeHtml(item.title)}</strong><small>${item.resource_type === "practice" ? "Практика" : "Инструмент"} · ${escapeHtml(item.url)}</small></span><button data-resource-edit="${item.id}" type="button">Изменить</button><button class="danger-button" data-resource-delete="${item.id}" type="button">Удалить</button></div>`).join("");
}
$("#admin-open").addEventListener("click", openAdmin);
document.querySelectorAll("[data-close-admin]").forEach((element) => element.addEventListener("click", () => $("#admin-modal").classList.add("hidden")));
function syncEditor() { if (!articleEditor) return; $("#edit-content").value = window.DOMPurify.sanitize(articleEditor.root.innerHTML, { USE_PROFILES: { html: true } }); }
function resetEditor() { if (!articleEditor) return; articleEditor.setContents([]); $("#edit-content").value = ""; }
function initializeEditor() { if (articleEditor || !window.Quill) return; articleEditor = new window.Quill("#edit-content-editor", { theme: "snow", modules: { toolbar: { container: "#edit-content-toolbar", handlers: { image() { const url = window.prompt("Вставьте URL изображения"); if (url) { const range = articleEditor.getSelection(true); articleEditor.insertEmbed(range ? range.index : articleEditor.getLength(), "image", url.trim(), "user"); } } } }, history: { delay: 1000, maxStack: 100, userOnly: true } }, placeholder: "Начните писать статью..." }); articleEditor.on("text-change", syncEditor); }
async function uploadArticleImage(file) { if (!file) return; if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) { message("#admin-message", "Разрешены PNG, JPEG, WebP или GIF до 5 МБ."); return; } const path = `${state.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const upload = await db.storage.from("article-images").upload(path, file, { contentType: file.type, upsert: false }); if (upload.error) { message("#admin-message", upload.error.message); return; } const signed = await db.storage.from("article-images").createSignedUrl(path, 60 * 60 * 24 * 365); if (signed.error) { message("#admin-message", signed.error.message); return; } const asset = await db.from("media_assets").insert({ storage_path: path, file_name: file.name, mime_type: file.type, file_size: file.size, alt_text: file.name, created_by: state.user.id }); if (asset.error) { message("#admin-message", asset.error.message); return; } const range = articleEditor.getSelection(true); articleEditor.insertEmbed(range ? range.index : articleEditor.getLength(), "image", signed.data.signedUrl, "user"); syncEditor(); }
function setEditorContent(content) { initializeEditor(); if (articleEditor) articleEditor.clipboard.dangerouslyPasteHTML(window.DOMPurify.sanitize(content || "", { USE_PROFILES: { html: true } })); syncEditor(); }
initializeEditor();
$("#upload-image").addEventListener("click", () => $("#article-image-upload").click());
$("#article-image-upload").addEventListener("change", (event) => uploadArticleImage(event.target.files[0]).finally(() => { event.target.value = ""; }));
$("#insert-article-template").addEventListener("click", () => setEditorContent(`<h2>Определение</h2><p>Дайте технически точное определение и объясните тему простыми словами.</p><h2>Зачем это нужно QA</h2><p>Опишите влияние темы на качество, риски и решения команды.</p><h2>Что нужно знать заранее</h2><ul><li>Укажите необходимые базовые знания.</li><li>Свяжите тему с предыдущими материалами.</li></ul><h2>Как это работает</h2><ol><li>Опишите процесс по шагам.</li><li>Покажите входные данные, действие и результат.</li></ol><h2>Пример 1: базовый</h2><p>Разберите простой пример от условия до ожидаемого результата.</p><h2>Пример 2: рабочий</h2><p>Покажите сценарий из реального QA-проекта.</p><h2>QA-сценарий</h2><p>Опишите задачу, ограничения, тестовые данные и критерии готовности.</p><h2>Типичные ошибки</h2><ul><li>Ошибка и почему она возникает.</li><li>Ошибка и способ её обнаружить.</li><li>Ошибка и безопасное исправление.</li><li>Ошибка в данных или окружении.</li><li>Ошибка в интерпретации результата.</li></ul><h2>Практическая задача</h2><p><strong>Входные данные:</strong> опишите данные.</p><p><strong>Задание:</strong> сформулируйте проверку.</p><p><strong>Ожидаемый результат:</strong> укажите критерий.</p><p><strong>Подсказка:</strong> добавьте направление решения.</p><p><strong>Решение:</strong> приведите полный разбор.</p><h2>Самопроверка</h2><ol><li>Вопрос 1 и объяснение ответа.</li><li>Вопрос 2 и объяснение ответа.</li><li>Вопрос 3 и объяснение ответа.</li></ol><h2>Ключевые тезисы</h2><ul><li>Главный тезис.</li><li>Практическое правило.</li><li>Риск, который нужно помнить.</li></ul><h2>Связанные темы и источники</h2><p>Добавьте ссылки на связанные статьи и проверенные официальные источники.</p>`));
function editorPayload() { syncEditor(); const title = $("#edit-title").value.trim(); const content = $("#edit-content").value.trim(); const course = $("#edit-course").value; return { slug: slugify(title), course, course_key: course === "manual" ? "manual-qa" : "automation-python", module: $("#edit-module").value.trim(), level: $("#edit-level").value, estimated_minutes: Number($("#edit-minutes").value || 10), title, description: $("#edit-description").value.trim(), tags: $("#edit-tags").value.trim(), content, content_json: { introduction: content, steps: [], examples: [], qa_scenario: {}, visuals: [], tables: [], common_mistakes: [], practice: [], self_check: [], key_points: [], related_topics: [], sources: [] }, status: $("#edit-status").value, sort_order: Number($("#edit-order").value || 0), read_time: `${Number($("#edit-minutes").value || 10)} мин` }; }
function validateArticle(payload) { if (payload.status === "draft") return ""; const text = payload.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); const words = text ? text.split(" ").length : 0; const required = ["Определение", "Пример", "Практи", "Самопровер", "Ключевые", "Источ"]; const missing = required.filter((part) => !payload.content.toLowerCase().includes(part.toLowerCase())); return words < 700 ? "Для публикации статья должна содержать минимум 700 слов." : missing.length ? `Добавьте обязательные разделы: ${missing.join(", ")}.` : ""; }
async function writeAudit(action, entityId, details = {}) { const { error } = await db.from("audit_logs").insert({ actor_id: state.user.id, action, entity_type: "article", entity_id: String(entityId), details }); if (error) console.error("Audit log error:", error.message); }
$("#article-form").addEventListener("submit", async (event) => { event.preventDefault(); const id = $("#edit-id").value; const payload = editorPayload(); if (!payload.content) { message("#admin-message", "Добавьте содержание статьи."); return; } const validationError = validateArticle(payload); if (validationError) { message("#admin-message", validationError); return; } const result = id ? await db.from("articles").update(payload).eq("id", id).select().single() : await db.from("articles").insert(payload).select().single(); if (result.error) { message("#admin-message", result.error.message); return; } if (id) { const version = { article_id: id, title: payload.title, description: payload.description, content: payload.content, metadata: { module: payload.module, level: payload.level, tags: payload.tags }, created_by: state.user.id }; const versionResult = await db.from("article_versions").insert(version); if (versionResult.error) console.error("Version save error:", versionResult.error.message); } await writeAudit(id ? "update" : "create", result.data.id); message("#admin-message", "Статья сохранена.", true); event.target.reset(); $("#edit-id").value = ""; $("#duplicate-article").classList.add("hidden"); resetEditor(); await renderAdminList(); await loadArticles(); });
$("#preview-article").addEventListener("click", () => { const payload = editorPayload(); const preview = window.open("", "_blank", "noopener,noreferrer"); if (!preview) { message("#admin-message", "Разрешите всплывающие окна для предпросмотра."); return; } preview.document.title = payload.title || "Предпросмотр статьи"; preview.document.body.innerHTML = `<main style="max-width:800px;margin:40px auto;font:16px/1.7 system-ui;padding:0 20px"><h1>${escapeHtml(payload.title)}</h1><p>${escapeHtml(payload.description)}</p>${payload.content}</main>`; });
let autosaveTimer;
$("#article-form").addEventListener("input", () => { clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => { localStorage.setItem("qa-guide-article-draft", JSON.stringify({ ...editorPayload(), id: $("#edit-id").value })); message("#admin-message", "Черновик сохранён локально.", true); }, 900); });
$("#admin-list").addEventListener("click", async (event) => { const edit = event.target.closest("[data-edit]"); const duplicate = event.target.closest("[data-duplicate]"); const remove = event.target.closest("[data-delete]"); const article = state.adminArticles.find((item) => String(item.id) === (edit?.dataset.edit || duplicate?.dataset.duplicate)); if (article) { $("#edit-id").value = duplicate ? "" : article.id; $("#edit-course").value = article.course; $("#edit-module").value = article.module || "Основы"; $("#edit-level").value = article.level || "beginner"; $("#edit-minutes").value = article.estimated_minutes || 10; $("#edit-title").value = duplicate ? `${article.title} — копия` : article.title; $("#edit-description").value = article.description; $("#edit-tags").value = article.tags || ""; setEditorContent(article.content); $("#edit-status").value = duplicate ? "draft" : article.status; $("#edit-order").value = article.sort_order; $("#duplicate-article").classList.toggle("hidden", !edit); } if (remove && window.confirm("Удалить статью безвозвратно? Связанный прогресс также будет удалён.")) { const { error } = await db.from("articles").delete().eq("id", remove.dataset.delete); if (error) { message("#admin-message", error.message); return; } await writeAudit("delete", remove.dataset.delete); message("#admin-message", "Статья удалена.", true); await renderAdminList(); await loadArticles(); } });
$("#resource-form").addEventListener("submit", async (event) => { event.preventDefault(); const id = $("#resource-id").value; const payload = { resource_type: $("#resource-type").value, category: $("#resource-category").value.trim(), title: $("#resource-title").value.trim(), description: $("#resource-description").value.trim(), url: $("#resource-url").value.trim(), sort_order: Number($("#resource-order").value || 0), status: "published", created_by: state.user.id }; const result = id ? await db.from("resources").update(payload).eq("id", id) : await db.from("resources").insert(payload); if (result.error) { message("#admin-message", result.error.message); return; } message("#admin-message", "Блок ресурса сохранён.", true); event.target.reset(); $("#resource-id").value = ""; await renderResourceAdminList(); await loadResources(); });
$("#resource-reset").addEventListener("click", () => { $("#resource-form").reset(); $("#resource-id").value = ""; });
$("#resource-admin-list").addEventListener("click", async (event) => { const edit = event.target.closest("[data-resource-edit]"); const remove = event.target.closest("[data-resource-delete]"); if (edit) { const { data, error } = await db.from("resources").select("*").eq("id", edit.dataset.resourceEdit).single(); if (error) { message("#admin-message", error.message); return; } $("#resource-id").value = data.id; $("#resource-type").value = data.resource_type; $("#resource-category").value = data.category; $("#resource-title").value = data.title; $("#resource-description").value = data.description; $("#resource-url").value = data.url; $("#resource-order").value = data.sort_order; } if (remove && window.confirm("Удалить этот блок ресурса?")) { const { error } = await db.from("resources").delete().eq("id", remove.dataset.resourceDelete); if (error) { message("#admin-message", error.message); return; } await renderResourceAdminList(); await loadResources(); } });

db.auth.getSession().then(({ data }) => data.session && enterApp(data.session).catch((error) => message("#auth-message", error.message)));
db.auth.onAuthStateChange((_event, session) => { if (session && !state.user) enterApp(session).catch((error) => message("#auth-message", error.message)); if (!session) { state.user = null; $("#auth-screen").classList.remove("hidden"); $("#app").classList.add("hidden"); } });
