const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'docs', 'presentation');
const cssDir = path.join(baseDir, 'css');
const jsDir = path.join(baseDir, 'js');

// 1. Create directories safely
[baseDir, cssDir, jsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 2. HTML Content (Main Structure & Sections)
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plot Armor - Enterprise Architecture</title>
    
    <!-- KaTeX for Math Rendering -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    
    <!-- Fonts & Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <nav class="sidebar">
        <div class="sidebar-header">
            <h1>Plot Armor</h1>
            <p class="subtitle">Architectural Dossier</p>
        </div>
        <ul class="nav-links">
            <li><a href="#first-principles" class="active"><i class="fas fa-cube"></i> First Principles</a></li>
            <li><a href="#architecture"><i class="fas fa-network-wired"></i> Architecture</a></li>
            <li><a href="#workflow"><i class="fas fa-tasks"></i> Procedural Workflow</a></li>
            <li><a href="#tee"><i class="fas fa-shield-alt"></i> TEE Principles</a></li>
            <li><a href="#webdev"><i class="fas fa-laptop-code"></i> Web Dev Principles</a></li>
            <li><a href="#math"><i class="fas fa-subscript"></i> Math Engines</a></li>
            <li><a href="#codebase"><i class="fas fa-folder-open"></i> Codebase Inventory</a></li>
            <li><a href="#scalability"><i class="fas fa-rocket"></i> Scalability Roadmap</a></li>
        </ul>
    </nav>

    <main class="main-content">
        <section id="first-principles" class="fade-in">
            <h2>1. First Principles</h2>
            <div class="card-grid">
                <div class="interactive-card">
                    <h4>Decentralized Trust</h4>
                    <p>Eliminating single points of failure in land registry through verifiable credentials and transparent logging.</p>
                </div>
                <div class="interactive-card">
                    <h4>Spatial Integrity</h4>
                    <p>Ensuring absolute geometric consensus. A plot cannot exist in two places, nor overlap without triggering the DERE matrix.</p>
                </div>
                <div class="interactive-card">
                    <h4>Immutable Anchoring</h4>
                    <p>Finalizing verified land boundaries using an append-only state, aligned with ISO 19152-1 LADM standards.</p>
                </div>
            </div>
        </section>

        <section id="architecture" class="fade-in">
            <h2>2. System Architecture</h2>
            <p>The system leverages a decoupled, stateless backend communicating with a highly responsive, zero-build frontend.</p>
            <div class="mermaid">
                graph TD
                    A[Client: Vanilla JS / HTML] -->|REST API| B(Node.js Express Backend)
                    B --> C{Engines}
                    C -->|Turf.js| D[Spatial Engine]
                    C --> E[DERE Engine]
                    C --> F[Graph Engine]
                    B --> G[(LADM SQLite Database)]
                    style A fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
                    style B fill:#1e293b,stroke:#14b8a6,stroke-width:2px,color:#fff
                    style G fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff
            </div>
        </section>

        <section id="workflow" class="fade-in">
            <h2>3. Procedural Workflow</h2>
            <p>The 7-Phase Trust Pipeline establishes a strict state machine for land verification:</p>
            <div class="timeline">
                <div class="timeline-item"><strong>1. Observe:</strong> Ingest cadastral and GNSS data boundaries.</div>
                <div class="timeline-item"><strong>2. Validate:</strong> Check topological constraints and schema limits.</div>
                <div class="timeline-item"><strong>3. Compare:</strong> Execute spatial diffing (IoU, Hausdorff).</div>
                <div class="timeline-item"><strong>4. Classify:</strong> Assign DERE risk vectors based on threshold breaches.</div>
                <div class="timeline-item"><strong>5. Review:</strong> Persona-based human-in-the-loop validation via UI.</div>
                <div class="timeline-item"><strong>6. Decide:</strong> Tribunal/Revenue officer consensus application.</div>
                <div class="timeline-item"><strong>7. Anchor:</strong> Commit to LADM compliant ledger.</div>
            </div>
        </section>

        <section id="tee" class="fade-in">
            <h2>4. TEE Principles Implemented</h2>
            <p>Trusted Execution Environment (TEE) philosophies are applied at the software level to guarantee computational integrity:</p>
            <ul>
                <li><strong>Isolated Computation:</strong> Spatial engines run in sandboxed Node instances, ensuring boundary calculations cannot be tampered with by external intercepts.</li>
                <li><strong>Deterministic Outcomes:</strong> Given the same GeoJSON inputs, the Spatial Engine will always produce the exact same IoU and Risk Score algorithms.</li>
                <li><strong>Audit Trails:</strong> Every state transition in the 7-phase pipeline logs a cryptographic trace of the payload.</li>
            </ul>
        </section>

        <section id="webdev" class="fade-in">
            <h2>5. Web Development Principles</h2>
            <div class="interactive-card">
                <h4>Zero-Build Philosophy</h4>
                <p>The frontend completely eschews complex bundlers (Webpack, Vite) in favor of native ES modules and vanilla DOM APIs. This guarantees maximum longevity, blistering fast load times, and zero dependency rot over the lifespan of municipal adoption.</p>
            </div>
            <div class="interactive-card">
                <h4>Persona-Driven UI</h4>
                <p>The UI dynamically morphs based on the active persona (Revenue Officer, Tribunal, Surveyor), enabling targeted features like Legal Summons Generation and GNSS selections without loading entirely separate dashboard applications.</p>
            </div>
        </section>

        <section id="math" class="fade-in">
            <h2>6. Mathematics Behind the Engines</h2>
            <p>Plot Armor utilizes strict geometric mathematics to resolve boundary disputes dynamically.</p>
            
            <div class="math-card">
                <h3>Intersection over Union (IoU)</h3>
                <p>Calculates the exact overlap fraction between the claimed boundary and the anchored boundary.</p>
                <div class="math-equation">
                    $$ \\text{IoU} = \\frac{\\text{Area}(A \\cap B)}{\\text{Area}(A \\cup B)} $$
                </div>
            </div>

            <div class="math-card">
                <h3>Risk Score Calculation</h3>
                <p>The risk of a dispute is inversely proportional to the IoU.</p>
                <div class="math-equation">
                    $$ \\text{Risk Score} = (1 - \\text{IoU}) \\times 100 $$
                </div>
            </div>

            <div class="math-card">
                <h3>Centroid Shift Vector</h3>
                <p>Measures the Euclidean distance between the geographic centers of two plots to detect boundary drifts.</p>
                <div class="math-equation">
                    $$ \\Delta C = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} $$
                </div>
            </div>
        </section>

        <section id="codebase" class="fade-in">
            <h2>7. Codebase Inventory</h2>
            <table class="code-table">
                <thead>
                    <tr>
                        <th>File / Directory</th>
                        <th>Purpose & Phase Support</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>backend/src/engines/spatialEngine.js</code></td>
                        <td>Calculates IoU, Hausdorff distance, and polygon intersections. (Phase 3: Compare)</td>
                    </tr>
                    <tr>
                        <td><code>backend/src/engines/dereEngine.js</code></td>
                        <td>Classifies disputes into the DERE matrix based on spatial outputs. (Phase 4: Classify)</td>
                    </tr>
                    <tr>
                        <td><code>backend/src/db/database.js</code></td>
                        <td>Maintains the ISO 19152-1 LADM SQLite schema and synthetic ULPINs. (Phase 7: Anchor)</td>
                    </tr>
                    <tr>
                        <td><code>clients/unified-portal/app.js</code></td>
                        <td>Handles SVG rendering, persona switching, and PDF generation. (Phase 5: Review)</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section id="scalability" class="fade-in">
            <h2>8. Scalability Roadmap</h2>
            <p>To scale from regional pilot to a national infrastructure, the following architectural upgrades are mapped out:</p>
            <div class="timeline">
                <div class="timeline-item"><strong>Database Migration:</strong> Transition from SQLite to PostgreSQL with PostGIS extensions for native spatial indexing (R-Trees) and concurrent high-volume reads.</div>
                <div class="timeline-item"><strong>Compute Offloading:</strong> Rewrite the Spatial Engine in Rust via WebAssembly (Wasm) to handle millions of overlapping polygons per second seamlessly.</div>
                <div class="timeline-item"><strong>Distributed Consensus:</strong> Implement a Hyperledger Fabric layer for the "Anchor" phase to ensure state-level immutability across disparate municipal nodes.</div>
            </div>
        </section>
    </main>

    <!-- External Script Loaders -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.4.0/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    
    <!-- Custom Logic -->
    <script src="js/main.js"></script>
</body>
</html>`;

// 3. CSS Content (Plot Armor Theme)
const styleCss = `:root {
    --primary-dark: #0f172a;
    --primary-light: #1e293b;
    --accent-teal: #14b8a6;
    --accent-amber: #f59e0b;
    --text-main: #334155;
    --bg-main: #f8fafc;
    --bg-surface: #ffffff;
    --border-color: #e2e8f0;
}

* { margin: 0; padding: 0; box-sizing: border-box; scroll-behavior: smooth; }

body {
    font-family: 'Inter', sans-serif;
    color: var(--text-main); background-color: var(--bg-main);
    line-height: 1.7; display: flex;
}

/* Sidebar Navigation */
.sidebar {
    position: fixed; width: 280px; height: 100vh;
    background-color: var(--primary-dark); color: white;
    padding: 2.5rem 1.5rem; overflow-y: auto;
    box-shadow: 4px 0 15px rgba(0,0,0,0.1); z-index: 100;
}
.sidebar-header { border-bottom: 1px solid #334155; margin-bottom: 1.5rem; padding-bottom: 1rem; }
.sidebar h1 { color: var(--accent-teal); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 1.5px; }
.subtitle { color: #94a3b8; font-size: 0.85rem; margin-top: 0.3rem;}

.nav-links { list-style: none; }
.nav-links li { margin-bottom: 0.5rem; }
.nav-links a {
    color: #cbd5e1; text-decoration: none; display: flex; align-items: center;
    padding: 0.8rem 1rem; border-radius: 6px; transition: all 0.2s ease;
    font-size: 0.95rem; font-weight: 600;
}
.nav-links a i { margin-right: 12px; width: 20px; text-align: center; color: var(--accent-amber); }
.nav-links a:hover, .nav-links a.active {
    background-color: var(--primary-light); color: white; border-left: 4px solid var(--accent-teal);
}

/* Main Layout */
.main-content {
    margin-left: 280px; padding: 4rem 5rem; width: calc(100% - 280px); max-width: 1200px;
}

section {
    background: var(--bg-surface); padding: 3rem; border-radius: 12px;
    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); margin-bottom: 4rem;
    opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease;
}
section.visible { opacity: 1; transform: translateY(0); }

h2 {
    font-size: 2.2rem; color: var(--primary-dark); margin-bottom: 2rem;
    padding-bottom: 1rem; border-bottom: 2px solid var(--border-color); position: relative;
}
h2::after {
    content: ''; position: absolute; bottom: -2px; left: 0; width: 80px;
    height: 3px; background-color: var(--accent-teal);
}

p { margin-bottom: 1.25rem; font-size: 1.05rem; }

/* Grid Cards & Math Containers */
.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.interactive-card, .math-card {
    background: var(--bg-main); border: 1px solid var(--border-color);
    border-radius: 8px; padding: 1.8rem; margin-bottom: 1.5rem;
    border-left: 4px solid var(--accent-amber); transition: transform 0.2s ease, box-shadow 0.2s;
}
.interactive-card:hover, .math-card:hover {
    transform: translateY(-4px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.1);
}
.interactive-card h4, .math-card h3 { color: var(--primary-dark); margin-bottom: 0.8rem; font-size: 1.2rem;}

/* Timelines */
.timeline { border-left: 3px solid var(--accent-teal); margin-left: 1rem; padding-left: 1.5rem; margin-top: 2rem;}
.timeline-item {
    position: relative; margin-bottom: 1.5rem; padding: 1rem 1.5rem; background: var(--bg-main);
    border-radius: 6px; border: 1px solid var(--border-color);
}
.timeline-item::before {
    content: ''; position: absolute; left: -1.5rem; top: 1.2rem; transform: translateX(-50%);
    width: 14px; height: 14px; border-radius: 50%; background: var(--accent-teal);
    border: 3px solid white; box-shadow: 0 0 0 2px var(--border-color);
}

/* Tables */
.code-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.95rem;}
.code-table th, .code-table td { padding: 1rem; border: 1px solid var(--border-color); text-align: left; }
.code-table th { background: var(--primary-light); color: white; }
.code-table tr:nth-child(even) { background: var(--bg-main); }
.code-table code { background: #e2e8f0; padding: 0.3rem 0.5rem; border-radius: 4px; color: #b91c1c; font-family: monospace; font-weight: bold;}

/* Equations & Diagrams */
.math-equation { text-align: center; font-size: 1.4rem; margin: 1.5rem 0; padding: 1.5rem; background: white; border-radius: 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
.mermaid {
    background: white; padding: 2rem; border-radius: 8px; display: flex;
    justify-content: center; margin: 2rem 0; border: 1px solid var(--border-color);
}

/* Responsive Rules */
@media (max-width: 900px) {
    .sidebar { width: 240px; }
    .main-content { margin-left: 240px; width: calc(100% - 240px); padding: 2rem; }
}
@media (max-width: 768px) {
    body { flex-direction: column; }
    .sidebar { width: 100%; height: auto; position: relative; padding: 1rem; }
    .main-content { margin-left: 0; width: 100%; padding: 1.5rem; }
}
`;

// 4. JavaScript Logic (Scroll Spy & Initializations)
const scriptJs = `document.addEventListener("DOMContentLoaded", () => {
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
`;

// 5. Write Files
fs.writeFileSync(path.join(baseDir, 'index.html'), indexHtml);
fs.writeFileSync(path.join(cssDir, 'style.css'), styleCss);
fs.writeFileSync(path.join(jsDir, 'main.js'), scriptJs);

console.log('✅ Success! The Plot Armor architectural presentation has been generated.');
console.log('📂 Location: docs/presentation/index.html');
console.log('🌐 Open this file in your browser to view the interactive documentation.');