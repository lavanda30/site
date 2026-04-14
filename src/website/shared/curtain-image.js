/**
 * curtain-image.js — Canvas рендер технічної картки штори
 * Версія 6.0 — відповідає вигляду в Salesforce
 * Canvas 900×620
 *
 * Структура:
 *  ┌──────────────────────────────────────────────────────────────────┐
 *  │  [Шапка: тасьма, збірка, коефіцієнт, місце]    [дата | клієнт]  │
 *  ├────────────────────┬────┬──────────────────────────────────────┤
 *  │                    │ ↑  │  Кімната                             │
 *  │  [Складки штори]   │    │  ─────────────                      │
 *  │  (тюль = світлий   │ ↕  │  Тканина                             │
 *  │   варіант складок) │    │  ─────────────                      │
 *  │                    │ ↓  │  Коментар                            │
 *  │  ←─ ШИРИНА (см) ─→ │    │                                      │
 *  ├────────────────────┴────┴──────────────────────────────────────┤
 *  │  - обробка низу -          [ТИП]                               │
 *  └──────────────────────────────────────────────────────────────────┘
 *
 *  Стрілка висоти — вертикальна, між тканиною і панеллю.
 *  Підпис стрілки — вертикально, ЗЛІВА від лінії стрілки.
 *  Стрілка йде від верху тканини до точки HeightPoint (тасьма/петля/etc).
 */

const CurtainImage = (function () {
    'use strict';

    // ── Розміри полотна ──────────────────────────────────────────────
    const W = 900;
    const H = 620;

    // ── Layout ────────────────────────────────────────────────────────
    const HEADER_H = 44;
    const FOOTER_H = 38;
    const PAD      = 16;

    // Зона тканини (ліва половина)
    const FABRIC_X1 = PAD;
    const FABRIC_X2 = 510;
    const FABRIC_Y1 = HEADER_H + PAD;
    const FABRIC_Y2 = H - FOOTER_H - PAD;
    const FABRIC_W  = FABRIC_X2 - FABRIC_X1;
    const FABRIC_H  = FABRIC_Y2 - FABRIC_Y1;

    // Зона стрілки висоти (між тканиною і панеллю)
    const ARROW_ZONE_X1 = FABRIC_X2 + 4;
    const ARROW_ZONE_X2 = FABRIC_X2 + 56;
    const ARROW_X       = FABRIC_X2 + 38;   // лінія стрілки
    const ARROW_LABEL_X = FABRIC_X2 + 20;   // підпис ЗЛІВА від лінії

    // Права панель підписів
    const PANEL_X = FABRIC_X2 + 60;
    const PANEL_W = W - PANEL_X - PAD;

    // ── Кольори ───────────────────────────────────────────────────────
    const CLR = {
        bg:          '#FFFFFF',
        border:      '#AAAAAA',
        curtain:     '#BEBEBE',
        curtainDk:   '#8A8A8A',
        curtainLt:   '#D8D8D8',
        tulleLt:     '#E8E6E2',    // тюль — трохи тепліший, світліший
        tulleDk:     '#B8B4AE',
        tulleMid:    '#D0CEC8',
        foldDark:    'rgba(0,0,0,0.10)',
        foldLight:   'rgba(255,255,255,0.22)',
        rail:        '#555555',
        text:        '#1A1A1A',
        textMute:    '#666666',
        headerBorder:'#CCCCCC',
        sepLine:     '#DDDDDD',
        dimLine:     '#333333',
    };

    // ── Шрифти ────────────────────────────────────────────────────────
    const F = {
        header:  'bold 13px Arial, sans-serif',
        headerR: '12px Arial, sans-serif',
        label:   '10px Arial, sans-serif',
        value:   '13px Arial, sans-serif',
        type:    'bold 20px Arial, sans-serif',
        dimB:    'bold 11px Arial, sans-serif',
        dim:     '10px Arial, sans-serif',
        footer:  '12px Arial, sans-serif',
    };

    // ── HeightPoint → частка висоти де закінчується стрілка ─────────
    // 1.0 = низ тканини, 0.0 = верх тканини
    const HP_RATIO = {
        'від краю до краю':  1.00,
        'до карнізу':        0.04,
        'до гачка':          0.10,
        'до верхньої петлі': 0.18,
        'до тасьми':         0.28,
        'до другої петлі':   0.55,
        'до нижньої петлі':  0.85,
    };

    // ── Допоміжні ─────────────────────────────────────────────────────

    function _wrapText(ctx, text, x, y, maxW, lineH) {
        if (!text || text === '—') { ctx.fillText('—', x, y); return y + lineH; }
        const words = String(text).split(' ');
        let line = '', curY = y;
        words.forEach(w => {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width > maxW && line) {
                ctx.fillText(line, x, curY);
                curY += lineH;
                line = w;
            } else { line = t; }
        });
        if (line) { ctx.fillText(line, x, curY); curY += lineH; }
        return curY;
    }

    // ── Шапка ─────────────────────────────────────────────────────────
    function drawHeader(ctx, data) {
        ctx.fillStyle = CLR.bg;
        ctx.fillRect(0, 0, W, HEADER_H);
        ctx.strokeStyle = CLR.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(W, HEADER_H); ctx.stroke();

        // Ліво: "Прозора фіксована, Sofora Enigma 1:1,5, в край"
        const headerParts = [];
        if (data.tasma)  headerParts.push(data.tasma);
        if (data.zbirka && data.coefficientzbirku)
            headerParts.push(data.zbirka + ' ' + data.coefficientzbirku);
        else if (data.zbirka)
            headerParts.push(data.zbirka);
        if (data.tasmaPlace) headerParts.push(data.tasmaPlace);

        ctx.font = F.header;
        ctx.fillStyle = CLR.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(headerParts.join(', ') || '—', PAD + 4, HEADER_H / 2);

        // Право: дата + клієнт
        const rightText = [data.date, data.contactName].filter(Boolean).join('  ');
        ctx.font = F.headerR;
        ctx.textAlign = 'right';
        ctx.fillText(rightText, W - PAD - 4, HEADER_H / 2);
    }

    // ── Футер ─────────────────────────────────────────────────────────
    function drawFooter(ctx, data) {
        const y = H - FOOTER_H;
        ctx.fillStyle = '#F8F8F8';
        ctx.fillRect(0, y, W, FOOTER_H);
        ctx.strokeStyle = CLR.headerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();

        const midY = y + FOOTER_H / 2;
        ctx.textBaseline = 'middle';

        // Ліво: обробка низу
        ctx.font = F.footer;
        ctx.fillStyle = CLR.textMute;
        ctx.textAlign = 'left';
        ctx.fillText('- обробка низу -', PAD + 4, midY);

        // Тип — по центру зони тканини
        if (data.type) {
            ctx.font = F.type;
            ctx.fillStyle = CLR.text;
            ctx.textAlign = 'center';
            ctx.fillText(data.type, (FABRIC_X1 + FABRIC_X2) / 2, midY);
        }
    }

    // ── Тканина зі складками (штора або тюль) ─────────────────────────
    // Тюль — просто світліший, тепліший варіант тих самих складок (без сітки!)
    function drawFabric(ctx, isTulle) {
        const x = FABRIC_X1, y = FABRIC_Y1, w = FABRIC_W, h = FABRIC_H;

        const dk  = isTulle ? CLR.tulleDk  : CLR.curtainDk;
        const mid = isTulle ? CLR.tulleMid : CLR.curtain;
        const lt  = isTulle ? CLR.tulleLt  : CLR.curtainLt;

        // Базовий градієнт
        const base = ctx.createLinearGradient(x, y, x + w, y);
        base.addColorStop(0,    dk);
        base.addColorStop(0.08, mid);
        base.addColorStop(0.5,  lt);
        base.addColorStop(0.92, mid);
        base.addColorStop(1,    dk);
        ctx.fillStyle = base;
        ctx.fillRect(x, y, w, h);

        // Складки
        const folds   = isTulle ? 9 : 6;
        const foldW   = w / folds;
        const darkStr = isTulle ? 0.08 : 0.10;
        const litStr  = isTulle ? 0.18 : 0.22;

        for (let i = 0; i < folds; i++) {
            const fx = x + i * foldW;

            const sg = ctx.createLinearGradient(fx, 0, fx + foldW * 0.45, 0);
            sg.addColorStop(0, `rgba(0,0,0,${darkStr})`);
            sg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = sg;
            ctx.fillRect(fx, y, foldW * 0.45, h);

            const hg = ctx.createLinearGradient(fx + foldW * 0.55, 0, fx + foldW, 0);
            hg.addColorStop(0, 'rgba(0,0,0,0)');
            hg.addColorStop(1, `rgba(255,255,255,${litStr})`);
            ctx.fillStyle = hg;
            ctx.fillRect(fx + foldW * 0.55, y, foldW * 0.45, h);
        }

        // Для тюлю — легкий overlay щоб виглядало прозоріше
        if (isTulle) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(x, y, w, h);
        }

        // Рамка
        ctx.strokeStyle = CLR.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        // Карниз зверху
        ctx.fillStyle = CLR.rail;
        ctx.fillRect(x - 2, y - 8, w + 4, 5);

        // Гачки
        const hookCount = 8;
        const hookSpacing = w / (hookCount + 1);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.2;
        for (let i = 1; i <= hookCount; i++) {
            const hx = x + hookSpacing * i;
            ctx.beginPath(); ctx.arc(hx, y - 3, 3.5, 0, Math.PI * 2); ctx.stroke();
        }
    }

    // ── Стрілка ширини ────────────────────────────────────────────────
    function drawWidthArrow(ctx, label) {
        const y   = FABRIC_Y1 + FABRIC_H * 0.60;
        const x1  = FABRIC_X1 + 6;
        const x2  = FABRIC_X2 - 6;
        const mid = (x1 + x2) / 2;

        ctx.save();
        ctx.strokeStyle = CLR.dimLine;
        ctx.fillStyle   = CLR.dimLine;
        ctx.lineWidth   = 1.2;

        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();

        // Стрілки
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + 10, y - 4); ctx.lineTo(x1 + 10, y + 4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 10, y - 4); ctx.lineTo(x2 - 10, y + 4); ctx.closePath(); ctx.fill();

        // Тики
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x1, y - 6); ctx.lineTo(x1, y + 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y - 6); ctx.lineTo(x2, y + 6); ctx.stroke();

        // Підпис
        ctx.font = F.dimB;
        const tw = ctx.measureText(label).width + 12;
        ctx.fillStyle = CLR.bg;
        ctx.fillRect(mid - tw / 2, y - 9, tw, 18);
        ctx.fillStyle = CLR.dimLine;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mid, y);

        ctx.restore();
    }

    // ── Стрілка висоти ─────────────────────────────────────────────────
    // Вертикальна між тканиною і панеллю.
    // Підпис — вертикально ЗЛІВА від лінії стрілки (як в SF).
    // Формат підпису: "висота - см,  до тасьми" (вертикально)
    function drawHeightArrow(ctx, heightPoint, heightCm) {
        const ratio = HP_RATIO[heightPoint];
        if (ratio == null) return;

        const yTop = FABRIC_Y1;
        const yBot = FABRIC_Y1 + FABRIC_H * ratio;
        const ax   = ARROW_X;
        const TICK = 5;
        const HEAD = 7;
        const arrowLen = yBot - yTop;

        ctx.save();
        ctx.strokeStyle = CLR.dimLine;
        ctx.fillStyle   = CLR.dimLine;
        ctx.lineWidth   = 1.5;

        // Горизонтальні тики
        ctx.beginPath(); ctx.moveTo(ax - TICK, yTop); ctx.lineTo(ax + TICK, yTop); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax - TICK, yBot); ctx.lineTo(ax + TICK, yBot); ctx.stroke();

        // Вертикальна лінія
        if (arrowLen > HEAD * 2 + 4) {
            ctx.beginPath(); ctx.moveTo(ax, yTop + HEAD); ctx.lineTo(ax, yBot - HEAD); ctx.stroke();
        }

        // Наконечники
        ctx.beginPath(); ctx.moveTo(ax, yTop); ctx.lineTo(ax - 4, yTop + HEAD); ctx.lineTo(ax + 4, yTop + HEAD); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ax, yBot); ctx.lineTo(ax - 4, yBot - HEAD); ctx.lineTo(ax + 4, yBot - HEAD); ctx.closePath(); ctx.fill();

        // Підпис ЗЛІВА від лінії стрілки, вертикально
        if (arrowLen > 28) {
            const midY = (yTop + yBot) / 2;

            // Рядки підпису: перший — "висота - см", другий — "до тасьми"
            const lines = [];
            if (heightCm) lines.push('висота - ' + heightCm + ' см');
            if (heightPoint && heightPoint !== 'від краю до краю') lines.push(heightPoint);

            ctx.save();
            // Поворот вліво (підпис читається знизу вгору — як на кресленнях)
            ctx.translate(ARROW_LABEL_X, midY);
            ctx.rotate(-Math.PI / 2);
            ctx.font = F.dim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lineH = 13;
            const totalH = lines.length * lineH;
            lines.forEach((ln, i) => {
                const ly = -totalH / 2 + i * lineH + lineH / 2;
                // Білий контур для читабельності
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 2.5;
                ctx.strokeText(ln, 0, ly);
                ctx.fillStyle = CLR.dimLine;
                ctx.fillText(ln, 0, ly);
            });
            ctx.restore();
        }

        ctx.restore();
    }

    // ── Права панель: Кімната, Тканина, Коментар ─────────────────────
    // Без Статус, без бейджа з розмірами — тільки 3 поля як в SF
    function drawInfoPanel(ctx, data) {
        const rows = [
            { label: 'Кімната',  value: data.room        || '' },
            { label: 'Тканина',  value: data.curtainName || '' },
            { label: 'Коментар', value: data.description || '' },
        ];

        const availH = FABRIC_H - 8;
        const rowH   = Math.floor(availH / rows.length);
        let   curY   = FABRIC_Y1 + 6;

        rows.forEach((row, i) => {
            // Роздільник
            if (i > 0) {
                ctx.strokeStyle = CLR.sepLine;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(PANEL_X, curY);
                ctx.lineTo(PANEL_X + PANEL_W, curY);
                ctx.stroke();
            }

            ctx.font = F.label;
            ctx.fillStyle = CLR.textMute;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(row.label, PANEL_X, curY + 4);

            ctx.font = F.value;
            ctx.fillStyle = CLR.text;
            ctx.textBaseline = 'top';
            _wrapText(ctx, row.value, PANEL_X, curY + 17, PANEL_W, 16);

            curY += rowH;
        });
    }

    // ── Вертикальний роздільник між тканиною і панеллю ───────────────
    function drawDivider(ctx) {
        ctx.strokeStyle = '#DDDDDD';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ARROW_ZONE_X2, FABRIC_Y1);
        ctx.lineTo(ARROW_ZONE_X2, FABRIC_Y2);
        ctx.stroke();
    }

    // ── Зовнішня рамка ────────────────────────────────────────────────
    function drawOuterBorder(ctx) {
        ctx.strokeStyle = CLR.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(1, 1, W - 2, H - 2);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════

    function draw(canvas, data) {
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        const isTulle = (data.type || '').toLowerCase().includes('тюль') ||
                        (data.type || '').toLowerCase().includes('гардин');

        // 1. Фон
        ctx.fillStyle = CLR.bg;
        ctx.fillRect(0, 0, W, H);

        // 2. Шапка
        drawHeader(ctx, data);

        // 3. Тканина
        drawFabric(ctx, isTulle);

        // 4. Стрілка ширини
        const wLabel = data.curtainWidth
            ? '1 шт., ' + data.curtainWidth + ' см'
            : (data.quantity ? data.quantity + ' шт.' : '');
        if (wLabel) drawWidthArrow(ctx, wLabel);

        // 5. Роздільник між тканиною і панеллю
        drawDivider(ctx);

        // 6. Стрілка висоти
        drawHeightArrow(ctx, data.curtainHeightPoint || '', data.curtainHeight || '');

        // 7. Права панель
        drawInfoPanel(ctx, data);

        // 8. Футер
        drawFooter(ctx, data);

        // 9. Рамка
        drawOuterBorder(ctx);
    }

    function toPNG(canvas)    { return canvas.toDataURL('image/png'); }
    function toBase64(canvas) { return toPNG(canvas).split(',')[1]; }

    function download(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename || 'curtain_' + Date.now() + '.png';
        link.href = toPNG(canvas);
        link.click();
    }

    function prepareData(curtain, meterage, contactName) {
        const curtainWidth = curtain.CarnizWigth__c || curtain.CustomWigth__c || '';

        return {
            curtainWidth,
            curtainHeight:      curtain.Height__c            || '',
            curtainHeightPoint: curtain.HeightPoint__c       || '',
            zbirka:             curtain.zbirkaTasmu__c       || '',
            coefficientzbirku:  curtain.CoefficientZbirki__c || '',
            tasma:              curtain.Tasma__c             || '',
            tasmaPlace:         curtain.TasmaPlace__c        || '',
            curtainName:        curtain.Name__c              || '',
            room:               curtain.Room__c              || '',
            type:               curtain.Type__c              || '',
            curtainNiz:         curtain.ObrobkaNiz__c        || '',
            description:        curtain.Description__c       || '',
            quantity:           curtain.Quantity__c          || 1,
            contactName:        contactName || '',
            date: curtain.CreatedDate
                ? new Date(curtain.CreatedDate).toLocaleDateString('uk-UA')
                : new Date().toLocaleDateString('uk-UA'),
        };
    }

    function setImageUrls() {} // legacy compat

    return { draw, toPNG, toBase64, download, prepareData, setImageUrls };
}());

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CurtainImage;
} else {
    window.CurtainImage = CurtainImage;
}
