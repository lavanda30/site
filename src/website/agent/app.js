/**
 * app.js — LAVANDA CRM Agent Page Logic
 * Salesforce REST API + Calculator + Canvas Image
 */

// ── STATE ─────────────────────────────────────────────────────
const State = {
    contacts: [],
    selectedContact: null,
    curtains: [],
    editingContactId: null,
    editingCurtainId: null
};

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Handle OAuth callback
    if (SalesforceAPI.handleCallback()) {
        showToast('Успішний вхід до Salesforce!', 'success');
    }

    if (SalesforceAPI.isAuthenticated()) {
        showApp();
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appPage').classList.remove('active');
}

async function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').classList.add('active');

    // Load user info
    const user = await SalesforceAPI.getUserInfo().catch(() => null);
    if (user) {
        document.getElementById('headerUser').textContent = user.display_name || user.email || '';
    }

    loadContacts();
    bindEvents();
}

// ── EVENTS ────────────────────────────────────────────────────
function bindEvents() {
    // Login / Logout
    document.getElementById('loginBtn').addEventListener('click', () => SalesforceAPI.login());
    document.getElementById('logoutBtn').addEventListener('click', () => {
        SalesforceAPI.logout();
        showLogin();
    });

    // Search
    let searchTimer;
    document.getElementById('contactSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadContacts(e.target.value), 400);
    });

    // New Contact
    document.getElementById('newContactBtn').addEventListener('click', () => openContactDrawer());
    document.getElementById('editContactBtn').addEventListener('click', () => {
        if (State.selectedContact) openContactDrawer(State.selectedContact);
    });
    document.getElementById('cancelContactBtn').addEventListener('click', closeContactDrawer);
    document.getElementById('closeContactDrawer').addEventListener('click', closeContactDrawer);
    document.getElementById('contactDrawerOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeContactDrawer();
    });
    document.getElementById('saveContactBtn').addEventListener('click', saveContact);

    // New Curtain
    document.getElementById('newCurtainBtn').addEventListener('click', () => openCurtainDrawer());
    document.getElementById('cancelCurtainBtn').addEventListener('click', closeCurtainDrawer);
    document.getElementById('closeCurtainDrawer').addEventListener('click', closeCurtainDrawer);
    document.getElementById('curtainDrawerOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeCurtainDrawer();
    });
    document.getElementById('saveCurtainBtn').addEventListener('click', saveCurtain);
    document.getElementById('previewCurtainBtn').addEventListener('click', renderCurtainCanvas);
    document.getElementById('refreshCanvasBtn').addEventListener('click', renderCurtainCanvas);
    document.getElementById('downloadImgBtn').addEventListener('click', downloadCurtainImage);
    document.getElementById('saveImgToSFBtn').addEventListener('click', saveCurtainImageToSF);

    // Live calculator on curtain form
    document.querySelectorAll('.calc-input').forEach(el => {
        el.addEventListener('change', updateCalcPreview);
        el.addEventListener('input', updateCalcPreview);
    });
}

// ── CONTACTS ──────────────────────────────────────────────────
async function loadContacts(search) {
    const list = document.getElementById('contactsList');
    list.innerHTML = '<div class="contacts-empty"><span class="spinner"></span></div>';
    try {
        const contacts = await SalesforceAPI.getContacts(search || '');
        State.contacts = contacts;
        renderContactsList(contacts);
    } catch (err) {
        handleApiError(err);
        list.innerHTML = '<div class="contacts-empty">Помилка завантаження</div>';
    }
}

function renderContactsList(contacts) {
    const list = document.getElementById('contactsList');
    if (!contacts.length) {
        list.innerHTML = '<div class="contacts-empty">Контакти не знайдені</div>';
        return;
    }
    list.innerHTML = contacts.map(c => {
        const displayName = c.Name || '?';
        const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const isActive = State.selectedContact && State.selectedContact.Id === c.Id;
        return `<div class="contact-item ${isActive ? 'active' : ''}" data-id="${c.Id}">
            <div class="contact-avatar">${initials}</div>
            <div class="contact-info">
                <div class="contact-name">${displayName || '—'}</div>
                <div class="contact-phone">${c.ClientName__c || ''}</div>
            </div>
            ${c.Client_Status__c ? `<span class="contact-badge">${c.Client_Status__c}</span>` : ''}
        </div>`;
    }).join('');

    list.querySelectorAll('.contact-item').forEach(item => {
        item.addEventListener('click', () => selectContact(item.dataset.id));
    });
}

async function selectContact(id) {
    const contact = State.contacts.find(c => c.Id === id) || await SalesforceAPI.getContact(id).catch(() => null);
    if (!contact) return;

    State.selectedContact = contact;

    // Update list active state
    document.querySelectorAll('.contact-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
    });

    // Update curtains header
    document.getElementById('curtainsHeader').style.display = 'flex';
    document.getElementById('selectedContactName').textContent = contact.Name || '—';
    document.getElementById('selectedContactMeta').textContent =
        [contact.ClientName__c, contact.Address__c, contact.GeneralDiscount__c ? contact.GeneralDiscount__c + '% знижка' : ''].filter(Boolean).join(' · ');

    loadCurtains(id);
}

// ── CONTACT DRAWER ────────────────────────────────────────────
function openContactDrawer(contact) {
    State.editingContactId = contact ? contact.Id : null;
    document.getElementById('contactDrawerTitle').textContent = contact ? 'Редагувати контакт' : 'Новий контакт';
    document.getElementById('saveContactBtnText').textContent = contact ? 'Оновити' : 'Зберегти';

    const form = document.getElementById('contactForm');
    form.reset();
    if (contact) {
        // Map: form element name → SF field name
        const fieldMap = {
            'Name':               'Name',
            'ClientName__c':      'ClientName__c',
            'GeneralDiscount__c': 'GeneralDiscount__c',
            'Address__c':         'Address__c',
            'Description__c':     'Description__c'
        };
        Object.entries(fieldMap).forEach(([formName, sfName]) => {
            const el = form.elements[formName];
            if (el && contact[sfName] != null) el.value = contact[sfName];
        });
    }
    document.getElementById('contactDrawerOverlay').classList.add('active');
}

function closeContactDrawer() {
    document.getElementById('contactDrawerOverlay').classList.remove('active');
    State.editingContactId = null;
}

async function saveContact() {
    const form = document.getElementById('contactForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const isEdit = !!State.editingContactId;
    const editingId = State.editingContactId;
    const data = Object.fromEntries(new FormData(form).entries());
    // Clean empty fields
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });

    setBtnLoading(document.getElementById('saveContactBtn'), document.getElementById('saveContactBtnText'), true);
    try {
        if (isEdit) {
            await SalesforceAPI.updateContact(editingId, data);
            showToast('Контакт оновлено', 'success');
        } else {
            await SalesforceAPI.createContact(data);
            showToast('Контакт створено', 'success');
        }
        closeContactDrawer();
        await loadContacts(document.getElementById('contactSearch').value);
        if (State.selectedContact && editingId === State.selectedContact.Id) {
            State.selectedContact = { ...State.selectedContact, ...data };
            document.getElementById('selectedContactName').textContent = data.Name || State.selectedContact.Name || '—';
        }
    } catch (err) {
        handleApiError(err);
    } finally {
        setBtnLoading(document.getElementById('saveContactBtn'), document.getElementById('saveContactBtnText'), false, isEdit ? 'Оновити' : 'Зберегти');
    }
}

// ── CURTAINS ──────────────────────────────────────────────────
async function loadCurtains(contactId) {
    const body = document.getElementById('curtainsBody');
    body.innerHTML = '<div class="no-contact-placeholder"><span class="spinner"></span><p>Завантаження...</p></div>';
    try {
        const curtains = await SalesforceAPI.getCurtains(contactId);
        State.curtains = curtains;
        renderCurtainsList(curtains);
    } catch (err) {
        handleApiError(err);
        body.innerHTML = '<div class="no-contact-placeholder"><p>Помилка завантаження</p></div>';
    }
}

function renderCurtainsList(curtains) {
    const body = document.getElementById('curtainsBody');

    // "New Curtain" add card always first
    const addCard = `<div class="curtain-card" id="addNewCurtainCard" style="border-style:dashed;cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:120px;gap:0.5rem;color:var(--crm-text-light)" onclick="openCurtainDrawer()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Нова штора
    </div>`;

    if (!curtains.length) {
        body.innerHTML = addCard;
        return;
    }

    const cards = curtains.map(c => {
        const price = c.GeneralPrice__c ? Math.round(c.GeneralPrice__c).toLocaleString('uk-UA') + ' ₴' : '—';
        const meterage = c.Meterage__c ? c.Meterage__c + ' м' : '—';
        return `<div class="curtain-card" data-id="${c.Id}">
            <div class="curtain-card-header">
                <div>
                    <div class="curtain-name">${c.Name__c || c.Name || '—'}</div>
                    <div class="curtain-room">${c.Room__c || '—'}</div>
                </div>
                <span class="curtain-type-badge">${c.Type__c || '—'}</span>
            </div>
            <div class="curtain-price">${price}</div>
            <div class="curtain-meta">${meterage} · ${c.CoefficientZbirki__c || ''} ${c.Status__c || ''}</div>
        </div>`;
    }).join('');

    body.innerHTML = addCard + cards;

    body.querySelectorAll('.curtain-card[data-id]').forEach(card => {
        card.addEventListener('click', async () => {
            // Load the FULL curtain record from SF (includes price fields missing from the list query)
            const curtainFull = await SalesforceAPI.getCurtain(card.dataset.id).catch(() => null);
            const curtain = curtainFull || State.curtains.find(c => c.Id === card.dataset.id);
            if (curtain) openCurtainDrawer(curtain);
        });
    });
}

// ── CURTAIN DRAWER ────────────────────────────────────────────
function openCurtainDrawer(curtain) {
    State.editingCurtainId = curtain ? curtain.Id : null;
    document.getElementById('curtainDrawerTitle').textContent = curtain ? 'Редагувати штору' : 'Нова штора';
    document.getElementById('saveCurtainBtnText').textContent = curtain ? 'Оновити в SF' : 'Зберегти в SF';
    document.getElementById('canvasSection').style.display = 'none';
    document.getElementById('saveImgToSFBtn').style.display = curtain ? 'inline-flex' : 'none';

    const form = document.getElementById('curtainForm');
    form.reset();

    const textFields = ['Type__c', 'Room__c', 'Name__c', 'CarnizWigth__c', 'CustomWigth__c',
        'Height__c', 'HeightPoint__c', 'Quantity__c', 'CoefficientZbirki__c', 'Zbirka__c',
        'zbirkaTasmu__c', 'Tasma__c', 'TasmaPlace__c', 'Price__c', 'TasmaPrice__c',
        'PoshivPrice__c', 'NavisPrice__c', 'Delivery__c', 'DeliveryNumber__c',
        'CurtainDiscount__c', 'ObrobkaNiz__c', 'Description__c'];

    if (curtain) {
        textFields.forEach(field => {
            const el = form.elements[field];
            if (el && curtain[field] != null) el.value = curtain[field];
        });
        const navisEl = form.elements['Navis__c'];
        const viizd = form.elements['Viizd__c'];
        if (navisEl) navisEl.checked = !!curtain.Navis__c;
        if (viizd) viizd.checked = !!curtain.Viizd__c;
    }

    // Set default quantity
    if (!curtain && form.elements['Quantity__c'].value === '') {
        form.elements['Quantity__c'].value = '1';
    }

    updateCalcPreview();
    document.getElementById('curtainDrawerOverlay').classList.add('active');
}

function closeCurtainDrawer() {
    document.getElementById('curtainDrawerOverlay').classList.remove('active');
    State.editingCurtainId = null;
}

function getFormData(form) {
    const data = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        if (!el.name) return;
        if (el.type === 'checkbox') {
            data[el.name] = el.checked;
        } else {
            data[el.name] = el.value;
        }
    });
    return data;
}

async function saveCurtain() {
    if (!State.selectedContact) { showToast('Виберіть контакт', 'error'); return; }
    const form = document.getElementById('curtainForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const rawData = getFormData(form);

    // Build SF data — Contact__c is ONLY included on create, not on update,
    // because Salesforce blocks updating a parent relationship field via REST API.
    const isUpdate = !!State.editingCurtainId;
    const data = isUpdate ? {} : { Contact__c: State.selectedContact.Id };

    const numericFields = ['CarnizWigth__c', 'CustomWigth__c', 'Height__c', 'Quantity__c',
        'Price__c', 'TasmaPrice__c', 'PoshivPrice__c', 'NavisPrice__c', 'DeliveryNumber__c'];
    const textFields = ['Type__c', 'Room__c', 'Name__c', 'HeightPoint__c', 'CoefficientZbirki__c',
        'Zbirka__c', 'zbirkaTasmu__c', 'Tasma__c', 'TasmaPlace__c', 'Delivery__c',
        'CurtainDiscount__c', 'ObrobkaNiz__c', 'Description__c'];

    textFields.forEach(f => { if (rawData[f]) data[f] = rawData[f]; });
    numericFields.forEach(f => { if (rawData[f]) data[f] = rawData[f]; });
    data.Navis__c = rawData.Navis__c;
    data.Viizd__c = rawData.Viizd__c;

    // Remove empty strings
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });

    setBtnLoading(document.getElementById('saveCurtainBtn'), document.getElementById('saveCurtainBtnText'), true);
    try {
        let savedId;
        if (State.editingCurtainId) {
            await SalesforceAPI.updateCurtain(State.editingCurtainId, data);
            savedId = State.editingCurtainId;
            showToast('Штора оновлена. Salesforce розраховує поля...', 'success');
        } else {
            const result = await SalesforceAPI.createCurtain(data);
            savedId = result.id;
            State.editingCurtainId = savedId;
            showToast('Штора збережена! Trigger розраховує поля...', 'success');
        }

        // Show "Save to SF" image button after save
        document.getElementById('saveImgToSFBtn').style.display = 'inline-flex';
        document.getElementById('saveCurtainBtnText').textContent = 'Оновити в SF';

        // Reload curtains list
        if (State.selectedContact) loadCurtains(State.selectedContact.Id);

        // Re-fetch with calculated fields after trigger
        setTimeout(async () => {
            if (savedId) {
                const updated = await SalesforceAPI.getCurtain(savedId).catch(() => null);
                if (updated) {
                    showToast('Розраховано: ' + (updated.GeneralPrice__c
                        ? Math.round(updated.GeneralPrice__c).toLocaleString('uk-UA') + ' ₴' : '—'), 'success');
                    if (State.selectedContact) loadCurtains(State.selectedContact.Id);
                }
            }
        }, 2000);

    } catch (err) {
        handleApiError(err);
    } finally {
        setBtnLoading(document.getElementById('saveCurtainBtn'), document.getElementById('saveCurtainBtnText'), false, State.editingCurtainId ? 'Оновити в SF' : 'Зберегти в SF');
    }
}

// ── CALCULATOR (live preview) ─────────────────────────────────
function updateCalcPreview() {
    const form = document.getElementById('curtainForm');
    const data = getFormData(form);

    if (!window.LavandaCalculator) return;
    const calc = LavandaCalculator.calculate(data);

    const fmt = n => n ? n.toLocaleString('uk-UA') + ' ₴' : '—';
    const fmtM = n => n != null ? n + ' м' : '—';

    document.getElementById('calcMeterage').textContent = fmtM(calc.Meterage__c);
    document.getElementById('calcMeterageNaPoshiv').textContent = fmtM(calc.MeterageNaPoshiv__c);
    document.getElementById('calcTasmaMetrage').textContent = fmtM(calc.TasmaMetrage__c);
    document.getElementById('calcCurtainPrice').textContent = fmt(calc.CurtainPriceSum__c);
    document.getElementById('calcTasmaPrice').textContent = fmt(calc.TasmaPriceSum__c);
    document.getElementById('calcPoshivPrice').textContent = fmt(calc.PoshivPriceSum__c);
    document.getElementById('calcTotalPrice').textContent = calc.GeneralPrice__c
        ? Math.round(calc.GeneralPrice__c).toLocaleString('uk-UA') + ' ₴' : '0 ₴';
}

// ── CANVAS IMAGE ──────────────────────────────────────────────
function renderCurtainCanvas() {
    const form = document.getElementById('curtainForm');
    const data = getFormData(form);

    if (!window.LavandaCalculator || !window.CurtainImage) return;

    const calc = LavandaCalculator.calculate(data);
    const meterage = calc.Meterage__c || 0;

    // Build a curtain-like object
    const curtainObj = {
        ...data,
        CreatedDate: new Date().toISOString()
    };

    const contactName = State.selectedContact ? State.selectedContact.Name__c : '';
    const renderData = CurtainImage.prepareData(curtainObj, meterage, contactName);

    const canvas = document.getElementById('curtainCanvas');
    const section = document.getElementById('canvasSection');
    section.style.display = 'block';

    CurtainImage.draw(canvas, renderData);
}

function downloadCurtainImage() {
    const canvas = document.getElementById('curtainCanvas');
    const contactName = State.selectedContact ? State.selectedContact.Name__c.replace(/\s+/g, '_') : 'curtain';
    CurtainImage.download(canvas, contactName + '_' + new Date().toISOString().substring(0, 10) + '.png');
}

async function saveCurtainImageToSF() {
    if (!State.editingCurtainId) {
        showToast('Спочатку збережіть штору', 'error');
        return;
    }
    const canvas = document.getElementById('curtainCanvas');
    if (!canvas.width || canvas.width === 0) {
        showToast('Спочатку згенеруйте зображення', 'error');
        return;
    }

    const btn = document.getElementById('saveImgToSFBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
        const base64 = CurtainImage.toBase64(canvas);
        await SalesforceAPI.saveImageToSalesforce(State.editingCurtainId, base64);
        showToast('Зображення збережено в Salesforce!', 'success');
    } catch (err) {
        handleApiError(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Зберегти в Salesforce';
    }
}

// ── HELPERS ───────────────────────────────────────────────────
function handleApiError(err) {
    console.error(err);
    const msg = err.message || 'Помилка';
    if (msg.includes('Session expired') || msg.includes('Not authenticated')) {
        showToast('Сесія закінчилась. Увійдіть знову.', 'error');
        setTimeout(() => { SalesforceAPI.logout(); showLogin(); }, 1500);
    } else {
        showToast('Помилка: ' + msg.substring(0, 80), 'error');
    }
}

function setBtnLoading(btn, textEl, loading, text) {
    btn.disabled = loading;
    if (loading) {
        textEl.innerHTML = '<span class="spinner"></span>';
    } else {
        textEl.textContent = text || '';
    }
}

function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

