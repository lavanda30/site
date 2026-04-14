/**
 * LAVANDA — Premium Curtain & Home Textile Brand
 * JavaScript v3.2
 * Нотифікації: Telegram @Anna_Shory_bot + EmailJS service_8tvcgm2
 */
document.addEventListener('DOMContentLoaded', () => {
    Preloader.init();
    Navigation.init();
    ScrollAnimations.init();
    Configurator.init();
    Testimonials.init();
    Forms.init();
    SmoothScroll.init();
});

/* ─────────────────────────────────────────────
   PRELOADER
───────────────────────────────────────────── */
const Preloader = {
    init() {
        const preloader = document.getElementById('preloader');
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = 'visible';
            }, 800);
        });
    }
};

/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
const Navigation = {
    nav: null, toggle: null, menu: null,
    init() {
        this.nav    = document.getElementById('nav');
        this.toggle = document.getElementById('navToggle');
        this.menu   = document.getElementById('navMenu');
        this.bindEvents();
    },
    bindEvents() {
        this.toggle.addEventListener('click', () => this.toggleMenu());
        this.menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        document.addEventListener('click', (e) => {
            if (!this.nav.contains(e.target) && this.menu.classList.contains('active')) {
                this.closeMenu();
            }
        });
    },
    toggleMenu() {
        this.toggle.classList.toggle('active');
        this.menu.classList.toggle('active');
        document.body.style.overflow = this.menu.classList.contains('active') ? 'hidden' : '';
    },
    closeMenu() {
        this.toggle.classList.remove('active');
        this.menu.classList.remove('active');
        document.body.style.overflow = '';
    },
    handleScroll() {
        this.nav.classList.toggle('scrolled', window.scrollY > 100);
    }
};

/* ─────────────────────────────────────────────
   SCROLL ANIMATIONS
───────────────────────────────────────────── */
const ScrollAnimations = {
    init() {
        const sections = document.querySelectorAll('section:not(.hero)');
        sections.forEach(section => {
            section.querySelectorAll(
                '.section-header, .categories-grid, .products-grid, ' +
                '.configurator-wrapper, .testimonials-slider, .cta-content'
            ).forEach(child => child.classList.add('reveal'));
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }
};

/* ─────────────────────────────────────────────
   CONFIGURATOR
───────────────────────────────────────────── */
const Configurator = {
    PRICE_MAP: {
        curtain: [500, 600, 700, 900, 1100],
        gardina: [400, 500, 600, 750, 900],
    },
    SEWING:     200,
    TAPE_PRICE:  90,

    GATHER_COEFF: {
        tape15: 1.5,
        tape20: 2.0,
        tape25: 2.5,
        tape30: 3.0,
        eyelet: 2.0,
    },

    colorHexMap: {
        white:'#FFFFFF', milk:'#FAF9F6', ivory:'#FFFFF0', cream:'#FFFDD0',
        beige:'#F5EFE6', sand:'#E8D5B7', wheat:'#F5DEB3', champagne:'#F7E7CE',
        linen:'#E8E0D0', pearl:'#EAE0D5', lavender:'#C8B6E2', powder:'#E8C4C4',
        blush:'#D4A5A5', mint:'#B5D5C5', sage:'#8B9A7D', dustyblue:'#B0C4DE',
        mocha:'#C4A882', taupe:'#B5A89A', stone:'#9E9289', graphite:'#2B2B2B'
    },

    colorNameMap: {
        white:'Білий', milk:'Молочний', ivory:'Слонова кістка', cream:'Кремовий',
        beige:'Бежевий', sand:'Пісочний', wheat:'Пшеничний', champagne:'Шампань',
        linen:'Льон', pearl:'Перлинний', lavender:'Лавандовий', powder:'Пудровий',
        blush:'Рожевий', mint:'М\'ятний', sage:'Шавлія', dustyblue:'Пильний блакит',
        mocha:'Мокко', taupe:'Тауп', stone:'Кам\'яний', graphite:'Графіт'
    },

    init() {
        this.form         = document.getElementById('configForm');
        this.previewFab   = document.querySelector('.preview-fabric');
        this.priceDisplay = document.getElementById('totalPrice');
        this.slider       = document.getElementById('qualitySlider');

        if (!this.form) return;

        this.form.addEventListener('change', () => {
            this.updatePreview();
            this.updatePrice();
            this.updateSliderTrack();
        });

        const widthInput = this.form.querySelector('#width');
        if (widthInput) widthInput.addEventListener('input', () => this.updatePrice());

        if (this.slider) {
            this.slider.addEventListener('input', () => {
                this.updatePrice();
                this.updateSliderTrack();
            });
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.showResultModal();
        });

        this.updatePreview();
        this.updatePrice();
        this.updateSliderTrack();
    },

    getFabric()  { return this.form.querySelector('input[name="fabric"]:checked')?.value || 'curtain'; },
    getStyle()   { return this.form.querySelector('input[name="style"]:checked')?.value || 'tape15'; },
    getColor()   { return this.form.querySelector('input[name="color"]:checked')?.value || 'milk'; },
    getWidth()   { return parseInt(this.form.querySelector('#width')?.value) || 200; },
    getLevel()   { return parseInt(this.slider?.value ?? 2); },
    getCoeff()   { return this.GATHER_COEFF[this.getStyle()] || 1.5; },
    calcMeters() { return (this.getWidth() * this.getCoeff()) / 100 + 0.1; },

    calcTotal() {
        const prices = this.PRICE_MAP[this.getFabric()] || this.PRICE_MAP.curtain;
        return Math.round(this.calcMeters() * (prices[this.getLevel()] + this.SEWING + this.TAPE_PRICE));
    },

    updatePreview() {
        const hex    = this.colorHexMap[this.getColor()] || '#FAF9F6';
        const darker = this.adjustColor(hex, -18);
        if (this.previewFab) {
            this.previewFab.style.background = `linear-gradient(180deg,${hex} 0%,${darker} 100%)`;
        }
    },

    updatePrice() { this.animatePrice(this.calcTotal()); },

    updateSliderTrack() {
        if (!this.slider) return;
        const pct = (this.getLevel() / 4) * 100;
        this.slider.style.background =
            `linear-gradient(to right,var(--color-lavender-dark) 0%,var(--color-lavender-dark) ${pct}%,#e0ddd8 ${pct}%,#e0ddd8 100%)`;
    },

    getStyleLabel() {
        const map = {
            tape15: 'Тасьма × 1.5', tape20: 'Тасьма × 2.0',
            tape25: 'Тасьма × 2.5', tape30: 'Тасьма × 3.0',
            eyelet: 'Люверси × 2.0',
        };
        return map[this.getStyle()] || 'Тасьма × 1.5';
    },

    getFabricLabel() {
        return this.getFabric() === 'gardina' ? 'Гардина / Тюль' : 'Штора';
    },

    showResultModal() {
        const colorVal  = this.getColor();
        const colorName = this.colorNameMap[colorVal] || colorVal;
        const colorHex  = this.colorHexMap[colorVal] || '#FAF9F6';
        const total     = this.calcTotal();
        const meters    = this.calcMeters().toFixed(1);
        const levelLabels = ['Економ', 'Доступно', 'Середнє', 'Краще', 'Преміум'];
        const level = levelLabels[this.getLevel()];
        const needBorder = ['white','milk','ivory','cream'].includes(colorVal);

        const overlay = document.createElement('div');
        overlay.className = 'result-overlay';
        overlay.innerHTML = `
        <div class="result-modal">
            <button class="result-close" id="resultClose">✕</button>
            <div class="result-header">
                <div class="result-logo">LAVANDA</div>
                <p class="result-sub">Ваш попередній розрахунок</p>
            </div>
            <div class="result-params">
                <div class="result-row"><span class="result-label">Тип виробу</span><span class="result-value">${this.getFabricLabel()}</span></div>
                <div class="result-row">
                    <span class="result-label">Колір тканини</span>
                    <span class="result-value result-color-row">
                        <span class="result-color-dot" style="background:${colorHex};${needBorder?'border:1px solid #ddd;':''}"></span>
                        ${colorName}
                    </span>
                </div>
                <div class="result-row"><span class="result-label">Ширина карниза</span><span class="result-value">${this.getWidth()} см</span></div>
                <div class="result-row"><span class="result-label">Збірка тасьми</span><span class="result-value">${this.getStyleLabel()}</span></div>
                <div class="result-row"><span class="result-label">Рівень якості</span><span class="result-value">${level}</span></div>
                <div class="result-row"><span class="result-label">Метраж</span><span class="result-value">~${meters} м</span></div>
            </div>
            <div class="result-price-block">
                <div class="result-price-label">Орієнтовна вартість</div>
                <div class="result-price-value">${total.toLocaleString('uk-UA')} ₴</div>
                <p class="result-price-note">* Точна ціна залежить від детального прорахунку, фінального обсягу та можливих знижок.</p>
            </div>
            <div class="result-form">
                <p class="result-form-title">Залишіть контакт — ми зв'яжемось протягом 2 годин</p>
                <div class="result-form-row">
                    <input type="text" id="resultName" placeholder="Ваше ім'я" class="result-input">
                    <input type="tel" id="resultPhone" placeholder="+380..." class="result-input">
                </div>
                <button class="btn btn-primary btn-full" id="resultSubmitBtn">Замовити безкоштовний вимір</button>
                <div class="result-sent" id="resultSent" style="display:none">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Дякуємо! Менеджер зателефонує вам найближчим часом 📞
                </div>
            </div>
        </div>`;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        overlay.querySelector('#resultClose').addEventListener('click', () => this.closeModal(overlay));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(overlay); });

        overlay.querySelector('#resultSubmitBtn').addEventListener('click', () => {
            const name  = overlay.querySelector('#resultName').value.trim();
            const phone = overlay.querySelector('#resultPhone').value.trim();
            if (!phone) {
                const inp = overlay.querySelector('#resultPhone');
                inp.style.borderColor = '#e53e3e';
                inp.focus();
                return;
            }
            // ── Відправка через Telegram + Email ──
            if (window.LavandaNotify) {
                LavandaNotify.send({
                    type: 'calculator',
                    name, phone,
                    fabric: this.getFabricLabel(),
                    color:  colorName,
                    width:  this.getWidth() + ' см',
                    gather: this.getStyleLabel(),
                    level,
                    meters,
                    total:  total.toLocaleString('uk-UA') + ' ₴',
                });
            }
            overlay.querySelector('#resultSubmitBtn').style.display = 'none';
            overlay.querySelector('#resultSent').style.display = 'flex';
            setTimeout(() => this.closeModal(overlay), 4000);
        });
    },

    closeModal(overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 300);
    },

    animatePrice(newPrice) {
        const current = parseInt(this.priceDisplay.textContent.replace(/[^\d]/g, '')) || 0;
        const diff = newPrice - current;
        let step = 0;
        const steps = 18;
        const run = () => {
            step++;
            this.priceDisplay.textContent = this.formatPrice(Math.round(current + (diff / steps) * step));
            if (step < steps) requestAnimationFrame(run);
            else this.priceDisplay.textContent = this.formatPrice(newPrice);
        };
        requestAnimationFrame(run);
    },

    formatPrice(p) { return p.toLocaleString('uk-UA') + '\u00A0₴'; },

    adjustColor(hex, pct) {
        const c = hex.replace('#', '');
        if (c.length < 6) return hex;
        const n = parseInt(c, 16), a = Math.round(2.55 * pct);
        const R = Math.min(255, Math.max(0, (n >> 16) + a));
        const G = Math.min(255, Math.max(0, ((n >> 8) & 0xFF) + a));
        const B = Math.min(255, Math.max(0, (n & 0xFF) + a));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
};

/* ─────────────────────────────────────────────
   TESTIMONIALS SLIDER
───────────────────────────────────────────── */
const Testimonials = {
    currentIndex: 0,
    init() {
        this.track   = document.querySelector('.testimonial-track');
        this.cards   = document.querySelectorAll('.testimonial-card');
        this.dots    = document.querySelectorAll('.slider-dots .dot');
        this.prevBtn = document.querySelector('.slider-prev');
        this.nextBtn = document.querySelector('.slider-next');
        if (!this.track || !this.cards.length) return;
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
        this.dots.forEach((dot, i) => dot.addEventListener('click', () => this.goTo(i)));
        this.auto = setInterval(() => this.next(), 6000);
        this.track.addEventListener('mouseenter', () => clearInterval(this.auto));
        this.track.addEventListener('mouseleave', () => { this.auto = setInterval(() => this.next(), 6000); });
    },
    goTo(i)  { this.currentIndex = i; this.update(); },
    prev()   { this.goTo(this.currentIndex > 0 ? this.currentIndex - 1 : this.cards.length - 1); },
    next()   { this.goTo(this.currentIndex < this.cards.length - 1 ? this.currentIndex + 1 : 0); },
    update() {
        this.track.style.transform = `translateX(${-this.currentIndex * 100}%)`;
        this.dots.forEach((d, i) => d.classList.toggle('active', i === this.currentIndex));
    }
};

/* ─────────────────────────────────────────────
   FORMS — CTA консультація
───────────────────────────────────────────── */
const Forms = {
    init() {
        const ctaForm = document.getElementById('ctaForm');
        if (ctaForm) {
            ctaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name     = ctaForm.querySelector('input[type="text"]')?.value.trim() || '';
                const phone    = ctaForm.querySelector('input[type="tel"]')?.value.trim() || '';
                const interest = ctaForm.querySelector('select')?.value || '';

                if (!phone) {
                    ctaForm.querySelector('input[type="tel"]').focus();
                    return;
                }

                // ── Відправка через Telegram + Email ──
                if (window.LavandaNotify) {
                    LavandaNotify.send({ type: 'consultation', name, phone, interest });
                }

                this.showSuccess('Дякуємо' + (name ? ', ' + name : '') + '!\n\nМенеджер зателефонує вам найближчим часом.');
                ctaForm.reset();
            });
        }

        document.querySelectorAll('.newsletter-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.showSuccess('Ласкаво просимо до LAVANDA!\nПеревірте вашу поштову скриньку.');
                form.reset();
            });
        });
    },

    showSuccess(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;cursor:pointer;display:flex;align-items:center;justify-content:center;';
        const modal = document.createElement('div');
        modal.style.cssText = 'background:#fff;padding:2.5rem 3rem;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.25);text-align:center;max-width:400px;width:90%;';
        modal.innerHTML =
            '<div style="width:60px;height:60px;background:#C8B6E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">' +
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B2B2B" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>' +
            '<p style="color:#2B2B2B;font-size:0.95rem;line-height:1.75;margin:0;white-space:pre-line;">' + message + '</p>';
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => overlay.remove());
        setTimeout(() => overlay.remove(), 4000);
    }
};

/* ─────────────────────────────────────────────
   SMOOTH SCROLL
───────────────────────────────────────────── */
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - 100,
                    behavior: 'smooth'
                });
            });
        });
    }
};

/* ─────────────────────────────────────────────
   PARALLAX + LAZY LOAD
───────────────────────────────────────────── */
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-content');
    const s    = window.pageYOffset;
    if (hero && s < window.innerHeight) {
        hero.style.transform = `translateY(${s * 0.3}px)`;
        hero.style.opacity   = String(1 - s / (window.innerHeight * 0.8));
    }
}, { passive: true });

document.querySelectorAll('img').forEach(img => {
    img.loading          = 'lazy';
    img.style.opacity    = '0';
    img.style.transition = 'opacity 0.5s ease';
    if (img.complete) img.style.opacity = '1';
    else img.addEventListener('load', () => { img.style.opacity = '1'; });
});
