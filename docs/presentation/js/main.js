document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Mermaid Diagrams
    mermaid.initialize({ 
        startOnLoad: true,
        theme: 'base',
        themeVariables: {
            primaryColor: '#f8fafc',
            primaryTextColor: '#334155',
            primaryBorderColor: '#14b8a6',
            lineColor: '#1e293b',
            secondaryColor: '#f59e0b',
            tertiaryColor: '#fff'
        }
    });

    // 2. Initialize KaTeX (Math Equations)
    renderMathInElement(document.body, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
        ],
        throwOnError: false
    });

    // 3. Scroll Intersection Animations & Scroll-Spy
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    const observerOptions = { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 };
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Trigger Fade In
                entry.target.classList.add('visible');
                
                // Update Sidebar highlight
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
        // Fallback catch to make sure elements near top render immediately
        if(section.getBoundingClientRect().top < window.innerHeight) {
             section.classList.add('visible');
        }
    });
});
