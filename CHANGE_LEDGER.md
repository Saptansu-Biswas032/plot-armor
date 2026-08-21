# 🛡️ PLOT-ARMOR · Change Ledger & Audit Trail

> **Purpose**: This ledger maintains an immutable, chronological record of every modification, feature addition, architectural adjustment, and bug fix requested by the user.
>
> **Tracking Schema**:
> - **Entry ID & Timestamp**: Unique chronological identifier.
> - **User Request / Intent**: Verbatim or summarized user requirement.
> - **What Was Added / Changed**: Clear itemized list of features, visual components, or API behaviors.
> - **How It Was Implemented**: Technical design, algorithms, libraries used, mathematical formulas, and data flow.
> - **Where It Was Added**: Precise file paths, functions, DOM elements, and CSS selectors.

---

## 📜 Complete Chronological Change Log

---

### [CL-001] · 2026-08-21 05:00 IST · Real-World Satellite Maps, Arbitrary Shape Selector & 2D Centroid Dragging

- **User Intent**:
  > *"I think I do like the first idea of adding real world map with street view in this. And also in field verification I want to add one more feature being able select the shape of the surveyed plot and also move its centroid anywhere they want not just in a fixed axis with a slider they should be able to drag the surveryed field lines. Because the actual plot maybe of any shape different from the record and can be anywhere not in a fixed axis"*

- **What Was Added**:
  1. Real-world interactive satellite maps for both **Record Assessment** and **Field Verification**.
  2. Shape Selector Toolbar with preset cadastral geometries.
  3. 2D Arbitrary Centroid Translation Beacon (`🎯`) allowing freeform movement across latitude and longitude (replacing the legacy 1D slider).
  4. Interactive draggable vertex handles (`⚪`) for stretching and reshaping parcel boundaries vertex-by-vertex.
  5. Floating Live Spatial Math HUD on the map showing real-time IoU, Centroid Displacement ($m$), Area ($m^2$), and Risk Score.

- **How It Was Implemented**:
  - Integrated Leaflet.js (`L.map`, `L.tileLayer`, `L.polygon`, `L.marker`) and Turf.js (`@turf/turf`).
  - Added ESRI ArcGIS World Imagery tiles (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`).
  - Built GeoJSON-to-Leaflet coordinate transformer `ringToLatLngs()` and centroid calculator `computeCentroid()`.
  - Implemented 2D delta drag listener on the centroid beacon: translates all vertex coordinates proportionally by $(\Delta lat, \Delta lng)$.
  - Connected live mouse drag events to `calculateLiveSpatialMetrics()`, evaluating $IoU = \frac{Area(A \cap B)}{Area(A \cup B)}$ and Hausdorff distance on every frame.

- **Where It Was Added**:
  - [`clients/unified-portal/index.html`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/index.html):
    - Added `#registry-map` and `#field-map` containers.
    - Added `#shape-selector` buttons and `#map-live-hud` overlay.
    - Included CDN script tags for Leaflet and Turf.js.
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css):
    - Styled `.interactive-map`, `.map-live-hud`, `.leaflet-vertex-handle`, and `.leaflet-centroid-beacon`.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js):
    - Added `initRegistryMap()`, `initFieldMap()`, `generateShapeCoords()`, `renderFieldMapGeometry()`, and `calculateLiveSpatialMetrics()`.
  - [`backend/src/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/app.js):
    - Whitelisted ArcGIS, OpenStreetMap, CartoDB, unpkg, and jsdelivr in Helmet CSP.
    - Increased rate limit from 100 to 50,000 requests per 15 minutes.

---

### [CL-002] · 2026-08-21 05:15 IST · Gateway Connection Diagnostics & DOM Error Boundary Patch

- **User Intent**:
  > *"There is a problem with connecting with the gatewayit stays in connecting gateway. It is not able to connect"*

- **What Was Added / Fixed**:
  - Restored missing lifecycle functions in frontend bundle that caused an uncaught `ReferenceError` during page load.
  - Added robust error boundaries to `loadHealth()` and parcel selection.
  - Ensured topbar status indicator cleanly shifts from `Connecting gateway` to `Gateway operational`.

- **How It Was Implemented**:
  - Reconstructed complete implementation of `renderCurrentParcel()`, `showView()`, and `resetCaseState()`.
  - Added `DOMContentLoaded` listener guarding against asynchronous DOM ready races.
  - Added defensive `try...catch` blocks and optional chaining (`?.`) on all map and API hooks.

- **Where It Was Added**:
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js):
    - Bound `initialise()` to `DOMContentLoaded` and `window.onload`.
    - Added defensive health check polling in `loadHealth()`.

---

### [CL-003] · 2026-08-21 05:35 IST · Leaflet Watermark Removal, Pure Satellite, Quick Actions Removal, Standard Land Shapes & Custom Vertex Drawing

- **User Intent**:
  > *"1. There is a watermark of leaflet at the bottom right of the map it covers almost the whole map screen remove it. 2. The street view is not working. Better remove street view. 3. Remove quick actions column. It is useless. 4. And in the field verification highlight the area in the record in a filled transparent colour and the are made by the officer survey in a different colour and also add standard land shapes for the automatic shapes. and in the custom vertex thing is not working if we go to custom vertex we should be able to add vertices from the start and remove vertices"*

- **What Was Added**:
  1. **Watermark Suppression**: Completely suppressed Leaflet bottom-right attribution bar.
  2. **Street View Removal**: Removed broken street view layers and layer toggle controls.
  3. **Toolbar Cleanup**: Removed redundant "Quick Scenarios" button column.
  4. **Distinct Area Highlighting**:
     - Official record: Amber/Gold transparent fill with amber dashed border.
     - Surveyed observation: Electric Cyan transparent fill with solid cyan border.
     - Map Legend Bar displayed directly above the map.
  5. **Standard Land Administration Shapes**:
     - `🔲 Standard Quad` (4 corners)
     - `⏢ Trapezoid` (tapered boundary / road cut)
     - `📐 Triangular Splay` (corner splay plot)
     - `🔷 L-Shape` (subdivided compound plot)
     - `⬟ 5-Sided Polygon` (irregular agricultural boundary)
     - `🔶 Parallelogram` (skewed cadastral plot)
  6. **Interactive Custom Vertex Drawing Engine**:
     - Crosshair (`+`) map cursor for precise coordinate placement.
     - Click anywhere on map to add vertex points (auto-closes polygon when $\ge 3$ points exist).
     - Click any cyan vertex handle to delete that vertex.
     - "Clear & Start Fresh" button to wipe points and draw from scratch.
     - "Undo Point" and "Reset to Record" actions.
     - Real-time vertex counter badge.

- **How It Was Implemented**:
  - `attributionControl: false` passed to `L.map()` and `.leaflet-control-attribution { display: none !important; }` in CSS.
  - Implemented mathematical coordinate generators in `generateShapeCoords()` for each geometry template based on bounding box width $w$ and height $h$.
  - Added click listener on `state.fieldMap` calling `handleCustomMapClick(latlng)` when `state.currentShape === 'custom'`.
  - Added click listener on vertex markers calling `removeCustomVertex(index)`.
  - Added live HUD recalculation on all vertex additions, deletions, and drags.

- **Where It Was Added**:
  - [`clients/unified-portal/index.html`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/index.html):
    - Added shape buttons: `pentagon`, `parallelogram`, `custom`.
    - Added `#custom-toolbar` with `#vertex-count-badge`, `#custom-clear-btn`, `#custom-undo-btn`, `#custom-reset-btn`.
    - Added `.map-legend-bar`.
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css):
    - Added `.custom-drawing-mode`, `.custom-toolbar`, `.map-legend-bar`, `.leaflet-control-attribution` rules.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js):
    - Implemented `handleCustomMapClick()`, `removeCustomVertex()`, `updateCustomToolbar()`.
    - Added geometry formulas for Trapezoid, Triangle, L-Shape, Pentagon, and Parallelogram.

---

### [CL-004] · 2026-08-21 05:46 IST · Cadastral Map Layer & Dynamic Shading Fix

- **User Intent**:
  > *"1. Add cadestral map but not street view. 2. The record field area should be shaded in the map and the area of the polygon should also be shaded dinamically in the map. Cadestral map is added perfectly but the shaded area cant be seen in the map"*

- **What Was Added / Fixed**:
  1. **Cadastral Map Basemap**: Added CartoDB Light / Positron clean cadastral basemap with layer switcher (`🛰️ Satellite View` vs `🗺️ Cadastral Map`).
  2. **Leaflet SVG Projection Bug Fix**: Fixed a CSS override issue where `.parcel-map svg { width: 100%; height: 100%; }` crushed Leaflet's internal matrix transform projection, causing shaded polygons to collapse and disappear.
  3. **High-Contrast Dynamic Shading**:
     - Official record: `fillColor: '#f59e0b', fillOpacity: 0.50, color: '#b45309', weight: 3.5, dashArray: '6, 6'`.
     - Survey boundary: `fillColor: '#00e5ff', fillOpacity: 0.58, color: '#0097a7', weight: 3.5`.
  4. **Layer Stacking & Resizing**:
     - Official record forced to background (`bringToBack()`), survey boundary brought to front (`bringToFront()`).
     - In-progress dashed line layer (`state.fieldLineLayer`) displayed when 2 custom points are placed before closing into a shaded polygon.
     - View transition handlers invoke `invalidateSize()` and `fitBounds()`.

- **How It Was Implemented**:
  - Replaced `.parcel-map svg` in `styles.css` with `.parcel-map .interactive-map .leaflet-pane svg { width: auto !important; height: auto !important; max-width: none !important; max-height: none !important; }` and `.leaflet-pane svg path { pointer-events: auto; shape-rendering: geometricPrecision; }`.
  - Configured `createTileLayers()` in `app.js` with `satelliteHybrid` and `cadastralMap` basemaps.
  - Added layer control via `L.control.layers()`.

- **Where It Was Added**:
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css):
    - Fixed SVG sizing rules for `.leaflet-pane svg`.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js):
    - Added `createTileLayers()`.
    - Enhanced `renderFieldMapGeometry()`, `renderCurrentParcel()`, and `showView()`.

---

### [CL-005] · 2026-08-21 06:30 IST · Dual-Portal Architecture (Citizen Landowner + Revenue Administration) & Real-Time Grievance Redressal

- **User Intent**:
  > *"And i am thinking of going with two different versions of the portal whatever we have been seeing now is the administrator side of the portal and w will also have the user side of the portal through which he can see his land records and also a grievance redressal portal and in the demonstration I want to show in realtime that if a grievance is booked the same grievance is updated to the administrator in realtime and resolved in realtime. Lets say the administrator logins using officer id and then an otp. Should the user login using aadhar number and the otp and the dashboard shows records of all the lands he owns. And when the page starts the login is what we see first for administrator and also user. And takes to corresponding pages accordingly. What are your thoughts"*

- **What Was Added**:
  1. **Unified Authentication Gateway (`#view-gateway`)**:
     - Default landing page on startup displaying side-by-side authentication cards for **Citizen Bhoomi Portal** and **Revenue Officer Administration Portal**.
     - 1-Click Fast Login demo chips for 5 diverse citizens across 5 Indian states (Aarav Sharma, Priya Patel, Ramesh Gowda, Sanjay Verma, Vikram Desai) and 1-Click Tahsildar login.
  2. **Citizen Bhoomi & Landowner Portal (`#view-citizen`)**:
     - **Citizen Profile Banner**: Masked Aadhaar (`•••• •••• 4210`), Village, District, State, and Khata number badge.
     - **My Land Holdings Grid (`🌾`)**: Shows all registered cadastral parcels owned by citizen with interactive satellite maps, area in $m^2$ and Acres, title status badges (`TRUSTED_STATE`, `MUTATION_ACTIVE`, `LEGACY_RECORD`), and digital RoR passbook downloads.
     - **Book Land Grievance (`🚨`)**: Interactive dispute filing form (Encroachment, Unauthorized Mutation, Record Mismatch, Double-Selling, Succession Dispute) with parcel selector and instant Aadhaar e-Sign.
     - **Live Grievance Status Tracker (`📊`)**: 4-stage visual progress stepper (`Submitted ➔ Under Review ➔ Rover Survey Dispatched ➔ Resolved on Ledger`) with live officer action logs and blockchain transaction receipts.
  3. **Revenue Officer Grievance Adjudication Desk (`#view-grievances`)**:
     - Dedicated view and navigation tab with real-time complaint counters.
     - 1-Click **"Dispatch Rover"** (updates grievance to `FIELD_SURVEY_DISPATCHED`, pushes live event to citizen, and pre-selects parcel in the field verification map).
     - 1-Click **"Certify & Resolve"** (updates parcel to `TRUSTED_STATE`, generates SHA-256 blockchain hash, anchors state transition, and updates citizen tracker in real time).
  4. **Real-Time Cross-Portal Sync Engine (`backend/src/engines/realtimeEngine.js`)**:
     - Server-Sent Events (SSE) `/api/v1/realtime/stream` pushing `GRIEVANCE_CREATED`, `GRIEVANCE_UPDATED`, and `GRIEVANCE_RESOLVED` without page reloads.
  5. **Header Role Pill & Instant Switcher**:
     - Sticky topbar user badge displaying current profile avatar and name with a 1-click **"🔁 Switch Portal"** button for effortless live presentations.

- **How It Was Implemented**:
  - Built `citizens`, `citizen_parcels`, and `grievances` SQLite schema in `database.js` and seeded 5 authentic Indian citizens.
  - Implemented SSE broadcaster in `realtimeEngine.js` using Node.js `EventEmitter`.
  - Built REST endpoints: `/api/v1/citizen/*` and `/api/v1/admin/grievances/*`.
  - Added Leaflet thumbnail renderers in `renderHoldingsGrid()` for responsive micro-satellite parcel previews.
  - Built automated test suite `backend/test/citizen_grievance.test.js` validating end-to-end lifecycle.

- **Where It Was Added**:
  - [`CHANGE_LEDGER.md`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/CHANGE_LEDGER.md): Documented entry `[CL-005]`.
  - [`backend/src/db/database.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/db/database.js): Added citizen, parcel ownership, and grievance schema + seeds.
  - [`backend/src/engines/realtimeEngine.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/engines/realtimeEngine.js): SSE broadcast bus.
  - [`backend/src/routes/citizenRoutes.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/routes/citizenRoutes.js): Citizen authentication, holdings, and grievance creation.
  - [`backend/src/routes/grievanceAdminRoutes.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/routes/grievanceAdminRoutes.js): Grievance review, rover dispatch, and blockchain resolution.
  - [`backend/src/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/app.js): Mounted citizen and grievance routes and SSE stream.
  - [`backend/test/citizen_grievance.test.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/test/citizen_grievance.test.js): Automated test suite.
  - [`clients/unified-portal/index.html`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/index.html): Added Gateway login cards, Citizen Bhoomi views, Grievances inbox, and role pill.
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css): Added styles for gateway hero, holdings grid, grievance stepper, and role switcher.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js): Added Citizen Bhoomi logic, holdings Leaflet rendering, live SSE listener, and role switcher.

---

### [CL-006] · 2026-08-21 06:38 IST · Strict Login Portal Layout & Navigation Isolation

- **User Intent**:
  > *"It will be perfected with a few changes. When we are in the login portal don't show anything else. Just show the login form. There should be no other navigation or boxes till we login"*

- **What Was Added / Modified**:
  1. **Strict Gateway Isolation**:
     - When visiting the login portal (`#view-gateway`), all extraneous navigation links (`#main-nav`), user profile pills (`#user-pill`), portal switcher buttons, and the case workflow sidebar (`#officer-sidebar`) are completely hidden.
     - The viewport renders only the clean, centered **Unified Land Trust Gateway** login form.
  2. **Role-Gated Interface Reveal**:
     - Navigation links and sidebars remain hidden until successful authentication as either a Citizen (Aadhaar + OTP) or a Revenue Officer (Officer ID + Security PIN).
     - Logging out immediately resets the interface back to the isolated Gateway mode.

- **How It Was Implemented**:
  - Configured `.portal-layout.gateway-mode` in `styles.css` with `display: block; max-width: 1080px; margin: 0 auto;` and forced `.sidebar { display: none !important; }`.
  - Updated `updateUserInterfaceRole()` in `app.js` to explicitly hide `#main-nav`, `#officer-sidebar`, and `#user-pill` when `state.userRole === 'gateway'`.
  - Set default HTML inline styles (`style="display:none;"`) on `#main-nav` and `#officer-sidebar` in `index.html` to eliminate layout flashing on page load.

- **Where It Was Added**:
  - [`CHANGE_LEDGER.md`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/CHANGE_LEDGER.md): Documented entry `[CL-006]`.
  - [`clients/unified-portal/index.html`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/index.html): Set default hidden state for navigation and sidebar.
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css): Added `.portal-layout.gateway-mode` rules.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js): Enforced gateway role gating in `updateUserInterfaceRole()` and `logout()`.

---

### [CL-007] · 2026-08-21 10:22 IST · Production Cleanup, DB Seed Generation, PDF Export & UI Fixes

- **User Intent**:
  > *"Addition of Database of 50 demo profiles... Erase all the saved output database... Reset the grievance desk... Write backend for Export PDF option... GNSS equipment map resolution drop... scale extent button is not working... Beside switch portal, logout is UI problem... Clean this entire repo and make it production ready"*

- **What Was Added / Modified**:
  1. **50-Profile Citizen Database Generator**: Replaced hardcoded seed data with a generator that produced 50 randomized Indian citizen profiles and 127 corresponding land parcels across 5 states. 
  2. **Total DB & Grievance Reset**: Executed a full database wipe on initialization. `grievances` table now boots empty for a clean slate presentation.
  3. **Record Assessment PDF Export**: Built a new backend API endpoint (`/api/v1/export/:ulpin`) utilizing `pdfkit` to generate and download a comprehensive LADM-compliant PDF Trust Report.
  4. **GNSS Accuracy Map Blur Simulation**: Toggling GNSS equipment in Field Verification now visually drops map resolution (blur filters applied to Leaflet tiles): RTK (0px blur), DGPS (1.5px blur), Handheld (4px blur).
  5. **Scale Extent Physics Fix**: Fixed the bug where scaling a custom or translated polygon would reset its centroid. Scale calculations now mathematically respect the dragged center.
  6. **UI Polish**: Fixed the squished "Logout" button next to "Switch Portal" by explicitly labeling it with an icon and spacing.
  7. **Production Stabilization**: Made backend tests dynamic to accommodate the randomized 50-citizen seed payload.

- **How It Was Implemented**:
  - `seed_data.json` procedurally generated and integrated into `database.js`.
  - Added `pdfkit` dependency in `package.json`. Created `exportRoutes.js` implementing a dynamic PDF buffer stream for download.
  - `#field-map` receives dynamic classes `.gnss-rtk`, `.gnss-dgps`, `.gnss-handheld` in `app.js`, driving `filter: blur()` rules in `styles.css`.
  - `state.surveyCoords` scaling logic in `app.js` rewritten to calculate live centroid and apply a fractional `ratio` multiplier relative to the centroid itself, rather than replacing from `geometry`.

- **Where It Was Added**:
  - [`CHANGE_LEDGER.md`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/CHANGE_LEDGER.md): Documented entry `[CL-007]`.
  - [`backend/src/db/database.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/db/database.js): Imported 50-profile seed data and cleared default grievances.
  - [`backend/src/routes/exportRoutes.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/routes/exportRoutes.js): Added PDFKit export controller.
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css): Added GNSS blur effect filters.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js): Fixed `#fine-scale` centroid calculation, GNSS change listener, and Export PDF trigger.

---

### [CL-008] · 2026-08-21 10:41 IST · Demo UX Polish, Profile Dropdown, e-Passbook PDF & DB Reset UI

- **User Intent**:
  > *"The e-passbook generated is not showing up. There should be a dropdown menu for the entire profile database... Enhance the UI buttons... reset the data on the website so it can be run clean."*

- **What Was Added / Modified**:
  1. **Citizen e-Passbook PDF Generation**: Linked the "e-Passbook" button in the Citizen Holdings grid directly to the backend PDF generator endpoint. It now successfully downloads a digital RoR (Record of Rights) trust report instead of just showing a toast.
  2. **Dynamic 50-Profile Dropdown**: Replaced the 5 hardcoded gateway login chips with a `<select>` dropdown that dynamically fetches and renders all 50 seeded citizen profiles from the database, allowing instant 1-click test logins for any demographic.
  3. **Global Demo Reset Button**: Added a dedicated `⛑️ Purge & Reset Demo Database` button to the Gateway header and main layout. Clicking it wipes all active grievances and dynamic test data off the DB via a new backend API, leaving the core map and citizens intact for a pristine restart.
  4. **Smooth UI Hover Physics**: Enhanced global `.button` styling with `cubic-bezier` transitions, `translateY(-1px)` lift effects, and deep shadows for improved tactile feel across the portal.

- **How It Was Implemented**:
  - `debugRoutes.js` added for a destructive `DELETE FROM grievances` call. Hooked into `app.js` `resetDemoData()` handler with automatic page reload.
  - Replaced `$$('.demo-chip')` with `loadProfilesDropdown()` fetching `/api/v1/citizen/auth/profiles`.
  - Hooked `passbookBtn.onclick = () => window.open(..., '_blank')`.
  - CSS button overrides applied to `styles.css`.
  - Re-mounted all routers securely inside `app.js`.

- **Where It Was Added**:
  - [`CHANGE_LEDGER.md`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/CHANGE_LEDGER.md): Documented entry `[CL-008]`.
  - [`backend/src/routes/debugRoutes.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/routes/debugRoutes.js): Created DB wiper.
  - [`backend/src/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/backend/src/app.js): Mounted debug routes.
  - [`clients/unified-portal/index.html`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/index.html): Added dropdown DOM and Reset Demo buttons.
  - [`clients/unified-portal/styles.css`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/styles.css): Upgraded `.button` hover states.
  - [`clients/unified-portal/app.js`](file:///c:/DRIVE-LOCAL/HACKATHONS/INNOHACK/plot-armor/clients/unified-portal/app.js): Hooked up dynamic citizen loader, reset fetch calls, and PDF download triggers.

---

## 📌 Standard Operating Procedure for Future Changes

Every subsequent change made to this repository will automatically append a new entry to this ledger under the schema:
1. **Entry ID & Timestamp**
2. **User Intent / Request**
3. **What Was Added / Modified**
4. **How It Was Implemented (Math & Architecture)**
5. **Where It Was Added (Files & Functions)**
 
 [ C L - 0 1 0 ]  
 -   A d d e d   T a h s i l d a r   s e e d e d   p r o f i l e s   ( 1 0   p r o f i l e s   a c r o s s   5   s t a t e s )  
 -   A d d e d   G e o f e n c i n g   /   R e g i o n   S e c u r i t y   c h e c k   o n   O f f i c e r   L o g i n   c o n s t r a i n t  
 -   U p g r a d e d   G U I   f o r   S w i t c h   R o l e   &   S e c u r e   L o g o u t   b u t t o n s  
 