const SUPABASE_URL = "https://hberfcawhmudegydhtnb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_W99wvJK_aI_NOhLx9-y8TQ_tx9FQct_";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (selector) => document.querySelector(selector);
const accessScreen = $("#access-screen");
const app = $("#app");
let materials = [];
let currentMember = null;
let currentUser = null;
let profile = null;
let completedArticles = new Set();
let editingArticleId = null;
let activeSection = "theory";
let activeCategory = null;

const normalize = (value = "") => value.trim().toLowerCase();
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character]));
const showMessage = (element, text, success = false) => {
  element.textContent = text;
  element.style.color = success ? "#4f8b55" : "";
};

async function isAllowed(user) {
  const { data, error } = await db.from("access_members").select("id,email,is_admin").eq("email", normalize(user.email)).maybeSingle();
  if (error) throw error;
  currentMember = data;
  return Boolean(data);
}

async function loadProfile() {
  const { data, error } = await db.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
  if (error) throw error;
  profile = data || { id: currentUser.id, email: currentUser.email, display_name: "", avatar_url: null };
  if (!data) {
    const result = await db.from("profiles").upsert(profile).select().single();
    if (result.error) throw result.error;
    profile = result.data;
  }
  renderProfile();
}

async function loadProgress() {
  const { data, error } = await db.from("article_progress").select("article_id").eq("user_id", currentUser.id);
  if (error) throw error;
  completedArticles = new Set((data || []).map((row) => String(row.article_id)));
}

function renderProfile() {
  const name = profile?.display_name || currentUser?.email || "";
  $("#user-email").textContent = name;
  const avatar = profile?.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="" />`
    : "👤";
  $("#profile-avatar").innerHTML = avatar;
  $("#profile-preview-avatar").innerHTML = avatar;
  $("#profile-preview-email").textContent = currentUser?.email || "";
}

async function showApp(user) {
  if (!(await isAllowed(user))) {
    await db.auth.signOut();
    showMessage($("#access-message"), "Ваш email ещё не добавлен в список доступа.");
    return;
  }
  currentUser = user;
  accessScreen.classList.add("hidden");
  app.classList.remove("hidden");
  $("#admin-button").classList.toggle("hidden", !currentMember.is_admin);
  $("#article-add-button").classList.toggle("hidden", !currentMember.is_admin);
  await Promise.all([loadProfile(), loadProgress()]);
  await loadMaterials();
}

async function loadMaterials() {
  const { data, error } = await db.from("articles").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) {
    showMessage($("#access-message"), `Не удалось загрузить материалы: ${error.message}`);
    return;
  }
  materials = data || [];
  setupNavigation();
  renderMaterials();
}

$("#access-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = normalize($("#email").value);
  const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
  showMessage($("#access-message"), error ? `Не удалось отправить письмо: ${error.message}` : "Проверьте почту и перейдите по ссылке из письма.", !error);
});

$("#request-access").addEventListener("click", () => {
  const email = normalize($("#email").value);
  window.location.href = `mailto:?subject=${encodeURIComponent("Запрос доступа к QA Base")}&body=${encodeURIComponent(`Здравствуйте! Прошу выдать доступ к QA Base для email: ${email || "[укажите email]"}.`)}`;
});

$("#logout-button").addEventListener("click", () => db.auth.signOut());

function renderMaterials() {
  const query = normalize($("#search-input").value);
  const filtered = materials.filter((item) => {
    const itemSection = item.section || "theory";
    return itemSection === activeSection
      && (!activeCategory || item.category === activeCategory)
      && `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query);
  });
  $("#materials-grid").innerHTML = filtered.map((item, index) => {
    const draft = item.status === "draft";
    const completed = completedArticles.has(String(item.id));
    return `<article class="material-card ${draft ? "material-card--draft" : ""}" data-id="${item.id}"><div class="card-image card-image--${escapeHtml(item.color || "purple")}">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="" class="card-image-upload">` : ""}<span class="card-number">${String(index + 1).padStart(2, "0")}</span>${draft ? '<span class="draft-badge">Черновик</span>' : ""}<h3>${escapeHtml(item.title)}</h3><span class="illustration">${escapeHtml(item.icon || "◉")}</span></div><div class="card-body"><span class="card-tag">${escapeHtml(item.category)}${completed ? " · ✓ изучено" : ""}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><div class="card-meta"><span>${completed ? "Материал пройден" : "Читать материал"}</span><span>${escapeHtml(item.read_time || "")}</span></div></div></article>`;
  }).join("");
  $("#empty-state").classList.toggle("hidden", filtered.length > 0);
  document.querySelectorAll(".material-card").forEach((card) => card.addEventListener("click", () => openArticle(card.dataset.id)));
}

function setupNavigation() {
  const practiceCategories = [...new Set(materials.filter((item) => item.section === "practice").map((item) => item.category))];
  $("#practice-menu").innerHTML = [
    '<button type="button" data-section="practice" data-category="">Все практические задания</button>',
    ...practiceCategories.map((category) => `<button type="button" data-section="practice" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`),
  ].join("");
  document.querySelectorAll("#practice-menu button").forEach((button) => button.addEventListener("click", () => {
    activeSection = button.dataset.section;
    activeCategory = button.dataset.category || null;
    renderMaterials();
    $("#library").scrollIntoView({ behavior: "smooth" });
  }));
}

$("#theory-link").addEventListener("click", () => {
  activeSection = "theory";
  activeCategory = null;
  renderMaterials();
});

async function openArticle(id) {
  const item = materials.find((material) => String(material.id) === String(id));
  if (!item) return;
  const { data: questions } = await db.from("quiz_questions").select("*").eq("article_id", item.id).order("sort_order");
  const quiz = (questions || []).length && item.section === "theory" ? `<section class="quiz" id="quiz-${item.id}"><p class="eyebrow">Проверь себя</p><h3>Мини-тест после теории</h3>${questions.map((question, index) => `<fieldset class="quiz-question" data-answer="${question.correct_option}"><legend>${index + 1}. ${escapeHtml(question.question)}</legend>${(question.options || []).map((option, optionIndex) => `<label><input type="radio" name="question-${question.id}" value="${optionIndex}" /> ${escapeHtml(option)}</label>`).join("")}<p class="quiz-result"></p></fieldset><p class="quiz-explanation hidden">${escapeHtml(question.explanation || "")}</p>`).join("")}<button class="button button--secondary quiz-check" type="button">Проверить ответы</button><p class="quiz-score"></p></section>` : "";
  const completed = completedArticles.has(String(item.id));
  $("#article-content").innerHTML = `<div class="article-visual card-image--${escapeHtml(item.color || "purple")}">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="" class="article-image">` : `<h2>${escapeHtml(item.title)}</h2>`}</div><p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.read_time || "")}${item.status === "draft" ? " · черновик" : ""}</p><h2 id="article-title">${escapeHtml(item.title)}</h2><div class="article-copy">${item.content}</div>${quiz}<button id="complete-article-button" class="button ${completed ? "button--secondary" : "button--primary"} article-complete-button" type="button">${completed ? "✓ Материал пройден" : "Отметить как пройденное"}</button>${currentMember?.is_admin ? '<button id="edit-article-button" class="button button--secondary article-edit-button" type="button">Редактировать материал</button>' : ""}`;
  $("#article-modal").classList.remove("hidden");
  $("#complete-article-button").addEventListener("click", () => markCompleted(item));
  $("#edit-article-button")?.addEventListener("click", () => openArticleEditor(item));
  $(".quiz-check")?.addEventListener("click", () => checkQuiz(item));
}

async function markCompleted(item) {
  const { error } = await db.from("article_progress").upsert({ user_id: currentUser.id, article_id: item.id, completed_at: new Date().toISOString() });
  if (error) {
    window.alert(`Не удалось сохранить прогресс: ${error.message}`);
    return;
  }
  completedArticles.add(String(item.id));
  $("#complete-article-button").textContent = "✓ Материал пройден";
  $("#complete-article-button").className = "button button--secondary article-complete-button";
  renderMaterials();
}

function checkQuiz() {
  let score = 0;
  let answered = 0;
  document.querySelectorAll(".quiz-question").forEach((question) => {
    const choice = question.querySelector("input:checked");
    const result = question.querySelector(".quiz-result");
    question.querySelectorAll("label").forEach((label) => label.classList.remove("is-correct", "is-wrong"));
    if (!choice) {
      result.textContent = "Выберите вариант.";
      return;
    }
    answered += 1;
    const isCorrect = Number(choice.value) === Number(question.dataset.answer);
    if (isCorrect) score += 1;
    choice.closest("label").classList.add(isCorrect ? "is-correct" : "is-wrong");
    result.textContent = isCorrect ? "Верно!" : "Попробуйте ещё раз.";
    question.nextElementSibling?.classList.remove("hidden");
  });
  const total = document.querySelectorAll(".quiz-question").length;
  if (answered === total) {
    const scoreElement = $(".quiz-score");
    scoreElement.textContent = `Результат: ${score}/${total}`;
    scoreElement.style.color = score === total ? "#4f8b55" : "";
  }
}

function closeModals() {
  $("#article-modal").classList.add("hidden");
  $("#admin-modal").classList.add("hidden");
  $("#profile-modal").classList.add("hidden");
}
document.querySelectorAll("[data-close-modal], [data-close-admin], [data-close-profile]").forEach((element) => element.addEventListener("click", closeModals));
$("#search-input").addEventListener("input", renderMaterials);

$("#profile-button").addEventListener("click", () => {
  $("#profile-name-input").value = profile?.display_name || "";
  $("#profile-modal").classList.remove("hidden");
});

$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  let avatarUrl = profile?.avatar_url || null;
  const file = $("#profile-avatar-file").files[0];
  if (file) {
    const extension = file.name.split(".").pop().toLowerCase() || "jpg";
    const path = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
    const upload = await db.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upload.error) {
      showMessage($("#profile-message"), `Не удалось загрузить аватар: ${upload.error.message}`);
      return;
    }
    avatarUrl = db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }
  const { data, error } = await db.from("profiles").upsert({ id: currentUser.id, email: currentUser.email, display_name: $("#profile-name-input").value.trim(), avatar_url: avatarUrl, updated_at: new Date().toISOString() }).select().single();
  if (error) {
    showMessage($("#profile-message"), error.message);
    return;
  }
  profile = data;
  renderProfile();
  showMessage($("#profile-message"), "Профиль сохранён.", true);
});

$("#admin-button").addEventListener("click", async () => {
  if (!currentMember?.is_admin) return;
  await openAdminModal("members");
});
$("#article-add-button").addEventListener("click", () => {
  if (!currentMember?.is_admin) return;
  resetArticleForm();
  openAdminModal("article");
  $("#article-title-input").focus();
});

async function openAdminModal(mode) {
  $("#article-admin-section").classList.toggle("hidden", mode !== "article");
  $("#members-admin-section").classList.toggle("hidden", mode !== "members");
  if (mode === "members") await renderAllowedList();
  if (mode === "article") renderAdminArticles();
  $("#admin-modal").classList.remove("hidden");
}

function resetArticleForm() {
  editingArticleId = null;
  $("#article-form").reset();
  $("#article-form-heading").textContent = "Новый материал";
  $("#article-submit").textContent = "Опубликовать материал";
  $("#article-cancel-edit").classList.add("hidden");
  showMessage($("#article-message"), "");
}

function openArticleEditor(item) {
  if (!currentMember?.is_admin) return;
  editingArticleId = item.id;
  $("#article-title-input").value = item.title;
  $("#article-category-input").value = item.category;
  $("#article-section-input").value = item.section || "theory";
  $("#article-time-input").value = item.read_time || "";
  $("#article-order-input").value = item.sort_order || 0;
  $("#article-description-input").value = item.description;
  $("#article-content-input").value = item.content;
  $("#article-color-input").value = item.color || "purple";
  $("#article-image-input").value = item.image_url || "";
  $("#article-draft-input").checked = item.status === "draft";
  $("#article-form-heading").textContent = "Редактирование материала";
  $("#article-submit").textContent = "Сохранить изменения";
  $("#article-cancel-edit").classList.remove("hidden");
  $("#article-modal").classList.add("hidden");
  openAdminModal("article");
  $("#article-title-input").focus();
}
$("#article-cancel-edit").addEventListener("click", resetArticleForm);

function renderAdminArticles() {
  $("#admin-articles-list").innerHTML = `<h3>Материалы и порядок</h3>${materials.map((item, index) => `<div class="admin-article-row"><span><strong>${escapeHtml(item.title)}</strong><small>${item.status === "draft" ? "Черновик" : "Опубликован"} · порядок ${item.sort_order || 0}</small></span><span><button type="button" class="tiny-button edit-admin-article" data-id="${item.id}">Изменить</button><button type="button" class="tiny-button move-admin-article" data-id="${item.id}" data-direction="-1" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" class="tiny-button move-admin-article" data-id="${item.id}" data-direction="1" ${index === materials.length - 1 ? "disabled" : ""}>↓</button><button type="button" class="tiny-button delete-admin-article" data-id="${item.id}">Удалить</button></span></div>`).join("")}`;
  document.querySelectorAll(".edit-admin-article").forEach((button) => button.addEventListener("click", () => openArticleEditor(materials.find((item) => String(item.id) === button.dataset.id))));
  document.querySelectorAll(".delete-admin-article").forEach((button) => button.addEventListener("click", () => deleteArticle(button.dataset.id)));
  document.querySelectorAll(".move-admin-article").forEach((button) => button.addEventListener("click", () => moveArticle(button.dataset.id, Number(button.dataset.direction))));
}

async function deleteArticle(id) {
  if (!window.confirm("Удалить материал и его прогресс?")) return;
  const { error } = await db.from("articles").delete().eq("id", id);
  if (error) window.alert(error.message);
  else {
    await loadMaterials();
    renderAdminArticles();
  }
}

async function moveArticle(id, direction) {
  const index = materials.findIndex((item) => String(item.id) === String(id));
  const other = materials[index + direction];
  if (!other) return;
  const firstOrder = materials[index].sort_order || index;
  const secondOrder = other.sort_order || index + direction;
  const { error } = await db.from("articles").upsert([{ id: materials[index].id, sort_order: secondOrder }, { id: other.id, sort_order: firstOrder }]);
  if (error) window.alert(error.message);
  else {
    await loadMaterials();
    renderAdminArticles();
  }
}

async function renderAllowedList() {
  const { data, error } = await db.from("access_members").select("id,email,is_admin").order("email");
  if (error) {
    showMessage($("#invite-message"), error.message);
    return;
  }
  $("#allowed-list").innerHTML = (data || []).map((member) => {
    const ownAccount = normalize(member.email) === normalize(currentUser.email);
    const roleButton = ownAccount ? "" : `<button class="toggle-admin" data-id="${member.id}" data-value="${member.is_admin ? "false" : "true"}" type="button">${member.is_admin ? "Снять права" : "Сделать админом"}</button>`;
    return `<li><span>${escapeHtml(member.email)}${member.is_admin ? " · админ" : ""}</span>${ownAccount ? "" : `<span>${roleButton}<button class="remove-email" data-id="${member.id}" type="button">Удалить</button></span>`}</li>`;
  }).join("");
  document.querySelectorAll(".remove-email").forEach((button) => button.addEventListener("click", async () => {
    const { error: deleteError } = await db.from("access_members").delete().eq("id", button.dataset.id);
    if (deleteError) showMessage($("#invite-message"), deleteError.message);
    else renderAllowedList();
  }));
  document.querySelectorAll(".toggle-admin").forEach((button) => button.addEventListener("click", async () => {
    const { error: updateError } = await db.from("access_members").update({ is_admin: button.dataset.value === "true" }).eq("id", button.dataset.id);
    if (updateError) showMessage($("#invite-message"), updateError.message);
    else renderAllowedList();
  }));
}

$("#invite-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = normalize($("#invite-email").value);
  const { error } = await db.from("access_members").insert({ email, is_admin: false });
  if (error) {
    showMessage($("#invite-message"), error.code === "23505" ? "Этот email уже добавлен." : error.message);
    return;
  }
  $("#invite-email").value = "";
  showMessage($("#invite-message"), "Участник добавлен.", true);
  await renderAllowedList();
});

$("#article-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentMember?.is_admin) return;
  let imageUrl = $("#article-image-input").value.trim() || null;
  const file = $("#article-image-file").files[0];
  if (file) {
    const extension = file.name.split(".").pop().toLowerCase() || "jpg";
    const path = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
    const upload = await db.storage.from("article-images").upload(path, file, { contentType: file.type });
    if (upload.error) {
      showMessage($("#article-message"), `Не удалось загрузить изображение: ${upload.error.message}`);
      return;
    }
    imageUrl = db.storage.from("article-images").getPublicUrl(path).data.publicUrl;
  }
  const article = {
    category: $("#article-category-input").value.trim(),
    section: $("#article-section-input").value,
    title: $("#article-title-input").value.trim(),
    description: $("#article-description-input").value.trim(),
    content: $("#article-content-input").value.trim(),
    read_time: $("#article-time-input").value.trim(),
    sort_order: Number($("#article-order-input").value) || 0,
    status: $("#article-draft-input").checked ? "draft" : "published",
    color: $("#article-color-input").value,
    icon: "✦",
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  };
  const query = editingArticleId ? db.from("articles").update(article).eq("id", editingArticleId) : db.from("articles").insert(article);
  const { error } = await query;
  if (error) {
    showMessage($("#article-message"), `Не удалось сохранить: ${error.message}`);
    return;
  }
  const wasEditing = Boolean(editingArticleId);
  resetArticleForm();
  showMessage($("#article-message"), wasEditing ? "Изменения сохранены." : "Материал опубликован.", true);
  await loadMaterials();
  renderAdminArticles();
});

db.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    currentUser = null;
    currentMember = null;
    profile = null;
    app.classList.add("hidden");
    accessScreen.classList.remove("hidden");
    $("#admin-button").classList.add("hidden");
    $("#article-add-button").classList.add("hidden");
    $("#email").value = "";
    return;
  }
  if (session?.user) setTimeout(async () => {
    try {
      await showApp(session.user);
    } catch (error) {
      showMessage($("#access-message"), `Ошибка подключения: ${error.message}`);
    }
  }, 0);
});
