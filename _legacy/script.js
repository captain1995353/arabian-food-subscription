/* ===================================
   ARABIANA – Restaurant Website JS
   Indian • Arabian • Korean Fusion
   ================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Mark that JS is ready — enables scroll animations in CSS
    document.documentElement.classList.add('js-ready');

    // ===== PRELOADER =====
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 2000);
    });

    // Fallback: hide preloader after 3.5s regardless
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 3500);


    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');

    function handleScroll() {
        const scrollY = window.scrollY;

        // Navbar background
        if (scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Back to top button
        if (scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // Active nav link based on section
        updateActiveNavLink();
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check


    // ===== ACTIVE NAV LINK TRACKING =====
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    function updateActiveNavLink() {
        const scrollY = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }


    // ===== HAMBURGER MENU =====
    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('nav-links');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinksContainer.classList.toggle('mobile-open');
        document.body.style.overflow = navLinksContainer.classList.contains('mobile-open') ? 'hidden' : '';
    });

    // Close mobile menu when a link is clicked
    navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinksContainer.classList.remove('mobile-open');
            document.body.style.overflow = '';
        });
    });


    // ===== BACK TO TOP =====
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // ===== HERO PARTICLES =====
    const particlesContainer = document.getElementById('hero-particles');

    function createParticles() {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('hero-particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (4 + Math.random() * 4) + 's';
            particle.style.width = (2 + Math.random() * 3) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    createParticles();


    // ===== COUNT-UP ANIMATION FOR STATS =====
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    let statsCounted = false;

    function animateStats() {
        if (statsCounted) return;

        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const duration = 2000;
            const start = performance.now();

            function updateCount(timestamp) {
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);

                stat.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target;
                }
            }

            requestAnimationFrame(updateCount);
        });

        statsCounted = true;
    }

    // Trigger stats when hero-stats is in view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }


    // ===== SCROLL ANIMATIONS (Intersection Observer) =====
    const animatedElements = document.querySelectorAll('[data-animate]');

    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, parseInt(delay));
                animateObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.02,
        rootMargin: '0px 0px 0px 0px'
    });

    animatedElements.forEach(el => {
        animateObserver.observe(el);
    });

    // Fallback: reveal any elements already in viewport on load
    function revealVisibleElements() {
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const delay = el.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    el.classList.add('visible');
                }, parseInt(delay));
            }
        });
    }

    // Run fallback after a short delay to catch anything missed
    setTimeout(revealVisibleElements, 300);
    window.addEventListener('load', () => {
        setTimeout(revealVisibleElements, 500);
    });

    // Also reveal on scroll (throttled) as an extra fallback
    let scrollRevealTimer;
    window.addEventListener('scroll', () => {
        if (scrollRevealTimer) return;
        scrollRevealTimer = setTimeout(() => {
            revealVisibleElements();
            scrollRevealTimer = null;
        }, 100);
    });


    // ===== MENU FILTER TABS =====
    const menuTabs = document.querySelectorAll('.menu-tab');
    const menuItems = document.querySelectorAll('.menu-item');

    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            menuTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');

            menuItems.forEach(item => {
                if (filter === 'all') {
                    item.classList.remove('hidden');
                    item.style.animation = 'menuItemIn 0.4s ease forwards';
                } else {
                    if (item.getAttribute('data-category') === filter) {
                        item.classList.remove('hidden');
                        item.style.animation = 'menuItemIn 0.4s ease forwards';
                    } else {
                        item.classList.add('hidden');
                    }
                }
            });
        });
    });

    // Add menu item animation keyframes
    const menuStyle = document.createElement('style');
    menuStyle.textContent = `
        @keyframes menuItemIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(menuStyle);


    // ===== TESTIMONIAL SLIDER =====
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const testimonialDots = document.querySelectorAll('.dot');
    let currentTestimonial = 0;
    let testimonialInterval;

    function showTestimonial(index) {
        testimonialCards.forEach(card => card.classList.remove('active'));
        testimonialDots.forEach(dot => dot.classList.remove('active'));

        testimonialCards[index].classList.add('active');
        testimonialDots[index].classList.add('active');
        currentTestimonial = index;
    }

    function nextTestimonial() {
        const next = (currentTestimonial + 1) % testimonialCards.length;
        showTestimonial(next);
    }

    // Auto-rotate testimonials
    function startTestimonialAutoplay() {
        testimonialInterval = setInterval(nextTestimonial, 5000);
    }

    startTestimonialAutoplay();

    // Dot click handlers
    testimonialDots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(testimonialInterval);
            showTestimonial(parseInt(dot.getAttribute('data-index')));
            startTestimonialAutoplay();
        });
    });


    // ===== RESERVATION FORM =====
    const reservationForm = document.getElementById('reservation-form');
    const modalOverlay = document.getElementById('modal-overlay');

    if (reservationForm) {
        // Set minimum date to today
        const dateInput = document.getElementById('res-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Simple form validation visual feedback
            const inputs = reservationForm.querySelectorAll('input[required], select[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'var(--color-spice)';
                    setTimeout(() => {
                        input.style.borderColor = '';
                    }, 2000);
                }
            });

            if (isValid) {
                // Show success modal
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Reset form
                reservationForm.reset();
            }
        });
    }


    // ===== MODAL CLOSE =====
    window.closeModal = function() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close modal on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }


    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // After scroll completes, force-reveal animated elements in the target section
                setTimeout(() => {
                    target.querySelectorAll('[data-animate]').forEach(el => {
                        const delay = el.getAttribute('data-delay') || 0;
                        setTimeout(() => {
                            el.classList.add('visible');
                        }, parseInt(delay));
                    });
                    // Also reveal any currently visible elements (in case scroll triggered others)
                    revealVisibleElements();
                }, 600);
            }
        });
    });


    // ===== PARALLAX EFFECT ON HERO =====
    const heroSection = document.querySelector('.hero-section');

    window.addEventListener('scroll', () => {
        if (window.scrollY < window.innerHeight) {
            const speed = 0.3;
            heroSection.style.backgroundPositionY = (window.scrollY * speed) + 'px';
        }
    });


    // ===== GALLERY HOVER TILT EFFECT =====
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const tiltX = (y - centerY) / centerY * 3;
            const tiltY = (centerX - x) / centerX * 3;

            item.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });


    // ===== SPECIALTY CARDS STAGGER ANIMATION =====
    const specialtyCards = document.querySelectorAll('.specialty-card');

    specialtyCards.forEach((card, index) => {
        card.style.transitionDelay = (index * 0.15) + 's';
    });


    // ===== KEYBOARD NAVIGATION ENHANCEMENT =====
    document.querySelectorAll('.btn, .menu-tab, .social-link, .dot').forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });

});
