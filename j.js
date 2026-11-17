(() => {
    'use strict';

    /* ============ SETTINGS ============ */
    const CONFIG = {
        email: 'ktplay801@gmail.com',   // where mailto messages go
        formEndpoint: ''                // optional: paste a Formspree URL to send without opening an email app
    };

    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    /* ============ MOBILE MENU ============ */
    const navCheck = $('#nav-check');
    const navLinks = $('.nav-links');

    const closeMenu = () => { if (navCheck) navCheck.checked = false; };

    if (navCheck && navLinks) {
        $$('a', navLinks).forEach(link => link.addEventListener('click', closeMenu));

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeMenu();
        });

        document.addEventListener('click', e => {
            if (navCheck.checked && !e.target.closest('.site-header')) closeMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeMenu();
        });
    }

    /* ============ SCROLL SPY (highlight current nav link) ============ */
    const sections = $$('main section[id]');
    const menuLinks = $$('.nav-links a:not(.nav-talk-mobile)');

    const setActive = id => {
        menuLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
    };

    if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(section => spy.observe(section));
    }

    /* ============ HEADER SHADOW + PROGRESS BAR + BACK-TO-TOP ============ */
    const header = $('.site-header');

    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);

    const toTop = document.createElement('button');
    toTop.className = 'to-top';
    toTop.type = 'button';
    toTop.setAttribute('aria-label', 'Back to top');
    toTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    document.body.appendChild(toTop);

    toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let ticking = false;

    const onScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        if (header) header.classList.toggle('scrolled', y > 10);
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        toTop.classList.toggle('show', y > 600);

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    onScroll();

    /* ============ REVEAL ON SCROLL ============ */
    const revealTargets = [
        '.hero-content', '.hero-visual',
        '.about-image-wrapper', '.about-content',
        '.skills-section h2', '.skills-section .container > p', '.skill-card',
        '.hs-head', '.hs-card',
        '.pj-head', '.pj-card', '.pj-more',
        '.sv-head', '.sv-card', '.sv-cta',
        '.contact-info', '.contact-form'
    ];

    const items = $$(revealTargets.join(','));

    if ('IntersectionObserver' in window) {
        const reveal = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.15 });

        items.forEach(el => {
            el.classList.add('reveal');

            // Stagger cards that sit side by side in the same grid
            if (/card/.test(el.className) && el.parentElement) {
                const index = [...el.parentElement.children].indexOf(el);
                if (index > 0) el.style.setProperty('--d', (index * 0.12) + 's');
            }

            reveal.observe(el);
        });
    } else {
        items.forEach(el => el.classList.add('visible'));
    }

    /* ============ CONTACT FORM ============ */
    const form = $('#contact-form');
    const statusEl = $('#form-status');

    if (form) {
        form.noValidate = true; // we show our own messages

        const setStatus = (message, type) => {
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.className = 'form-status' + (type ? ' ' + type : '');
        };

        $$('input, textarea', form).forEach(field => {
            field.addEventListener('input', () => {
                if (field.checkValidity()) field.classList.remove('invalid');
            });
        });

        form.addEventListener('submit', async e => {
            e.preventDefault();

            let valid = true;
            let firstBad = null;

            $$('input, textarea', form).forEach(field => {
                const ok = field.value.trim() !== '' && field.checkValidity();
                field.classList.toggle('invalid', !ok);
                if (!ok) {
                    valid = false;
                    if (!firstBad) firstBad = field;
                }
            });

            if (!valid) {
                setStatus('Please fill in all fields correctly.', 'error');
                if (firstBad) firstBad.focus();
                return;
            }

            const data = Object.fromEntries(new FormData(form));
            const button = $('button[type="submit"]', form);

            // Option A: send through a form service (Formspree, etc.)
            if (CONFIG.formEndpoint) {
                try {
                    if (button) button.disabled = true;
                    setStatus('Sending...', '');

                    const res = await fetch(CONFIG.formEndpoint, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (!res.ok) throw new Error('Request failed');

                    setStatus('Thank you! Your message has been sent.', 'success');
                    form.reset();
                } catch (err) {
                    setStatus('Something went wrong. Please try again or email me directly.', 'error');
                } finally {
                    if (button) button.disabled = false;
                }
                return;
            }

            // Option B: open the visitor's email app with the message filled in
            const subject = encodeURIComponent('Portfolio message from ' + data.name);
            const body = encodeURIComponent(data.message + '\n\n— ' + data.name + ' (' + data.email + ')');

            setStatus('Opening your email app...', 'success');
            window.location.href = 'mailto:' + CONFIG.email + '?subject=' + subject + '&body=' + body;
            form.reset();
        });
    }

    /* ============ FOOTER YEAR ============ */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();