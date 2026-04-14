/**
 * agent-mode.js — Embedded CRM Agent Mode for LAVANDA main site
 * Activates dynamically after Salesforce OAuth — no separate portal needed.
 * Requires: sf-api.js, calculator.js, curtain-image.js
 */
(function () {
    'use strict';

    // ── STATE ────────────────────────────────────────────────────
    const S = {
        contacts: [],
        selectedContact: null,
        curtains: [],
        editingContactId: null,
        editingCurtainId: null
    };

    // ── BOOT ─────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.SalesforceAPI) return;

        if (SalesforceAPI.handleCallback()) {
            crmToast('Вхід виконано успішно!', 'success');
        }

        renderAuthState();

        if (SalesforceAPI.isAuthenticated()) {
            activateCRM();
        }

        bindNavEvents();
        bindContactDrawerEvents();
        bindCurtainDrawerEvents();
    });

    // ── NAV AUTH RENDER ──────────────────────────────────────────
    function renderAuthState() {
        const loggedIn    = SalesforceAPI.isAuthenticated();
        const loginBtn    = document.getElementById('agentLoginBtn');
        const loggedInEl  = document.getElementById('agentLoggedIn');
        const crmNavLi    = document.getElementById('agentNavCrm');
        const crmSection  = document.getElementById('crm');

        if (loginBtn)   loginBtn.style.display   = loggedIn ? 'none' : 'flex';
        if (loggedInEl) loggedInEl.classList.toggle('visible', loggedIn);
        if (crmNavLi)   crmNavLi.classList.toggle('visible', loggedIn);
        if (crmSection) crmSection.classList.toggle('crm-visible', loggedIn);
    }

    function bindNavEvents() {
        document.getElementById('agentLoginBtn') ?.addEventListener('click', () => SalesforceAPI.login());
        document.getElementById('agentLogoutBtn')?.addEventListener('click', () => {
            SalesforceAPI.logout();
            renderAuthState();
            S.selectedContact = null;
            S.contacts = [];
            S.curtains = [];
            crmToast('Вийшли з CRM', 'success');
        });
    }

    // ── ACTIVATE CRM ─────────────────────────────────────────────
    async function activateCRM() {
        renderAuthState();
        const user = await SalesforceAPI.getUserInfo().catch(() => null);
        if (user) {
            const name = user.display_name || user.name || user.email || 'Агент';
            const n1 = document.getElementById('agentUserName');
            const n2 = document.getElementById('crmUserBadge');
            if (n1) n1.textContent = name;
            if (n2) n2.textContent = name;
        }
        loadContacts();
    }

    // ── CONTACTS ─────────────────────────────────────────────────
    async function loadContacts(search) {
        const list = document.getElementById('crmContactsList');
        if (!list) return;
        list.innerHTML = '<div class="crm-empty"><span class="crm-spinner" style="color:#9A8BB3"></span></div>';
        try {
            const contacts = await SalesforceAPI.getContacts(search || '');
            S.contacts = contacts;
            renderContactsList(contacts);
            const countEl = document.getElementById('crmContactsCount');
            if (countEl) countEl.textContent = contacts.length || '';
        } catch (err) {
            handleApiError(err);
            list.innerHTML = '<div class="crm-empty"><p>Помилка завантаження</p></div>';
        }
    }

    function renderContactsList(contacts) {
        const list = document.getElementById('crmContactsList');
        if (!contacts.length) {
            list.innerHTML = '<div class="crm-empty"><p>Контакти не знайдені</p></div>';
            return;
        }
        list.innerHTML = contacts.map(c => {
            const initials = (c.Name || '?').split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
            const active   = S.selectedContact && S.selectedContact.Id === c.Id ? 'active' : '';
            return `<div class="crm-contact-item ${active}" data-id="${c.Id}">
                <div class="crm-contact-avatar">${initials}</div>
                <div class="crm-contact-info">
                    <div class="crm-contact-name">${esc(c.Name || '—')}</div>
                    <div class="crm-contact-phone">${esc(c.ClientName__c || '')}</div>
                </div>
            </div>`;
        }).join('');
        list.querySelectorAll('.crm-contact-item').forEach(el => {
            el.addEventListener('click', () => selectContact(el.dataset.id));
        });
    }

    async function selectContact(id) {
        const contact = S.contacts.find(c => c.Id === id)
            || await SalesforceAPI.getContact(id).catch(() => null);
        if (!contact) return;
        S.selectedContact = contact;

        document.querySelectorAll('.crm-contact-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });

        const nameEl = document.getElementById('crmSelectedName');
        const metaEl = document.getElementById('crmSelectedMeta');
        const hdEl   = document.getElementById('crmCurtainsHd');
        if (nameEl) nameEl.textContent = contact.Name || '—';
        if (metaEl) metaEl.textContent = [
            contact.ClientName__c,
            contact.Address__c,
            contact.GeneralDiscount__c ? contact.GeneralDiscount__c + '% знижка' : ''
        ].filter(Boolean).join(' · ');
        if (hdEl) hdEl.style.display = 'flex';

        const ph = document.getElementById('crmCurtainsPlaceholder');
        const gr = document.getElementById('crmCurtainsGrid');
        if (ph) ph.style.display = 'none';
        if (gr) gr.style.display = 'grid';

        loadCurtains(id);
    }

    // ── CONTACT DRAWER ────────────────────────────────────────────
    function bindContactDrawerEvents() {
        document.getElementById('crmNewContactBtn')     ?.addEventListener('click', () => openContactDrawer());
        document.getElementById('crmEditContactBtn')    ?.addEventListener('click', () => {
            if (S.selectedContact) openContactDrawer(S.selectedContact);
        });
        document.getElementById('crmCloseContactDrawer')?.addEventListener('click', closeContactDrawer);
        document.getElementById('crmCancelContact')     ?.addEventListener('click', closeContactDrawer);
        document.getElementById('crmSaveContact')       ?.addEventListener('click', saveContact);
        document.getElementById('crmContactOverlay')    ?.addEventListener('click', e => {
            if (e.target === e.currentTarget) closeContactDrawer();
        });

        let searchTimer;
        document.getElementById('crmSearch')?.addEventListener('input', e => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => loadContacts(e.target.value), 400);
        });
    }

    function openContactDrawer(contact) {
        S.editingContactId = contact ? contact.Id : null;
        setTxt('crmContactDrawerTitle', contact ? 'Редагувати контакт' : 'Новий контакт');
        setTxt('crmSaveContactTxt', contact ? 'Оновити' : 'Зберегти');
        const form = document.getElementById('crmContactForm');
        form.reset();
        if (contact) {
            ['Name','ClientName__c','Address__c','GeneralDiscount__c','Description__c'].forEach(f => {
                const el = form.elements[f];
                if (el && contact[f] != null) el.value = contact[f];
            });
        }
        document.getElementById('crmContactOverlay')?.classList.add('open');
    }

    function closeContactDrawer() {
        document.getElementById('crmContactOverlay')?.classList.remove('open');
        S.editingContactId = null;
    }

    async function saveContact() {
        const form = document.getElementById('crmContactForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const isEdit = !!S.editingContactId;
        const editId = S.editingContactId;
        const data   = Object.fromEntries(new FormData(form).entries());
        Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });

        btnLoad('crmSaveContact', 'crmSaveContactTxt', true);
        try {
            if (isEdit) {
                await SalesforceAPI.updateContact(editId, data);
                crmToast('Контакт оновлено', 'success');
            } else {
                await SalesforceAPI.createContact(data);
                crmToast('Контакт створено', 'success');
            }
            closeContactDrawer();
            await loadContacts(document.getElementById('crmSearch')?.value || '');
            if (S.selectedContact && editId === S.selectedContact.Id) {
                S.selectedContact = { ...S.selectedContact, ...data };
                setTxt('crmSelectedName', data.Name || S.selectedContact.Name);
            }
        } catch (err) {
            handleApiError(err);
        } finally {
            btnLoad('crmSaveContact', 'crmSaveContactTxt', false, isEdit ? 'Оновити' : 'Зберегти');
        }
    }

    // ── CURTAINS ─────────────────────────────────────────────────
    async function loadCurtains(contactId) {
        const grid = document.getElementById('crmCurtainsGrid');
        if (!grid) return;
        grid.innerHTML = '<div class="crm-empty" style="grid-column:1/-1"><span class="crm-spinner" style="color:#9A8BB3"></span></div>';
        try {
            S.curtains = await SalesforceAPI.getCurtains(contactId);
            renderCurtainsList(S.curtains);
        } catch (err) {
            handleApiError(err);
            grid.innerHTML = '<div class="crm-empty" style="grid-column:1/-1"><p>Помилка</p></div>';
        }
    }

    function renderCurtainsList(curtains) {
        const grid = document.getElementById('crmCurtainsGrid');
        const addCard = `<div class="crm-curtain-card add-card" id="crmAddCardBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Нова штора
        </div>`;

        const cards = curtains.map(c => {
            const price    = c.GeneralPrice__c ? Math.round(c.GeneralPrice__c).toLocaleString('uk-UA') + '\u00A0₴' : '—';
            const meterage = c.Meterage__c ? c.Meterage__c + '\u00A0м' : '';
            const coeff    = c.CoefficientZbirki__c ? ' · ' + esc(c.CoefficientZbirki__c) : '';
            const status   = c.Status__c ? ' · ' + esc(c.Status__c) : '';
            return `<div class="crm-curtain-card" data-id="${c.Id}">
                <div class="crm-curtain-card-hd">
                    <div>
                        <div class="crm-curtain-name">${esc(c.Name__c || c.Name || '—')}</div>
                        <div class="crm-curtain-room">${esc(c.Room__c || '—')}</div>
                    </div>
                    <span class="crm-type-badge">${esc(c.Type__c || '—')}</span>
                </div>
                <div class="crm-curtain-price">${price}</div>
                <div class="crm-curtain-meta">${meterage}${coeff}${status}</div>
            </div>`;
        }).join('');

        grid.innerHTML = addCard + cards;

        document.getElementById('crmAddCardBtn')?.addEventListener('click', () => openCurtainDrawer());
        grid.querySelectorAll('.crm-curtain-card[data-id]').forEach(el => {
            el.addEventListener('click', () => {
                const c = S.curtains.find(x => x.Id === el.dataset.id);
                if (c) openCurtainDrawer(c);
            });
        });
    }

    // ── CURTAIN DRAWER ────────────────────────────────────────────
    function bindCurtainDrawerEvents() {
        document.getElementById('crmNewCurtainBtn')      ?.addEventListener('click', () => openCurtainDrawer());
        document.getElementById('crmCloseCurtainDrawer') ?.addEventListener('click', closeCurtainDrawer);
        document.getElementById('crmCancelCurtain')      ?.addEventListener('click', closeCurtainDrawer);
        document.getElementById('crmSaveCurtain')        ?.addEventListener('click', saveCurtain);
        document.getElementById('crmPreviewCanvas')      ?.addEventListener('click', renderCanvas);
        document.getElementById('crmRefreshCanvas')      ?.addEventListener('click', renderCanvas);
        document.getElementById('crmDownloadImg')        ?.addEventListener('click', downloadImage);
        document.getElementById('crmSaveImgToSF')        ?.addEventListener('click', saveImageToSF);
        document.getElementById('crmCurtainOverlay')     ?.addEventListener('click', e => {
            if (e.target === e.currentTarget) closeCurtainDrawer();
        });

        document.querySelectorAll('.crm-calc').forEach(el => {
            el.addEventListener('change', updateCalcPreview);
            el.addEventListener('input',  updateCalcPreview);
        });
    }

    function openCurtainDrawer(curtain) {
        S.editingCurtainId = curtain ? curtain.Id : null;
        setTxt('crmCurtainDrawerTitle', curtain ? 'Редагувати штору' : 'Нова штора');
        setTxt('crmSaveCurtainTxt', curtain ? 'Оновити в SF' : 'Зберегти в SF');
        setDisplay('crmCanvasSection', 'none');
        setDisplay('crmSaveImgToSF', curtain ? 'inline-flex' : 'none');

        const form = document.getElementById('crmCurtainForm');
        form.reset();
        if (form.elements['Quantity__c']) form.elements['Quantity__c'].value = '1';

        if (curtain) {
            document.getElementById('crmCurtainOverlay')?.classList.add('open');
            SalesforceAPI.getCurtain(curtain.Id).then(function(fullRecord) {
                _fillCurtainForm(form, fullRecord);
                requestAnimationFrame(updateCalcPreview);
            }).catch(function() {
                _fillCurtainForm(form, curtain);
                requestAnimationFrame(updateCalcPreview);
            });
        } else {
            requestAnimationFrame(updateCalcPreview);
            document.getElementById('crmCurtainOverlay')?.classList.add('open');
        }
    }

    /**
     * Витягує числовий коефіцієнт з будь-якого рядка.
     * "1:1.5" → 1.5 | "Enigma 1:1,5" → 1.5 | "Sofora 1:2" → 2
     */
    function _parseCoeffNum(raw) {
        if (!raw) return null;
        const s = String(raw);
        if (s.includes(':')) {
            const n = parseFloat(s.split(':').pop().replace(',', '.').trim());
            if (!isNaN(n)) return n;
        }
        const n = parseFloat(s.replace(',', '.'));
        return isNaN(n) ? null : n;
    }

    /**
     * Знаходить найближчу опцію у select CoefficientZbirki__c за числовим значенням коефіцієнта.
     * SF може зберігати "1:1.5" замість "Enigma 1:1,5" — знаходимо правильну опцію.
     */
    function _matchCoeffOption(selectEl, sfValue) {
        if (!selectEl || !sfValue) return;

        // Спочатку пробуємо точне співпадіння
        for (let i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value === sfValue) {
                selectEl.value = sfValue;
                return;
            }
        }

        // Точне не знайдено — шукаємо за числовим коефіцієнтом
        const targetCoeff = _parseCoeffNum(sfValue);
        if (targetCoeff == null) return;

        let bestOption = null;
        let bestDiff = Infinity;

        for (let i = 0; i < selectEl.options.length; i++) {
            const optVal = selectEl.options[i].value;
            if (!optVal) continue;
            const optCoeff = _parseCoeffNum(optVal);
            if (optCoeff == null) continue;
            const diff = Math.abs(optCoeff - targetCoeff);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestOption = optVal;
            }
        }

        if (bestOption !== null) {
            selectEl.value = bestOption;
        }
    }

    function _fillCurtainForm(form, c) {
        // Текстові та числові поля — заповнюємо напряму
        const simpleFields = [
            'Type__c','Room__c','Name__c','CarnizWigth__c','CustomWigth__c',
            'Height__c','HeightPoint__c','Quantity__c',
            'Zbirka__c','zbirkaTasmu__c','Tasma__c','TasmaPlace__c','Price__c',
            'TasmaPrice__c','PoshivPrice__c','NavisPrice__c','Delivery__c',
            'DeliveryNumber__c','CurtainDiscount__c','ObrobkaNiz__c','Status__c','Description__c'
        ];
        simpleFields.forEach(f => {
            const el = form.elements[f];
            if (el && c[f] != null) el.value = c[f];
        });

        // CoefficientZbirki__c — fuzzy match по коефіцієнту
        if (c.CoefficientZbirki__c != null) {
            const coeffEl = form.elements['CoefficientZbirki__c'];
            _matchCoeffOption(coeffEl, String(c.CoefficientZbirki__c));
        }

        // Чекбокси
        if (form.elements['Navis__c']) form.elements['Navis__c'].checked = !!c.Navis__c;
        if (form.elements['Viizd__c']) form.elements['Viizd__c'].checked = !!c.Viizd__c;
    }

    function closeCurtainDrawer() {
        document.getElementById('crmCurtainOverlay')?.classList.remove('open');
        S.editingCurtainId = null;
    }

    function getFormData(form) {
        const data = {};
        form.querySelectorAll('input,select,textarea').forEach(el => {
            if (!el.name) return;
            data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        });
        return data;
    }

    async function saveCurtain() {
        if (!S.selectedContact) { crmToast('Оберіть контакт', 'error'); return; }
        const form = document.getElementById('crmCurtainForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const isEdit  = !!S.editingCurtainId;
        const rawData = getFormData(form);
        const data    = { Contact__c: S.selectedContact.Id };

        // CoefficientZbirki__c: SF global value set uses short ratios "1:1,5"
        // Convert old "Enigma 1:1,5" format if needed, or use select value directly
        if (rawData['CoefficientZbirki__c']) {
            const cv = String(rawData['CoefficientZbirki__c']).trim();
            const m = cv.match(/(\d+:[0-9,\.]+)/);
            if (m) data['CoefficientZbirki__c'] = m[1];
        }
        ['Type__c','Room__c','Name__c','HeightPoint__c','Zbirka__c',
         'zbirkaTasmu__c','Tasma__c','TasmaPlace__c','Delivery__c','CurtainDiscount__c',
         'ObrobkaNiz__c','Status__c','Description__c'
        ].forEach(f => { if (rawData[f]) data[f] = rawData[f]; });

        ['CarnizWigth__c','CustomWigth__c','Height__c','Quantity__c','Price__c',
         'TasmaPrice__c','PoshivPrice__c','NavisPrice__c','DeliveryNumber__c'
        ].forEach(f => { if (rawData[f]) data[f] = rawData[f]; });

        data.Navis__c = rawData.Navis__c;
        data.Viizd__c = rawData.Viizd__c;
        Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });

        // КРИТИЧНО: при PATCH не слати Contact__c
        if (isEdit) delete data.Contact__c;

        btnLoad('crmSaveCurtain', 'crmSaveCurtainTxt', true);
        try {
            let savedId;
            if (isEdit) {
                await SalesforceAPI.updateCurtain(S.editingCurtainId, data);
                savedId = S.editingCurtainId;
                crmToast('Штора оновлена — SF перераховує…', 'success');
            } else {
                const res = await SalesforceAPI.createCurtain(data);
                savedId = res.id;
                S.editingCurtainId = savedId;
                crmToast('Штора збережена! Trigger розраховує поля…', 'success');
            }
            setDisplay('crmSaveImgToSF', 'inline-flex');
            setTxt('crmSaveCurtainTxt', 'Оновити в SF');
            if (S.selectedContact) loadCurtains(S.selectedContact.Id);

            // Через 2.2с підтягуємо розраховані SF поля і оновлюємо форму
            setTimeout(async () => {
                if (!savedId) return;
                const updated = await SalesforceAPI.getCurtain(savedId).catch(() => null);
                if (updated) {
                    _fillCurtainForm(form, updated);
                    requestAnimationFrame(updateCalcPreview);
                    if (updated.GeneralPrice__c) {
                        crmToast('Розраховано: ' + Math.round(updated.GeneralPrice__c).toLocaleString('uk-UA') + '\u00A0₴', 'success');
                    }
                    if (S.selectedContact) loadCurtains(S.selectedContact.Id);
                }
            }, 2200);

        } catch (err) {
            handleApiError(err);
        } finally {
            btnLoad('crmSaveCurtain', 'crmSaveCurtainTxt', false, S.editingCurtainId ? 'Оновити в SF' : 'Зберегти в SF');
        }
    }

    // ── CALCULATOR ────────────────────────────────────────────────
    function updateCalcPreview() {
        if (!window.LavandaCalculator) return;
        const form = document.getElementById('crmCurtainForm');
        if (!form) return;
        const calc = LavandaCalculator.calculate(getFormData(form));
        const fM = v => (v != null && v !== 0) ? v + '\u00A0м' : '—';
        const fP = v => v ? Math.round(v).toLocaleString('uk-UA') + '\u00A0₴' : '—';
        setTxt('ccMeterage',         fM(calc.Meterage__c));
        setTxt('ccMeterageNaPoshiv', fM(calc.MeterageNaPoshiv__c));
        setTxt('ccTasmaMetrage',     fM(calc.TasmaMetrage__c));
        setTxt('ccNavisPrice',       fP(calc.NavisPriceSum__c));
        setTxt('ccTasmaPrice',       fP(calc.TasmaPriceSum__c));
        setTxt('ccPoshivPrice',      fP(calc.PoshivPriceSum__c));
        setTxt('ccTotalPrice',       calc.GeneralPrice__c
            ? Math.round(calc.GeneralPrice__c).toLocaleString('uk-UA') + '\u00A0₴' : '0\u00A0₴');
    }

    // ── CANVAS ────────────────────────────────────────────────────
    function renderCanvas() {
        if (!window.LavandaCalculator || !window.CurtainImage) return;
        const form    = document.getElementById('crmCurtainForm');
        const data    = getFormData(form);
        const calc    = LavandaCalculator.calculate(data);
        const rData   = CurtainImage.prepareData(
            { ...data, CreatedDate: new Date().toISOString() },
            calc.Meterage__c || 0,
            S.selectedContact ? (S.selectedContact.Name || '') : ''
        );
        const canvas  = document.getElementById('crmCurtainCanvas');
        setDisplay('crmCanvasSection', 'block');
        CurtainImage.draw(canvas, rData);
    }

    function downloadImage() {
        const canvas = document.getElementById('crmCurtainCanvas');
        const name   = S.selectedContact ? S.selectedContact.Name.replace(/\s+/g, '_') : 'curtain';
        CurtainImage.download(canvas, name + '_' + new Date().toISOString().substring(0, 10) + '.png');
    }

    async function saveImageToSF() {
        if (!S.editingCurtainId) { crmToast('Спочатку збережіть штору', 'error'); return; }
        const btn  = document.getElementById('crmSaveImgToSF');
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="crm-spinner"></span>';
        try {
            await SalesforceAPI.saveImageToSalesforce(
                S.editingCurtainId,
                CurtainImage.toBase64(document.getElementById('crmCurtainCanvas'))
            );
            crmToast('Зображення збережено в Salesforce!', 'success');
        } catch (err) {
            handleApiError(err);
        } finally {
            btn.disabled  = false;
            btn.innerHTML = orig;
        }
    }

    // ── DOM HELPERS ───────────────────────────────────────────────
    function setTxt(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
    function setDisplay(id, val) {
        const el = document.getElementById(id);
        if (el) el.style.display = val;
    }
    function btnLoad(btnId, txtId, loading, label) {
        const btn = document.getElementById(btnId);
        const txt = document.getElementById(txtId);
        if (!btn || !txt) return;
        btn.disabled  = loading;
        txt.innerHTML = loading ? '<span class="crm-spinner"></span>' : (label || '');
    }
    function crmToast(msg, type) {
        const c = document.getElementById('crmToasts');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'crm-toast' + (type ? ' ' + type : '');
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => {
            t.style.transition = 'opacity 0.3s';
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 300);
        }, 3500);
    }
    function handleApiError(err) {
        console.error('[CRM]', err);
        const msg = (err && err.message) || 'Невідома помилка';
        if (msg.includes('Session expired') || msg.includes('Not authenticated')) {
            crmToast('Сесія закінчилась. Увійдіть знову.', 'error');
            setTimeout(() => { SalesforceAPI.logout(); renderAuthState(); }, 1500);
        } else {
            crmToast('Помилка: ' + msg.substring(0, 90), 'error');
        }
    }
    function esc(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

}());
