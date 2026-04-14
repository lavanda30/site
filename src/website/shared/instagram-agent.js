/**
 * instagram-agent.js — Генератор Instagram постів для LAVANDA
 * Використовує OpenRouter FREE tier
 */

(function () {
    'use strict';

    // ── КОНФІГ ────────────────────────────────────────────────────────
    const OPENROUTER_KEY = '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';
    const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

    // Актуальні безкоштовні моделі OpenRouter (квітень 2026)
    // openrouter/free — офіційний роутер, сам обирає доступну модель
    const FREE_MODELS = [
        'openrouter/auto',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-chat-v3-0324:free',
        'deepseek/deepseek-chat-v3.1:free',
        'qwen/qwen3-235b-a22b:free',
        'meta-llama/llama-4-scout:free',
        'mistralai/mistral-small-3.1-24b-instruct:free',
    ];

    const HASHTAGS = [
        '#шториКиїв', '#тюльКиїв', '#лаванда', '#LAVANDA',
        '#студіяштор', '#ЖКЧайка', '#дизайндому', '#текстильдому', '#рулонніштори', '#карнізи'
    ].join(' ');

    // ── STATE ─────────────────────────────────────────────────────────
    let selectedTopics = [];
    let lastTopics     = [];
    let initialized    = false;

    // ── ІНІЦІАЛІЗАЦІЯ ─────────────────────────────────────────────────
    function init() {
        if (initialized) return;
        initialized = true;

        const panel = document.getElementById('igPanel');
        if (!panel) return;

        panel.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.id;
            if (id === 'igFindBtn')  findTrends();
            if (id === 'igGenBtn')   generatePost();
            if (id === 'igCopyBtn')  copyPost();
            // handle both igResetBtn instances
            if (btn.id === 'igResetBtn') reset();
        });
    }

    // ── КРОК 1: АНАЛІЗ ТРЕНДІВ ───────────────────────────────────────
    async function findTrends() {
        if (!checkKey()) return;

        setStep('loading');
        setLoadingText('🔍 Аналізую актуальні теми для Київської області…');

        const now    = new Date();
        const month  = now.toLocaleString('uk-UA', { month: 'long' });
        const season = currentSeason();
        const year   = now.getFullYear();

        const systemPrompt = `Ти маркетолог студії штор LAVANDA (Київ та область).
Відповідай ВИКЛЮЧНО валідним JSON масивом. Ніякого тексту до або після. Ніяких markdown-блоків. Лише чистий JSON.`;

        const userPrompt = `Зараз ${month} ${year}, ${season}.
Запропонуй 10 актуальних тем для Instagram-постів про штори, тюль, ролети, карнізи для мешканців України та Київської області.
Враховуй сезон, свята, тренди інтер'єру, потреби власників квартир у новобудовах.

Відповідь — рівно 10 об'єктів JSON:
[{"title":"Назва теми","reason":"Чому актуально зараз (1 речення)","emoji":"1 емодзі"}]`;

        try {
            const text = await callAI(systemPrompt, userPrompt);
            const topics = parseJSON(text);

            if (!Array.isArray(topics) || topics.length === 0) {
                throw new Error('Не вдалось розпарсити теми. Відповідь: ' + text.substring(0, 200));
            }

            lastTopics     = topics.slice(0, 10);
            selectedTopics = [];
            renderTopics(lastTopics);
            setStep('topics');

        } catch (err) {
            showError('Помилка аналізу: ' + err.message);
            setStep('idle');
        }
    }

    // ── КРОК 2: РЕНДЕР ТЕМ ───────────────────────────────────────────
    function renderTopics(topics) {
        const container = document.getElementById('igTopicsList');
        if (!container) return;

        container.innerHTML = topics.map((t, i) => `
            <label class="ig-topic-card" data-index="${i}">
                <input type="checkbox" class="ig-topic-cb" value="${i}">
                <span class="ig-topic-emoji">${esc(t.emoji || '📌')}</span>
                <span class="ig-topic-info">
                    <strong>${esc(t.title || '')}</strong>
                    <span>${esc(t.reason || '')}</span>
                </span>
            </label>
        `).join('');

        container.querySelectorAll('.ig-topic-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx  = parseInt(cb.value);
                const card = cb.closest('.ig-topic-card');
                if (cb.checked) {
                    if (selectedTopics.length >= 3) {
                        cb.checked = false;
                        igToast('Максимум 3 теми', 'warn');
                        return;
                    }
                    selectedTopics.push(idx);
                    card.classList.add('selected');
                } else {
                    selectedTopics = selectedTopics.filter(i => i !== idx);
                    card.classList.remove('selected');
                }
                const genBtn  = document.getElementById('igGenBtn');
                const countEl = document.getElementById('igSelectedCount');
                if (genBtn)  genBtn.disabled  = selectedTopics.length === 0;
                if (countEl) countEl.textContent = selectedTopics.length
                    ? `Обрано: ${selectedTopics.length}` : '';
            });
        });

        const genBtn  = document.getElementById('igGenBtn');
        const countEl = document.getElementById('igSelectedCount');
        if (genBtn)  genBtn.disabled = true;
        if (countEl) countEl.textContent = '';
    }

    // ── КРОК 3: ГЕНЕРАЦІЯ ПОСТУ ───────────────────────────────────────
    async function generatePost() {
        if (!checkKey()) return;
        if (selectedTopics.length === 0) { igToast('Оберіть хоча б одну тему', 'warn'); return; }

        const topics    = selectedTopics.map(i => lastTopics[i]);
        const topicText = topics.map(t => `${t.emoji} ${t.title}`).join(', ');

        setStep('generating');
        setLoadingText('✍️ Генерую продаючий пост… (~15–30 секунд)');

        const systemPrompt = `Ти копірайтер студії штор LAVANDA (Київ та область).
Instagram: @shtory_chayka. Телефон: (050) 946-67-45.
Пишеш по-українськи. Відповідаєш лише текстом посту та рекомендацією для фото.`;

        const userPrompt = `Напиши Instagram пост на тему: ${topicText}

Вимоги:
- Мова: українська, жива, тепла, людська — як порада від подруги
- НЕ використовуй: "ексклюзивний", "унікальний", "преміум", "ідеально"
- Структура: 1 чіпляючий рядок → 3-4 речення → заклик до дії з контактом
- Довжина: 50–8 слів
- Без хештегів у тексті посту

Після тексту посту додай блок:
📸 ЩО СФОТОГРАФУВАТИ:
1. ...
2. ...
3. ...`;

        try {
            const text = await callAI(systemPrompt, userPrompt);

            if (!text || text.length < 50) {
                throw new Error('Порожня відповідь');
            }

            renderPost(text, topicText);
            setStep('result');

        } catch (err) {
            showError('Помилка генерації: ' + err.message);
            setStep('topics');
        }
    }

    // ── РЕНДЕР РЕЗУЛЬТАТУ ─────────────────────────────────────────────
    function renderPost(rawText, topicText) {
        const parts     = rawText.split(/📸\s*ЩО СФОТОГРАФУВАТИ:/i);
        const postText  = (parts[0] || rawText).trim();
        const photoText = parts[1] ? parts[1].trim() : '';

        const postEl  = document.getElementById('igPostText');
        const photoEl = document.getElementById('igPhotoTips');
        const tagsEl  = document.getElementById('igHashtags');
        const topicEl = document.getElementById('igResultTopic');

        if (postEl)  postEl.textContent  = postText;
        if (tagsEl)  tagsEl.textContent  = HASHTAGS;
        if (topicEl) topicEl.textContent = topicText;

        if (photoEl) {
            if (photoText) {
                photoEl.innerHTML = '<div class="ig-photo-title">📸 ЩО СФОТОГРАФУВАТИ:</div>' +
                    photoText.split('\n')
                        .filter(l => l.trim())
                        .map(l => `<div class="ig-photo-line">${esc(l)}</div>`)
                        .join('');
                photoEl.style.display = 'block';
            } else {
                photoEl.style.display = 'none';
            }
        }

        const copyBtn = document.getElementById('igCopyBtn');
        if (copyBtn) copyBtn.dataset.full = postText + '\n\n' + HASHTAGS;
    }

    // ── КОПІЮВАТИ ─────────────────────────────────────────────────────
    async function copyPost() {
        const btn  = document.getElementById('igCopyBtn');
        const text = btn?.dataset.full || '';
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const orig = btn.textContent;
            btn.textContent = '✓ Скопійовано!';
            setTimeout(() => { btn.textContent = orig; }, 2200);
        } catch {
            igToast('Не вдалось скопіювати — виділіть текст вручну', 'warn');
        }
    }

    // ── СКИНУТИ ───────────────────────────────────────────────────────
    function reset() {
        selectedTopics = [];
        lastTopics     = [];
        setStep('idle');
    }

    // ── UI STEPS ──────────────────────────────────────────────────────
    function setStep(step) {
        const allIds = ['igIdleState','igLoadingState','igTopicsState','igResultState'];
        const map = {
            idle:       'igIdleState',
            loading:    'igLoadingState',
            generating: 'igLoadingState',
            topics:     'igTopicsState',
            result:     'igResultState',
        };
        allIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const show = document.getElementById(map[step]);
        if (show) show.style.display = (step === 'topics' || step === 'result') ? 'block' : '';

        const findBtn = document.getElementById('igFindBtn');
        if (findBtn) findBtn.disabled = (step === 'loading' || step === 'generating');
    }

    function setLoadingText(text) {
        const el = document.getElementById('igLoadingText');
        if (el) el.textContent = text;
    }

    // ── OPENROUTER API ────────────────────────────────────────────────
    // Перебирає всі моделі по черзі — пропускає будь-яку помилку 4xx/5xx
    async function callAI(systemPrompt, userPrompt) {
        const key = OPENROUTER_KEY.trim();
        const errors = [];

        for (const model of FREE_MODELS) {
            try {
                const res = await fetch(OPENROUTER_URL, {
                    method:  'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': 'Bearer ' + key,
                        'HTTP-Referer':  'https://lavanda-curtains.netlify.app',
                        'X-Title':       'LAVANDA CRM',
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user',   content: userPrompt   },
                        ],
                        max_tokens:  900,
                        temperature: 0.85,
                    })
                });

                // ─ будь-яка 4xx/5xx — просто пробуємо наступну модель ─
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    const msg = (errBody?.error?.message || res.statusText || 'HTTP ' + res.status)
                        .substring(0, 120);

                    // 401 — невірний ключ, далі немає сенсу
                    if (res.status === 401) {
                        throw new Error('Невірний OpenRouter ключ. Перевірте OPENROUTER_KEY');
                    }

                    errors.push(`[${model}] ${res.status}: ${msg}`);
                    continue; // пробуємо наступну
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content || '';
                if (text.trim()) return text.trim();

                errors.push(`[${model}] порожня відповідь`);

            } catch (err) {
                // перекидаємо лише критичні помилки (невірний ключ)
                if (err.message.includes('Невірний OpenRouter ключ')) throw err;
                errors.push(`[${model}] ${err.message}`);
            }
        }

        // всі моделі не відповіли
        throw new Error('Всі моделі недоступні:\n' + errors.slice(0, 3).join('\n'));
    }

    // ── УТИЛІТИ ───────────────────────────────────────────────────────
    function parseJSON(text) {
        const clean = text
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        try {
            return JSON.parse(clean);
        } catch {
            const match = clean.match(/\[[\s\S]*\]/);
            if (match) {
                try { return JSON.parse(match[0]); } catch {}
            }
            throw new Error('JSON не розпарсено. Отримано: ' + clean.substring(0, 100));
        }
    }

    function checkKey() {
        if (!OPENROUTER_KEY || OPENROUTER_KEY === 'YOUR_OPENROUTER_KEY') {
            showError('Вставте OpenRouter ключ у файл instagram-agent.js');
            return false;
        }
        return true;
    }

    function currentSeason() {
        const m = new Date().getMonth();
        if (m >= 2 && m <= 4) return 'весна';
        if (m >= 5 && m <= 7) return 'літо';
        if (m >= 8 && m <= 10) return 'осінь';
        return 'зима';
    }

    function showError(msg) {
        igToast('❌ ' + msg, 'error');
        console.error('[Instagram Agent]', msg);
    }

    function esc(s) {
        return String(s || '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function igToast(msg, type) {
        const c = document.getElementById('crmToasts');
        if (!c) { console.warn(msg); return; }
        const t = document.createElement('div');
        t.className = 'crm-toast' + (type === 'error' ? ' error' : '');
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => {
            t.style.transition = 'opacity 0.3s';
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 300);
        }, 6000);
    }

    // ── ПУБЛІЧНИЙ ІНТЕРФЕЙС ───────────────────────────────────────────
    window.InstagramAgent = { init };

}());
