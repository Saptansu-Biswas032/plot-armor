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
    <title>Plot Armor - INNOHACK 2.0 Presentation</title>
    
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
            <p class="subtitle">INNOHACK 2.0 Official Pitch</p>
        </div>
        <ul class="nav-links">
            <li><a href="#title-page" class="active"><i class="fas fa-home"></i> 1. Title Page</a></li>
            <li><a href="#problem-statement"><i class="fas fa-exclamation-triangle"></i> 2. Problem Statement</a></li>
            <li><a href="#proposed-solution"><i class="fas fa-lightbulb"></i> 3. Proposed Solution</a></li>
            <li><a href="#technical-approach"><i class="fas fa-cogs"></i> 4. Technical Approach</a></li>
            <li><a href="#demo-prototype"><i class="fas fa-desktop"></i> 5. Demo / Prototype</a></li>
            <li><a href="#impact-usecases"><i class="fas fa-chart-line"></i> 6. Impact & Use Cases</a></li>
            <li><a href="#challenges-faced"><i class="fas fa-mountain"></i> 7. Challenges</a></li>
            <li><a href="#future-scope"><i class="fas fa-rocket"></i> 8. Future Scope</a></li>
            <li><a href="#conclusion"><i class="fas fa-check-circle"></i> 9. Conclusion</a></li>
            <li><a href="#acknowledgements"><i class="fas fa-users"></i> 10. Acknowledgements</a></li>
        </ul>
    </nav>

    <main class="main-content">

        <!-- 1. Title Page -->
        <section id="title-page">
            <h2>1. Title Page</h2>
            <div class="interactive-card" style="text-align: center; padding: 4rem 2rem;">
                <h1 style="font-size: 3rem; color: var(--accent-teal); margin-bottom: 1rem;">PLOT-ARMOR</h1>
                <h3 style="color: var(--primary-dark); font-size: 1.5rem; margin-bottom: 2rem;">7-Phase Trust Pipeline for Land Redressal</h3>
                
                <table class="code-table" style="margin: 0 auto; max-width: 600px; font-size: 1.1rem;">
                    <tr>
                        <th>Hackathon Name</th>
                        <td>INNOHACK 2.0</td>
                    </tr>
                    <tr>
                        <th>Track Chosen</th>
                        <td>GovTech & Blockchain (Web3)</td>
                    </tr>
                    <tr>
                        <th>Problem Statement Title</th>
                        <td>Digital Land Record Management and Grievance Redressal System</td>
                    </tr>
                    <tr>
                        <th>Team Name</th>
                        <td><strong>Quintex</strong></td>
                    </tr>
                    <tr>
                        <th>YUKTI INNOVATION ID</th>
                        <td>IR2026-1042201</td>
                    </tr>
                    <tr>
                        <th>Team Members</th>
                        <td>
                            &bull; Saptansu Biswas (26BCV0030)<br>
                            &bull; V.Madhusudhan Karthik (26BEC0047)<br>
                            &bull; S.V.Pravesh (26BYB0041)<br>
                            &bull; P.Adhiskhith (26BCE0744)
                        </td>
                    </tr>
                </table>
            </div>
        </section>

        <!-- 2. Problem Statement -->
        <section id="problem-statement">
            <h2>2. Problem Statement</h2>
            <p><strong>Defining the Problem:</strong> Build a secure and transparent digital platform for land record management and citizen grievance redressal. While India has successfully digitized ~95% of textual land records under the DILRMP, spatial cadastral maps remain severely fragmented. Merely vectorizing historical paper maps freezes century-old colonial measurement errors with high-precision digital coordinates.</p>
            <p><strong>Why it is important:</strong> This "Digitization Paradox" causes widespread F-Line boundary disputes, paralyzes the revenue department, and overwhelms the judicial system with land title conflicts.</p>
            <div class="interactive-card">
                <h4>Supporting Statistics</h4>
                <ul>
                    <li>Over 66% of all civil cases in India are land and property disputes.</li>
                    <li>Millions of ULPINs (Unique Land Parcel Identification Numbers) have conflicting spatial boundary overlaps.</li>
                </ul>
            </div>
        </section>

        <!-- 3. Proposed Solution -->
        <section id="proposed-solution">
            <h2>3. Proposed Solution</h2>
            <p><strong>Plot-Armor</strong> replaces traditional "presumptive title" CRUD databases with a rigorous mathematical <strong>7-Phase Trust Pipeline</strong>.</p>
            <p>It ensures that uncertain heterogeneous field evidence transitions into a verified, immutable legal state through deterministic spatial geometry checks, temporal custody graph AI, and transparent judicial holds.</p>
            
            <div class="interactive-card">
                <h4>What makes it innovative?</h4>
                <ul style="margin-left: 1.5rem;">
                    <li><strong>ISO 19152-1 LADM Schema:</strong> Adheres to international spatial land administration standards.</li>
                    <li><strong>Hardware TEE Inspiration:</strong> Employs software-defined Trusted Execution Environment (TEE) principles: Execution Integrity, Confidentiality, and Isolation.</li>
                    <li><strong>Zero PII on DLT:</strong> Only cryptographically hashed identifiers traverse external layers, fully compliant with the DPDP Act 2023.</li>
                </ul>
            </div>
        </section>

        <!-- 4. Technical Approach -->
        <section id="technical-approach">
            <h2>4. Technical Approach</h2>
            <p><strong>Tech Stack:</strong> Node.js, Express.js, SQLite3 (PostGIS-ready), Turf.js Spatial Engine, Native ES6+ Zero-Build Edge Shell, Blockchain anchoring.</p>
            
            <div class="mermaid">
            graph TD
                A[GNSS Field Verification] --> B(Spatial Engine: Turf.js)
                C[Historical Records] --> D(Temporal Custody Graph AI)
                B --> E{Dispute Evidence & Routing Engine}
                D --> E
                E -->|Clear| F[Tahsildar Revenue Desk]
                E -->|Disputed| G[Tribunal Docket / Judicial Hold]
                F --> H[(Consortium DLT Ledger)]
            </div>
            
            <div class="timeline">
                <div class="timeline-item"><strong>Spatial Data Integrity (SDI) Engine:</strong> Computes Jaccard Indices and Hausdorff Distances.</div>
                <div class="timeline-item"><strong>Dispute Evidence Routing (DERE):</strong> Deterministic routing based on risk scoring.</div>
                <div class="timeline-item"><strong>Consortium Anchoring:</strong> Generates irreversible SHA-256 digests.</div>
            </div>
        </section>

        <!-- 5. Demo / Prototype -->
        <section id="demo-prototype">
            <h2>5. Demo / Prototype</h2>
            <p>Our Unified 4-Persona Workspace provides an accessible, ultra-lightweight interface for all stakeholders directly from the browser (Zero-Build Edge Frontend).</p>
            
            <div class="card-grid">
                <div class="interactive-card">
                    <h4>1. Record Assessment</h4>
                    <p>Ingests ULPINs; builds visual evidence graphs & exports audit PDF reports.</p>
                </div>
                <div class="interactive-card">
                    <h4>2. Field Verification</h4>
                    <p>Cryptographic device signing & live spatial SVG overlay of GNSS captures.</p>
                </div>
                <div class="interactive-card">
                    <h4>3. Revenue Desk</h4>
                    <p>Real-time searchable queue for Tahsildars to certify clear parcels or escalate disputes.</p>
                </div>
                <div class="interactive-card">
                    <h4>4. Tribunal Docket</h4>
                    <p>Judicial hold dashboard; locks disputed titles and dispatches legal summonses.</p>
                </div>
            </div>
            <p><em>(Live deployment of our architecture handles all 4 flows flawlessly!)</em></p>
        </section>

        <!-- 6. Impact & Use Cases -->
        <section id="impact-usecases">
            <h2>6. Impact & Use Cases</h2>
            <div class="card-grid">
                <div class="interactive-card">
                    <h4>Beneficiaries</h4>
                    <ul>
                        <li><strong>Citizens/Landowners:</strong> Faster, transparent dispute resolution without endless court battles.</li>
                        <li><strong>Revenue Officers (Tahsildars):</strong> Automated decision-support and cryptographic non-repudiation.</li>
                        <li><strong>Civil Courts:</strong> Reduced backlog by filtering cases through the algorithmic DERE engine.</li>
                    </ul>
                </div>
                <div class="interactive-card">
                    <h4>Real-World Application & Scaling</h4>
                    <ul>
                        <li>Direct integration with State Revenue Departments (e.g., Dharani, Bhoomi, PM-Kisan).</li>
                        <li>Highly scalable microservices architecture ready to deploy on Kubernetes/Docker Swarm.</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- 7. Challenges Faced -->
        <section id="challenges-faced">
            <h2>7. Challenges Faced & How We Overcame Them</h2>
            <div class="timeline">
                <div class="timeline-item">
                    <strong>Challenge:</strong> Processing historical unstructured spatial errors and overlapping polygons from legacy records.
                    <br><strong>Solution:</strong> Implemented mathematical geometric verification (Turf.js) utilizing Jaccard Indices (IoU) and Hausdorff limits to flag anomalies deterministically.
                </div>
                <div class="timeline-item">
                    <strong>Challenge:</strong> Ensuring DPDP 2023 Compliance while utilizing distributed ledgers.
                    <br><strong>Solution:</strong> Architected a privacy-preserving hashing mechanism where no PII or raw coordinates are ever placed on-chain.
                </div>
                <div class="timeline-item">
                    <strong>Challenge:</strong> Multi-stakeholder UI complexity.
                    <br><strong>Solution:</strong> Built a unified, 4-persona role-based access control (RBAC) portal using a lightweight Vanilla JS edge shell.
                </div>
            </div>
        </section>

        <!-- 8. Future Scope -->
        <section id="future-scope">
            <h2>8. Future Scope</h2>
            <p>Our long-term vision is to harden this MVP into a production-grade National Land Architecture.</p>
            <table class="code-table">
                <tr>
                    <th>Component</th>
                    <th>Future Upgrade</th>
                </tr>
                <tr>
                    <td><strong>Spatial Engine</strong></td>
                    <td>Migration to PostgreSQL 16 + PostGIS cluster for nationwide scale.</td>
                </tr>
                <tr>
                    <td><strong>Silicon Security</strong></td>
                    <td>FIDO2 / WebAuthn standard utilizing Android StrongBox for surveyor GNSS devices.</td>
                </tr>
                <tr>
                    <td><strong>Distributed Ledger</strong></td>
                    <td>Hyperledger Fabric 2.5 channel with RAFT consensus across municipal nodes.</td>
                </tr>
                <tr>
                    <td><strong>Document Ingestion</strong></td>
                    <td>Indic OCR + fine-tuned NER models for automated vernacular deed extraction.</td>
                </tr>
            </table>
        </section>

        <!-- 9. Conclusion -->
        <section id="conclusion">
            <h2>9. Conclusion</h2>
            <div class="interactive-card">
                <h4>Summary</h4>
                <ul style="margin-left: 1.5rem; font-size: 1.1rem; line-height: 1.8;">
                    <li><strong>Mathematical Certainty:</strong> Eliminates arbitrary manual errors through algorithmic geometry and graph AI.</li>
                    <li><strong>Institutional Accountability:</strong> Immutable cryptographic receipts prevent state rollbacks or malicious alterations.</li>
                    <li><strong>Standout Factor:</strong> Moves India’s land administration away from "presumptive title" databases to a verifiable, DPDP-compliant Trust Pipeline.</li>
                </ul>
            </div>
        </section>

        <!-- 10. Acknowledgements -->
        <section id="acknowledgements">
            <h2>10. Acknowledgements</h2>
            <p>We would like to extend our deepest gratitude to:</p>
            <ul>
                <li>The mentors and organizers of <strong>INNOHACK 2.0</strong> for providing an incredible platform to innovate.</li>
                <li>The open-source communities (Node.js, Turf.js) that empowered our spatial engines.</li>
                <li>The respective institutions paving the way for Digital India, serving as our architectural inspiration.</li>
            </ul>
            <div style="text-align: center; margin-top: 3rem; opacity: 0.7;">
                <p><em>Built with ❤️ by Team Quintex</em></p>
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

console.log('✅ Success! The Plot Armor INNOHACK 2.0 presentation has been regenerated.');
console.log('📍 Location: docs/presentation/index.html');
console.log('🌐 Open this file in your browser to view the interactive presentation.');