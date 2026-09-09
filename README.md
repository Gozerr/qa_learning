# QA Guide

Закрытая база знаний по Manual QA и Automation QA на Python. Это не платная школа,
не сервис трудоустройства и не обещание гарантированной работы.

## Архитектура private-by-default

- GitHub Pages отдаёт только клиентскую оболочку, экран входа и форму запроса доступа.
- Supabase Auth отвечает за вход по паролю или magic link.
- Supabase Postgres хранит пользователей, заявки, курсы, статьи и прогресс.
- RLS запрещает чтение статей без одобренной записи в `access_members`.
- Черновики, редактирование, удаление и CMS доступны только администратору.
- Изображения в Storage создаются приватными; публичные URL для закрытых материалов не используются.
- HTML статьи очищается DOMPurify перед отображением в браузере.

## Первичная настройка

1. Выполните `supabase-setup.sql` в SQL Editor проекта Supabase.
2. Проверьте email владельца в `insert into public.access_members`.
3. В Authentication → URL Configuration добавьте `https://gozerr.github.io/qa_learning/`.
4. Включите GitHub Pages через GitHub Actions.
5. После входа администратор открывает CMS и управляет статьями.

SQL seed создаёт стартовый набор Manual QA и Automation QA — Python материалов.
Новые полноценные уроки добавляются через CMS или дополнительными SQL-миграциями.

## Локальный запуск

```powershell
python -m http.server 8000
```

Откройте `http://localhost:8000/`. Для работы с Supabase локальный origin должен
быть добавлен в Redirect URLs.

## Основные файлы

- `index.html` — публичный auth-экран и защищённый интерфейс базы.
- `app.js` — Auth, проверка доступа, загрузка статей, поиск, прогресс и CMS.
- `styles.css` — адаптивная knowledge-base UI.
- `supabase-setup.sql` — схема, RLS-политики и начальный контент.

## Ограничения

Клиентский Supabase anon key не является секретом. Service role key, пароли и
административные токены нельзя добавлять в репозиторий. Полноценное rate limiting
для входа и заявок должно быть включено в настройках Supabase Auth/Edge Functions
перед большим публичным запуском.
