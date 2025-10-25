document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-contacto');
    const mensajeExito = document.getElementById('mensaje-exito');

    // Configuración del slider de testimonios
    function setupTestimoniosSlider() {
        const container = document.querySelector('.testimonios-container');
        const dots = document.querySelectorAll('.dot');
        const slides = document.querySelectorAll('.testimonio.video-card');
        const totalSlides = slides.length;
        let currentIndex = 0;

        function updateSlider(newIndex) {
            // Asegurar que el índice esté dentro de los límites
            currentIndex = (newIndex + totalSlides) % totalSlides;
            
            // Calcular qué grupo de slides mostrar (2 por página)
            const currentGroup = Math.floor(currentIndex / 2);
            const offset = -currentGroup * 100;
            
            // Actualizar la posición del contenedor
            container.style.transform = `translateX(${offset}%)`;
            
            // Actualizar los dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentGroup);
            });

            // Pausar todos los videos
            slides.forEach(slide => {
                const video = slide.querySelector('video');
                if (video) {
                    video.pause();
                    try { video.currentTime = 0; } catch(e) {}
                }
            });
        }

        // Configurar los dots de navegación
        dots.forEach((dot, index) => {
            dot.style.cursor = 'pointer';
            dot.addEventListener('click', () => {
                updateSlider(index * 2);
            });
        });

        // Inicializar el slider
        updateSlider(0);
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

    // Menú responsive
    document.querySelector('.nav-toggle').addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.remove('active');
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