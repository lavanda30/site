/**
 * lavanda-notify.js — Нотифікації для LAVANDA
 * Telegram Bot: @Anna_Shory_bot
 * EmailJS Service: service_8tvcgm2
 *
 * Використання:
 *   LavandaNotify.send({ type, name, phone, ...details })
 *
 * НАЛАШТУВАННЯ:
 *   1. Отримайте chat_id: напишіть /start боту @Anna_Shory_bot у Telegram,
 *      потім відкрийте https://api.telegram.org/bot7443802771:AAHEUMZjKVRCT6eSsRSG0wPUD8XeCdHZGJk/getUpdates
 *      і знайдіть "id" у полі "chat" — вставте нижче в TELEGRAM_CHAT_ID
 *
 *   2. EmailJS: замінити YOUR_PUBLIC_KEY в index.html
 */

const LavandaNotify = (function () {
    'use strict';

    // ── CONFIG ───────────────────────────────────────────────────────────────
    const TELEGRAM_BOT_TOKEN = '7443802771:AAHEUMZjKVRCT6eSsRSG0wPUD8XeCdHZGJk';
    const TELEGRAM_CHAT_ID   = '1027792488'; // ← замінити після /start (див. інструкцію вище)
    const EMAILJS_SERVICE    = 'service_8tvcgm2';
    const EMAILJS_TEMPLATE   = 'template_7tqrb3k';  // назва шаблону у EmailJS Dashboard
    const EMAIL_TO           = 'lavandashtory@gmail.com';

    // ── FORMAT MESSAGE ───────────────────────────────────────────────────────
    function formatTelegram(data) {
        const isCalc = data.type === 'calculator';
        const icon   = isCalc ? '🧮' : '📋';
        const title  = isCalc
            ? '🆕 Новий розрахунок з сайту LAVANDA'
            : '🆕 Запит на консультацію LAVANDA';

        let lines = [title, ''];

        if (data.name)  lines.push(`👤 Ім'я: ${data.name}`);
        if (data.phone) lines.push(`📞 Телефон: ${data.phone}`);
        lines.push('');

        if (isCalc) {
            if (data.fabric) lines.push(`🪟 Тип виробу: ${data.fabric}`);
            if (data.color)  lines.push(`🎨 Колір: ${data.color}`);
            if (data.width)  lines.push(`📐 Ширина карниза: ${data.width}`);
            if (data.gather) lines.push(`🔗 Збірка: ${data.gather}`);
            if (data.level)  lines.push(`⭐ Рівень якості: ${data.level}`);
            if (data.meters) lines.push(`📏 Метраж: ~${data.meters} м`);
            if (data.total) {
                lines.push('');
                lines.push(`💰 Орієнтовна вартість: ${data.total}`);
            }
        } else {
            if (data.interest) lines.push(`🛍 Цікавить: ${data.interest}`);
        }

        lines.push('');
        lines.push(`🕐 ${new Date().toLocaleString('uk-UA')}`);

        return lines.join('\n');
    }

    function formatEmail(data) {
        const isCalc = data.type === 'calculator';
        const subject = isCalc
            ? 'Новий прорахунок з сайту LAVANDA'
            : 'Запит на консультацію LAVANDA';

        const details = isCalc
            ? [
                `Тип виробу: ${data.fabric || '—'}`,
                `Колір: ${data.color || '—'}`,
                `Ширина карниза: ${data.width || '—'}`,
                `Збірка тасьми: ${data.gather || '—'}`,
                `Рівень якості: ${data.level || '—'}`,
                `Метраж: ~${data.meters || '—'} м`,
                `Орієнтовна вартість: ${data.total || '—'}`,
              ].join('\n')
            : `Цікавить: ${data.interest || '—'}`;

        const message =
            `${subject}\n\n` +
            `Ім'я: ${data.name || '(не вказано)'}\n` +
            `Телефон: ${data.phone || '—'}\n\n` +
            details;

        return { subject, message };
    }

    // ── TELEGRAM SEND ────────────────────────────────────────────────────────
    async function sendTelegram(text) {
        if (!TELEGRAM_CHAT_ID) {
            console.warn('⚠️ Telegram: TELEGRAM_CHAT_ID не налаштовано. Відкрийте lavanda-notify.js і вкажіть chat_id.');
            return;
        }
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id:    TELEGRAM_CHAT_ID,
                    text,
                }),
            });
            const json = await res.json();
            if (json.ok) {
                console.log('✅ Telegram: повідомлення відправлено');
            } else {
                console.warn('❌ Telegram error:', json.description);
                // Retry without MarkdownV2 if parse error
                if (json.description && json.description.includes("can't parse")) {
                    const plain = text.replace(/[*_`[\]()~>#+=|{}.!\\-]/g, '');
                    await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: plain }),
                    });
                }
            }
        } catch (err) {
            console.warn('❌ Telegram fetch error:', err);
        }
    }

    // ── EMAILJS SEND ─────────────────────────────────────────────────────────
    function sendEmail(data) {
        if (!window.emailjs) {
            console.warn('⚠️ EmailJS не завантажено');
            return;
        }
        const { subject, message } = formatEmail(data);
        emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
            to_email:  EMAIL_TO,
            from_name: data.name  || 'Клієнт LAVANDA',
            phone:     data.phone || '—',
            subject,
            message,
        })
        .then(() => console.log('✅ EmailJS: лист відправлено'))
        .catch(err => console.warn('❌ EmailJS error:', err));
    }

    // ── PUBLIC: SEND BOTH ────────────────────────────────────────────────────
    function send(data) {
        // Telegram
        const tgText = formatTelegram(data);
        sendTelegram(tgText);

        // Email
        sendEmail(data);

        // Console log (debug)
        console.log('📬 Lavanda notify:\n', data);
    }

    // ── GET CHAT ID HELPER ───────────────────────────────────────────────────
    // Виклич LavandaNotify.getChatId() в консолі браузера щоб дізнатись свій chat_id
    async function getChatId() {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
        try {
            const res  = await fetch(url);
            const json = await res.json();
            if (json.result && json.result.length > 0) {
                const last = json.result[json.result.length - 1];
                const id   = last.message?.chat?.id || last.channel_post?.chat?.id;
                console.log('✅ Твій Telegram chat_id:', id);
                console.log('📋 Вставте це значення в lavanda-notify.js → TELEGRAM_CHAT_ID:', JSON.stringify(id));
                return id;
            } else {
                console.warn('⚠️ Немає повідомлень. Напишіть /start боту @Anna_Shory_bot і спробуйте знову.');
            }
        } catch (err) {
            console.warn('❌ getChatId error:', err);
        }
    }

    return { send, getChatId };
}());

if (typeof window !== 'undefined') {
    window.LavandaNotify = LavandaNotify;
}
