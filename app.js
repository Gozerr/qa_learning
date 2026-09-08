const SUPABASE_URL = "https://hberfcawhmudegydhtnb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_W99wvJK_aI_NOhLx9-y8TQ_tx9FQct_";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (selector) => document.querySelector(selector);
const accessScreen = $("#access-screen");
const app = $("#app");
let materials = [];
let currentMember = null;
let editingArticleId = null;
let activeSection = "theory";
let activeCategory = null;

const normalize = (value) => value.trim().toLowerCase();
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

async function showApp(user) {
  if (!(await isAllowed(user))) {
    await db.auth.signOut();
    showMessage($("#access-message"), "Ваш email ещё не добавлен в список доступа.");
    return;
  }
  accessScreen.classList.add("hidden");
  app.classList.remove("hidden");
  $("#admin-button").classList.toggle("hidden", !currentMember.is_admin);
  $("#article-add-button").classList.toggle("hidden", !currentMember.is_admin);
  $("#user-email").textContent = user.email;
  await loadMaterials();
}

async function loadMaterials() {
  const { data, error } = await db.from("articles").select("*").order("created_at", { ascending: true });
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
  if (error) {
    showMessage($("#access-message"), `Не удалось отправить письмо: ${error.message}`);
    return;
  }
  showMessage($("#access-message"), "Проверьте почту и перейдите по ссылке из письма.", true);
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
  $("#materials-grid").innerHTML = filtered.map((item, index) => `<article class="material-card" data-id="${item.id}"><div class="card-image card-image--${item.color || "purple"}">${item.image_url ? `<img src="${item.image_url}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ""}<span class="card-number">${String(index + 1).padStart(2, "0")}</span><h3>${item.title}</h3><span class="illustration">${item.icon || "◉"}</span></div><div class="card-body"><span class="card-tag">${item.category}</span><h3>${item.title}</h3><p>${item.description}</p><div class="card-meta"><span>Читать материал</span><span>${item.read_time || ""}</span></div></div></article>`).join("");
  $("#empty-state").classList.toggle("hidden", filtered.length > 0);
  document.querySelectorAll(".material-card").forEach((card) => card.addEventListener("click", () => openArticle(card.dataset.id)));
}

function setupNavigation() {
  const practiceCategories = [...new Set(materials.filter((item) => item.section === "practice").map((item) => item.category))];
  $("#practice-menu").innerHTML = [
    `<button type="button" data-section="practice" data-category="">Все практические задания</button>`,
    ...practiceCategories.map((category) => `<button type="button" data-section="practice" data-category="${category}">${category}</button>`),
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

function openArticle(id) {
  const item = materials.find((material) => String(material.id) === String(id));
  if (!item) return;
  $("#article-content").innerHTML = `<div class="article-visual card-image--${item.color || "purple"}">${item.image_url ? `<img src="${item.image_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:13px">` : `<h2>${item.title}</h2>`}</div><p class="eyebrow">${item.category} · ${item.read_time || ""}</p><h2 id="article-title">${item.title}</h2><div class="article-copy">${item.content}</div>${currentMember?.is_admin ? '<button id="edit-article-button" class="button button--primary article-edit-button" type="button">Редактировать материал</button>' : ""}`;
  $("#article-modal").classList.remove("hidden");
  $("#edit-article-button")?.addEventListener("click", () => openArticleEditor(item));
}

function closeModals() {
  $("#article-modal").classList.add("hidden");
  $("#admin-modal").classList.add("hidden");
}

document.querySelectorAll("[data-close-modal], [data-close-admin]").forEach((element) => element.addEventListener("click", closeModals));
$("#search-input").addEventListener("input", renderMaterials);

$("#admin-button").addEventListener("click", async () => {
  if (!currentMember?.is_admin) {
    window.alert("Панель доступна только владельцу базы.");
    return;
  }
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
  $("#article-description-input").value = item.description;
  $("#article-content-input").value = item.content;
  $("#article-color-input").value = item.color || "purple";
  $("#article-image-input").value = item.image_url || "";
  $("#article-form-heading").textContent = "Редактирование материала";
  $("#article-submit").textContent = "Сохранить изменения";
  $("#article-cancel-edit").classList.remove("hidden");
  $("#article-modal").classList.add("hidden");
  openAdminModal("article");
  $("#article-title-input").focus();
}

$("#article-cancel-edit").addEventListener("click", resetArticleForm);

async function renderAllowedList() {
  const { data, error } = await db.from("access_members").select("id,email,is_admin").order("email");
  if (error) {
    showMessage($("#invite-message"), error.message);
    return;
  }
  $("#allowed-list").innerHTML = data.map((member) => `<li><span>${member.email}</span>${member.is_admin ? "<span>владелец</span>" : `<button class="remove-email" data-id="${member.id}" type="button">Удалить</button>`}</li>`).join("");
  document.querySelectorAll(".remove-email").forEach((button) => button.addEventListener("click", async () => {
    const { error: deleteError } = await db.from("access_members").delete().eq("id", button.dataset.id);
    if (deleteError) showMessage($("#invite-message"), deleteError.message);
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
  if (!currentMember?.is_admin) {
    showMessage($("#article-message"), "Только владелец может публиковать материалы.");
    return;
  }
  const article = {
    category: $("#article-category-input").value.trim(),
    section: $("#article-section-input").value,
    title: $("#article-title-input").value.trim(),
    description: $("#article-description-input").value.trim(),
    content: $("#article-content-input").value.trim(),
    read_time: $("#article-time-input").value.trim(),
    color: $("#article-color-input").value,
    icon: "✦",
    image_url: $("#article-image-input").value.trim() || null,
  };
  const query = editingArticleId
    ? db.from("articles").update(article).eq("id", editingArticleId)
    : db.from("articles").insert(article);
  const { error } = await query;
  if (error) {
    showMessage($("#article-message"), `Не удалось опубликовать: ${error.message}`);
    return;
  }
  const wasEditing = Boolean(editingArticleId);
  resetArticleForm();
  showMessage($("#article-message"), wasEditing ? "Изменения сохранены." : "Материал опубликован.", true);
  await loadMaterials();
});

db.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
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
