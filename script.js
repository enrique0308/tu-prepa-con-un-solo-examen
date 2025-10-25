document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-contacto');
    const mensajeExito = document.getElementById('mensaje-exito');

    // Configuración del slider de testimonios (responsive: 1 por vista en móvil, 2 en desktop)
    function setupTestimoniosSlider() {
        const container = document.querySelector('.testimonios-container');
        const parent = document.querySelector('.testimonios-slider');
        const slides = Array.from(document.querySelectorAll('.testimonio.video-card'));
        const dotsContainer = document.querySelector('.slider-dots');
        if (!container || !parent || slides.length === 0) return;

        let slidesPerView = window.innerWidth <= 768 ? 1 : 2;
        let totalSlides = slides.length;
        let totalGroups = Math.max(1, Math.ceil(totalSlides / slidesPerView));
        let currentGroup = 0;
        let dots = [];

        function buildDots() {
            // limpiar
            dotsContainer.innerHTML = '';
            dots = [];
            for (let i = 0; i < totalGroups; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot' + (i === 0 ? ' active' : '');
                dot.style.cursor = 'pointer';
                dot.addEventListener('click', () => updateSlider(i));
                dotsContainer.appendChild(dot);
                dots.push(dot);
            }
        }

        function updateSlider(newGroup, animated = true) {
            currentGroup = Math.min(Math.max(newGroup, 0), totalGroups - 1);

            const offsetPx = currentGroup * parent.clientWidth;
            if (!animated) container.style.transition = 'none'; else container.style.transition = '';
            container.style.transform = `translateX(-${offsetPx}px)`;

            // actualizar dots
            dots.forEach((d, i) => d.classList.toggle('active', i === currentGroup));

            // Pausar videos y ajustar visibilidad
            slides.forEach((slide, index) => {
                const video = slide.querySelector('video');
                if (video) {
                    video.pause();
                    try { video.currentTime = 0; } catch (e) {}
                }

                const slideGroup = Math.floor(index / slidesPerView);
                const isVisible = slideGroup === currentGroup;
                slide.style.opacity = isVisible ? '1' : '0.35';
                slide.style.pointerEvents = isVisible ? 'auto' : 'none';
            });
        }

        function recalc() {
            slidesPerView = window.innerWidth <= 768 ? 1 : 2;
            totalSlides = slides.length;
            totalGroups = Math.max(1, Math.ceil(totalSlides / slidesPerView));
            buildDots();
            // Ajustar ancho de cada slide para que encajen en el contenedor visible
            const slideWidth = Math.floor(parent.clientWidth / slidesPerView);
            slides.forEach(slide => {
                slide.style.width = slideWidth + 'px';
            });
            // Asegurar que currentGroup esté dentro de rango
            if (currentGroup >= totalGroups) currentGroup = totalGroups - 1;
            // Forzar reflow y actualizar sin animación
            updateSlider(currentGroup, false);
        }

        // Inicialización
        buildDots();
        // Ajustar ancho inicial de slides
        const initialSlideWidth = Math.floor(parent.clientWidth / slidesPerView);
        slides.forEach(slide => {
            slide.style.width = initialSlideWidth + 'px';
        });
        // Forzar tamaño/visibilidad inicial
        updateSlider(0, false);

        // Reconstruir al redimensionar (debounce simple)
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(recalc, 120);
        });
    }

    // Inicializar galerías automáticas
    function initImageGalleries() {
        const galleries = document.querySelectorAll('.image-gallery[data-images]');
        galleries.forEach(gallery => {
            // Limpiar la galería primero
            gallery.innerHTML = '';
            
            const imagesAttr = gallery.getAttribute('data-images') || '';
            const urls = imagesAttr.split(',').map(u => u.trim()).filter(Boolean);
            if (urls.length === 0) return;

            // Crear elementos <img>
            urls.forEach((url, i) => {
                const img = document.createElement('img');
                img.src = url;
                img.alt = gallery.getAttribute('aria-label') || `Galería imagen ${i+1}`;
                if (i === 0) img.classList.add('active');
                gallery.appendChild(img);
            });

            let current = 0;
            const imgs = gallery.querySelectorAll('img');
            const delay = parseInt(gallery.getAttribute('data-interval')) || 4000;
            let timer = null;

            const show = (index) => {
                imgs.forEach((img, i) => {
                    img.classList.toggle('active', i === index);
                });
                current = index;
            };

            const next = () => {
                show((current + 1) % imgs.length);
            };

            const start = () => {
                if (timer) return;
                timer = setInterval(next, delay);
                gallery.classList.remove('paused');
            };

            const stop = () => {
                if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
                gallery.classList.add('paused');
            };

            // Eventos de pausa
            gallery.addEventListener('mouseenter', stop);
            gallery.addEventListener('mouseleave', start);
            gallery.addEventListener('focusin', stop);
            gallery.addEventListener('focusout', start);

            // Iniciar rotación si hay más de una imagen
            if (imgs.length > 1) start();
        });
    }

    // Control de reproducción de videos
    function setupVideoPauseBehavior() {
        const videos = Array.from(document.querySelectorAll('.testimonios video'));
        if (videos.length === 0) return;

        videos.forEach(v => {
            v.addEventListener('play', () => {
                videos.forEach(other => {
                    if (other !== v && !other.paused) {
                        other.pause();
                    }
                });
            });
            v.addEventListener('ended', () => {
                try { v.currentTime = 0; } catch(e) {}
            });
        });
    }

    // Generación de posters para videos
    function generatePostersFromFirstFrame() {
        const videos = Array.from(document.querySelectorAll('.testimonios video'));
        if (!videos.length) return;

        const processNext = (index) => {
            if (index >= videos.length) return;
            const v = videos[index];

            if (v.getAttribute('poster')) {
                processNext(index + 1);
                return;
            }

            try { v.preload = 'metadata'; } catch (e) {}

            const timeout = setTimeout(() => {
                processNext(index + 1);
            }, 3000);

            const onMeta = () => {
                const trySeek = () => {
                    try {
                        v.currentTime = Math.min(0.05, v.duration || 0.05);
                    } catch (err) {
                        v.currentTime = 0;
                    }
                };

                const onSeeked = () => {
                    try {
                        const w = v.videoWidth || 480;
                        const h = v.videoHeight || 864;
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(v, 0, 0, w, h);
                        const dataUrl = canvas.toDataURL('image/jpeg');
                        v.setAttribute('poster', dataUrl);
                    } catch (err) {}
                    cleanup();
                    processNext(index + 1);
                };

                const onError = () => {
                    cleanup();
                    processNext(index + 1);
                };

                function cleanup() {
                    clearTimeout(timeout);
                    v.removeEventListener('seeked', onSeeked);
                    v.removeEventListener('error', onError);
                    v.removeEventListener('loadedmetadata', onMeta);
                }

                v.addEventListener('seeked', onSeeked, { once: true });
                v.addEventListener('error', onError, { once: true });
                trySeek();
            };

            if (v.readyState >= 1) {
                onMeta();
            } else {
                v.addEventListener('loadedmetadata', onMeta, { once: true });
                try { v.load(); } catch (e) {}
            }
        };

        processNext(0);
    }

    // Menú responsive: drawer lateral para móvil
    const navToggle = document.querySelector('.nav-toggle');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    function openMenu() { document.body.classList.add('menu-open'); }
    function closeMenu() { document.body.classList.remove('menu-open'); }

    navToggle.addEventListener('click', () => {
        if (document.body.classList.contains('menu-open')) closeMenu(); else openMenu();
    });

    // Cerrar al hacer clic en overlay
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMenu);
    }

    // Cerrar al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // Cerrar al hacer clic en cualquier enlace del menú
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            const offset = 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });

    // Estilo del menú al hacer scroll
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.nav-menu');
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(255, 255, 255, 0.98)';
            nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.95)';
            nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }
    });

    // Inicializar todas las funcionalidades
    initImageGalleries();
    setupVideoPauseBehavior();
    setTimeout(generatePostersFromFirstFrame, 500);
    setupTestimoniosSlider();
});