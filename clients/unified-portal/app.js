// clients/unified-portal/app.js
const ORIGIN = /^https?:$/.test(window.location.protocol) ? window.location.origin : 'http://localhost:8080';
const API_BASE = `${ORIGIN}/api/v1`;

const state = {
  // Session & Authentication
  userRole: 'gateway', // 'gateway' | 'citizen' | 'officer'
  activeCitizen: null,
  officerId: 'TAHSILDAR_REV_88',
  
  // Citizen Bhoomi Data
  citizenHoldings: [],
  citizenGrievances: [],
  holdingMaps: new Map(),

  // Officer Administration Data
  parcels: [],
  current: null,
  assessment: null,
  authenticated: false,
  capture: null,
  spatialResult: null,
  decisions: new Map(),
  dockets: [],
  adminGrievances: [],
  
  // Interactive Maps & Layers (Officer)
  registryMap: null,
  registryLayer: null,
  
  fieldMap: null,
  fieldOfficialLayer: null,
  fieldSurveyLayer: null,
  fieldLineLayer: null,
  centroidMarker: null,
  vertexMarkers: [],
  
  // Surveyed Geometry Model
  currentShape: 'rect', // 'rect', 'trapezoid', 'triangle', 'lshape', 'pentagon', 'parallelogram', 'custom'
  surveyCoords: [],     // Array of [longitude, latitude]
  scaleFactor: 1.0
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setText(selector, value) {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) element.textContent = value;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  return payload;
}

const api = (path, options) => request(`${API_BASE}${path}`, options);

function toast(message, type = 'success') {
  const container = $('#toast-region');
  if (!container) return;
  const item = document.createElement('div');
  item.className = `toast${type === 'error' ? ' error' : ''}`;
  item.textContent = message;
  container.append(item);
  window.setTimeout(() => item.remove(), 4800);
}

function setBusy(button, busy, busyText) {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function stateClass(value) {
  const name = String(value || '').toUpperCase().replaceAll('_', ' ');
  if (name.includes('CERTIFIED') || name.includes('RESOLVED')) return 'certified';
  if (name === 'CLEAR' || name === 'TRUSTED STATE') return 'clear';
  if (name.includes('PROVISIONAL') || name.includes('UNCERTAIN') || name.includes('SUBMITTED')) return 'provisional';
  if (name.includes('INCONSISTENT')) return 'inconsistent';
  if (name.includes('COURT') || name.includes('FORMALLY') || name.includes('FIELD SURVEY DISPATCHED')) return 'court';
  if (name.includes('DISPUTE')) return 'disputed';
  if (name.includes('VERIFIED')) return 'verified';
  return 'neutral';
}

function label(value) {
  return String(value || 'Not assessed').replaceAll('_', ' ');
}

function setBadge(element, value) {
  if (!element) return;
  element.className = `state-badge ${stateClass(value)}`;
  element.textContent = label(value);
}

// ==========================================
// ⚡ REAL-TIME SERVER-SENT EVENTS (SSE)
// ==========================================
function initRealtimeSync() {
  try {
    const eventSource = new EventSource(`${API_BASE}/realtime/stream`);

    eventSource.addEventListener('CONNECTED', (e) => {
      console.log("[SSE] Connected to Plot-Armor Real-Time Stream.");
      toast("🔌 Real-time Webhook Sync Connected", "success");
    });

    eventSource.addEventListener('GRIEVANCE_CREATED', (e) => {
      const grievance = JSON.parse(e.data);
      if (state.userRole === 'officer') {
        toast(`🚨 New Grievance #${grievance.grievance_id} filed by ${grievance.citizen_name} for ${grievance.ulpin}!`);
        loadAdminGrievances();
        refreshCounts();
      } else if (state.userRole === 'citizen' && state.activeCitizen?.aadhaar === grievance.citizen_aadhaar) {
        loadCitizenDashboard(state.activeCitizen.aadhaar);
      }
    });

    eventSource.addEventListener('GRIEVANCE_UPDATED', (e) => {
      const grievance = JSON.parse(e.data);
      if (state.userRole === 'officer') {
        loadAdminGrievances();
      } else if (state.userRole === 'citizen' && state.activeCitizen?.aadhaar === grievance.citizen_aadhaar) {
        toast(`ℹ️ Grievance #${grievance.grievance_id} status updated: ${grievance.status}`);
        loadCitizenDashboard(state.activeCitizen.aadhaar);
      }
    });

    eventSource.addEventListener('GRIEVANCE_RESOLVED', (e) => {
      const data = JSON.parse(e.data);
      if (state.userRole === 'officer') {
        loadAdminGrievances();
        refreshCounts();
      } else if (state.userRole === 'citizen' && state.activeCitizen?.aadhaar === data.grievance.citizen_aadhaar) {
        toast(`🎉 Grievance #${data.grievance.grievance_id} RESOLVED on Consortium Ledger!`);
        loadCitizenDashboard(state.activeCitizen.aadhaar);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("[SSE] Connection interrupted, retrying...", err);
    };
  } catch (err) {
    console.warn("Real-time SSE setup warning:", err);
  }
}

// ==========================================
// 🗺️ CADASTRAL & SATELLITE TILE FACTORY
// ==========================================
function createTileLayers() {
  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
  });
  const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
  });
  const satelliteHybrid = L.layerGroup([satellite, labels]);

  const cadastralMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  });

  return {
    baseLayers: {
      "🛰️ Satellite View": satelliteHybrid,
      "🗺️ Cadastral Map": cadastralMap
    },
    defaultLayer: satelliteHybrid
  };
}

function ringToLatLngs(ring) {
  return ring.map(([lng, lat]) => [lat, lng]);
}

function computeCentroid(ring) {
  if (!ring || ring.length === 0) return [80.64, 16.51];
  let sumLng = 0, sumLat = 0;
  const count = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] 
    ? ring.length - 1 
    : ring.length;
  
  for (let i = 0; i < count; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  return [sumLng / count, sumLat / count];
}

// ==========================================
// 👤 CITIZEN BHOOMI PORTAL WORKFLOW
// ==========================================
async function loginAsCitizen(aadhaar, otp) {
  try {
    const cleanAadhaar = String(aadhaar).replace(/\s+/g, '');
    const res = await api('/citizen/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ aadhaar: cleanAadhaar, otp: otp || '482910' })
    });

    state.userRole = 'citizen';
    state.activeCitizen = res.citizen;

    updateUserInterfaceRole();
    await loadCitizenDashboard(cleanAadhaar);
    showView('citizen');
    toast(`Welcome back, ${res.citizen.name}! Logged into Bhoomi Citizen Portal.`);
  } catch (err) {
    toast(`Citizen Login Failed: ${err.message}`, 'error');
  }
}

async function loginAsOfficer(officerId, pin) {
  state.userRole = 'officer';
  state.officerId = officerId || 'TAHSILDAR_REV_88';

  updateUserInterfaceRole();
  showView('overview');
  toast(`Authorized session initialized for Officer ${state.officerId}.`);
}

function updateUserInterfaceRole() {
  const mainNav = $('#main-nav');
  const navOfficer = $('#nav-officer-links');
  const navCitizen = $('#nav-citizen-links');
  const userPill = $('#user-pill');
  const portalLayout = $('#portal-layout');
  const sidebar = $('#officer-sidebar');

  if (state.userRole === 'citizen') {
    // Reveal Citizen Navigation & Profile Pill; Hide Officer Sidebar
    if (mainNav) mainNav.style.display = 'flex';
    if (navOfficer) navOfficer.style.display = 'none';
    if (navCitizen) navCitizen.style.display = 'flex';
    if (userPill) {
      userPill.style.display = 'flex';
      setText('#user-avatar', '👤');
      setText('#user-display-name', state.activeCitizen?.name || 'Citizen');
      setText('#user-display-sub', 'Aadhaar Verified');
    }
    if (portalLayout) portalLayout.className = 'portal-layout citizen-mode';
    if (sidebar) sidebar.style.display = 'none';
  } else if (state.userRole === 'officer') {
    // Reveal Officer Navigation, Profile Pill & Sidebar
    if (mainNav) mainNav.style.display = 'flex';
    if (navOfficer) navOfficer.style.display = 'flex';
    if (navCitizen) navCitizen.style.display = 'none';
    if (userPill) {
      userPill.style.display = 'flex';
      setText('#user-avatar', '🛡️');
      setText('#user-display-name', state.officerId);
      setText('#user-display-sub', 'Revenue Tahsildar');
    }
    if (portalLayout) portalLayout.className = 'portal-layout officer-mode';
    if (sidebar) sidebar.style.display = 'block';
  } else {
    // 🌐 GATEWAY MODE (Pure Login Form - Hide all navigation, profile pills, and sidebars)
    if (mainNav) mainNav.style.display = 'none';
    if (navOfficer) navOfficer.style.display = 'none';
    if (navCitizen) navCitizen.style.display = 'none';
    if (userPill) userPill.style.display = 'none';
    if (portalLayout) portalLayout.className = 'portal-layout gateway-mode';
    if (sidebar) sidebar.style.display = 'none';
  }
}

function logout() {
  state.userRole = 'gateway';
  state.activeCitizen = null;
  window.location.hash = 'gateway';
  updateUserInterfaceRole();
  showView('gateway');
  toast('Signed out to Unified Trust Gateway.');
}

async function loadCitizenDashboard(aadhaar) {
  if (!aadhaar) return;
  try {
    const [holdingsData, grievancesData] = await Promise.all([
      api(`/citizen/holdings/${aadhaar}`),
      api(`/citizen/grievances/${aadhaar}`)
    ]);

    state.citizenHoldings = holdingsData.holdings;
    state.citizenGrievances = grievancesData.items;

    // 1. Update Profile Header
    setText('#citizen-name-disp', holdingsData.citizen.name);
    setText('#citizen-details-disp', `Aadhaar: •••• •••• ${aadhaar.slice(-4)} · Village: ${holdingsData.citizen.village} · ${holdingsData.citizen.district}, ${holdingsData.citizen.state}`);
    setText('#citizen-khata-disp', holdingsData.citizen.khata_number);
    setText('#citizen-holdings-count', holdingsData.holdings_count);
    setText('#citizen-grievances-count', grievancesData.count);

    // 2. Populate Grievance Parcel Dropdown
    const ulpinSelect = $('#grievance-ulpin-select');
    if (ulpinSelect) {
      ulpinSelect.replaceChildren(...holdingsData.holdings.map(h => {
        const opt = document.createElement('option');
        opt.value = h.ulpin;
        opt.textContent = `${h.ulpin} (${h.area_acres} Acres · ${h.village})`;
        return opt;
      }));
    }

    // 3. Render Holdings Grid & Maps
    renderHoldingsGrid(holdingsData.holdings);

    // 4. Render Citizen Grievances Timeline
    renderCitizenGrievances(grievancesData.items);
  } catch (err) {
    console.error("Citizen dashboard load failed:", err);
    toast(`Unable to load citizen records: ${err.message}`, 'error');
  }
}

function renderHoldingsGrid(holdings) {
  const container = $('#holdings-grid');
  if (!container) return;
  container.replaceChildren();

  if (!holdings.length) {
    container.append(createElement('p', '', 'No land parcels linked to this Aadhaar.'));
    return;
  }

  state.holdingMaps.forEach(map => map.remove());
  state.holdingMaps.clear();

  holdings.forEach((holding) => {
    const card = createElement('article', 'holding-card');
    const mapId = `holding-map-${holding.ulpin.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const mapDiv = createElement('div', 'holding-card-map');
    mapDiv.id = mapId;

    const body = createElement('div', 'holding-card-body');
    const header = createElement('div', 'holding-card-header');
    const ulpinEl = createElement('h2', 'holding-ulpin', holding.ulpin);
    const badge = createElement('span');
    setBadge(badge, holding.title_status);
    header.append(ulpinEl, badge);

    const facts = createElement('dl', 'holding-facts');
    facts.innerHTML = `
      <div class="holding-fact-item"><dt>Extent (Acres / m²)</dt><dd>${holding.area_acres} Ac (${holding.area_sqm} m²)</dd></div>
      <div class="holding-fact-item"><dt>Jurisdiction</dt><dd>${holding.state}</dd></div>
      <div class="holding-fact-item"><dt>Village / Taluk</dt><dd>${holding.village}</dd></div>
      <div class="holding-fact-item"><dt>Mutation</dt><dd>${holding.mutation_version}</dd></div>
    `;

    const actions = createElement('div', 'holding-actions');
    const fileBtn = createElement('button', 'button button-danger', '🚨 File Grievance');
    fileBtn.onclick = () => {
      showCitizenSubTab('file');
      const select = $('#grievance-ulpin-select');
      if (select) select.value = holding.ulpin;
    };

    const passbookBtn = createElement('button', 'button button-secondary', '📜 e-Passbook');
    passbookBtn.onclick = () => {
      toast(`Generating Digital Pattadar Passbook (RoR-1B) for ${holding.ulpin}...`);
      window.open(`${API_BASE}/export/${holding.ulpin}`, '_blank');
    };

    actions.append(fileBtn, passbookBtn);
    body.append(header, facts, actions);
    card.append(mapDiv, body);
    container.append(card);

    window.setTimeout(() => {
      try {
        const { defaultLayer } = createTileLayers();
        const map = L.map(mapId, {
          layers: [defaultLayer],
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false
        });

        const latLngs = ringToLatLngs(holding.geometry.coordinates[0]);
        const poly = L.polygon(latLngs, {
          color: '#d97706',
          weight: 2.5,
          dashArray: '5, 5',
          fillColor: '#f59e0b',
          fillOpacity: 0.48
        }).addTo(map);

        map.fitBounds(poly.getBounds(), { padding: [25, 25], maxZoom: 18 });
        state.holdingMaps.set(holding.ulpin, map);
      } catch (err) {
        console.warn(`Holding map ${mapId} init:`, err);
      }
    }, 100);
  });
}

function renderCitizenGrievances(items) {
  const container = $('#citizen-tracker-list');
  if (!container) return;
  container.replaceChildren();

  if (!items.length) {
    container.append(createElement('p', '', 'No active grievances on record.'));
    return;
  }

  items.forEach(g => {
    const card = createElement('article', 'tracker-card');
    const header = createElement('div', 'tracker-header');
    const titleDiv = createElement('div');
    titleDiv.append(
      createElement('h2', 'tracker-title', `${g.category.replaceAll('_', ' ')} · ${g.ulpin}`),
      createElement('small', 'tracker-meta', `Complaint ID: ${g.grievance_id} · Filed: ${new Date(g.created_at).toLocaleString('en-IN')}`)
    );

    const badge = createElement('span');
    setBadge(badge, g.status);
    header.append(titleDiv, badge);

    // 4-Stage Visual Progress Stepper
    const stepper = createElement('div', 'tracker-stepper');
    const stages = [
      { key: 'SUBMITTED', num: '1', title: 'Submitted' },
      { key: 'UNDER_INVESTIGATION', num: '2', title: 'Under Review' },
      { key: 'FIELD_SURVEY_DISPATCHED', num: '3', title: 'Rover Survey' },
      { key: 'RESOLVED', num: '4', title: 'Resolved' }
    ];

    const currentStatus = g.status;

    stages.forEach(stage => {
      const step = createElement('div', 'stepper-step');
      let isDone = false;
      let isActive = false;

      if (currentStatus === 'SUBMITTED' && stage.key === 'SUBMITTED') isActive = true;
      else if (currentStatus === 'UNDER_INVESTIGATION') {
        if (stage.key === 'SUBMITTED') isDone = true;
        if (stage.key === 'UNDER_INVESTIGATION') isActive = true;
      } else if (currentStatus === 'FIELD_SURVEY_DISPATCHED') {
        if (stage.key === 'SUBMITTED' || stage.key === 'UNDER_INVESTIGATION') isDone = true;
        if (stage.key === 'FIELD_SURVEY_DISPATCHED') isActive = true;
      } else if (currentStatus === 'RESOLVED') {
        isDone = true;
      }

      if (isDone) step.classList.add('step-done');
      if (isActive) step.classList.add('step-active');

      step.innerHTML = `<span class="stepper-dot">${isDone ? '✓' : stage.num}</span><span class="stepper-label">${stage.title}</span>`;
      stepper.append(step);
    });

    const desc = createElement('p', '', g.description);
    card.append(header, stepper, desc);

    if (g.officer_action) {
      const actionBox = createElement('div', 'tracker-action-box');
      actionBox.innerHTML = `<strong>Revenue Authority Update:</strong> ${g.officer_action}`;
      card.append(actionBox);
    }

    if (g.resolution_hash) {
      const receiptBox = createElement('div', 'tracker-receipt');
      receiptBox.innerHTML = `⛓️ <strong>BLOCKCHAIN ANCHOR:</strong> ${g.resolution_hash}`;
      card.append(receiptBox);
    }

    container.append(card);
  });
}

function showCitizenSubTab(tabName) {
  $$('.citizen-tab').forEach(t => t.classList.toggle('active', t.dataset.citizenTab === tabName));
  $$('.citizen-tab-content').forEach(c => c.classList.toggle('active', c.id === `citizen-tab-${tabName}`));
}

// ==========================================
// 🛡️ REVENUE OFFICER GRIEVANCE DESK
// ==========================================
async function loadAdminGrievances() {
  const tbody = $('#admin-grievances-tbody');
  if (!tbody) return;
  try {
    const res = await api('/admin/grievances');
    state.adminGrievances = res.items;

    setText('#admin-grievance-count-meta', `${res.pending_count} active complaints`);
    setText('#nav-grievance-count', res.pending_count);
    setText('#metric-grievances', res.pending_count);

    tbody.replaceChildren();
    if (!res.items.length) {
      const row = createElement('tr', 'empty-row');
      row.innerHTML = '<td colspan="7">No citizen grievances reported.</td>';
      tbody.append(row);
      return;
    }

    res.items.forEach(g => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${g.grievance_id}</strong><br><small class="table-subtext">${new Date(g.created_at).toLocaleDateString('en-IN')}</small></td>
        <td><strong>${g.citizen_name}</strong><br><small class="table-subtext">Aadhaar: •••• ${g.citizen_aadhaar.slice(-4)}</small></td>
        <td><strong>${g.ulpin}</strong><br><small class="table-subtext">${g.state}</small></td>
        <td><span class="state-badge neutral" style="font-size:8px;">${g.category.replaceAll('_', ' ')}</span></td>
        <td><strong>${g.title}</strong><br><small class="table-subtext" style="max-width:260px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${g.description}</small></td>
        <td><span class="state-badge ${stateClass(g.status)}">${label(g.status)}</span></td>
      `;

      const actionsTd = document.createElement('td');
      const actionWrap = createElement('div', 'table-actions');

      if (g.status === 'SUBMITTED') {
        const dispatchBtn = createElement('button', 'button button-secondary', '🛰️ Dispatch Rover');
        dispatchBtn.onclick = () => dispatchGrievanceSurvey(g.grievance_id, g.ulpin);
        actionWrap.append(dispatchBtn);
      } else if (g.status === 'FIELD_SURVEY_DISPATCHED') {
        const resolveBtn = createElement('button', 'button button-primary', '⚖️ Certify & Resolve');
        resolveBtn.onclick = () => resolveGrievanceCase(g.grievance_id, g.ulpin);
        actionWrap.append(resolveBtn);
      } else {
        const resolvedTag = createElement('small', 'table-subtext', 'Anchored on Chain');
        actionWrap.append(resolvedTag);
      }

      actionsTd.append(actionWrap);
      row.append(actionsTd);
      tbody.append(row);
    });
  } catch (err) {
    console.error("Grievances load failed:", err);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Unable to load grievances: ${err.message}</td></tr>`;
  }
}

async function dispatchGrievanceSurvey(grievanceId, ulpin) {
  try {
    await api(`/admin/grievances/${grievanceId}/dispatch-survey`, {
      method: 'POST',
      body: JSON.stringify({ officer_id: state.officerId })
    });
    toast(`Field survey rover dispatched for Grievance ${grievanceId}.`);
    await loadAdminGrievances();
    if (ulpin) selectParcel(ulpin);
  } catch (err) {
    toast(`Dispatch failed: ${err.message}`, 'error');
  }
}

async function resolveGrievanceCase(grievanceId, ulpin) {
  try {
    const res = await api(`/admin/grievances/${grievanceId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        officer_id: state.officerId,
        resolution_summary: `Boundary rectifications verified via RTK rover. Certified by Tahsildar ${state.officerId}.`
      })
    });
    toast(`Grievance ${grievanceId} resolved and anchored to blockchain! Hash: ${res.resolution_hash.slice(0, 10)}...`);
    await loadAdminGrievances();
    await refreshCounts();
  } catch (err) {
    toast(`Resolution failed: ${err.message}`, 'error');
  }
}

// ==========================================
// 📐 STANDARD LAND SHAPES GENERATION (OFFICER)
// ==========================================
function getOfficialBBox(geometry) {
  const coords = geometry.coordinates[0];
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  return {
    minLng, maxLng, minLat, maxLat,
    cLng: (minLng + maxLng) / 2,
    cLat: (minLat + maxLat) / 2,
    w: maxLng - minLng,
    h: maxLat - minLat
  };
}

function generateShapeCoords(shapeType, geometry, scale = 1.0, offsetMeters = { x: 0, y: 0 }) {
  const bbox = getOfficialBBox(geometry);
  const latFactor = 1 / 110540;
  const lngFactor = 1 / (111320 * Math.cos(bbox.cLat * Math.PI / 180));
  
  const cLng = bbox.cLng + (offsetMeters.x * lngFactor);
  const cLat = bbox.cLat + (offsetMeters.y * latFactor);
  const w = (bbox.w * scale) / 2;
  const h = (bbox.h * scale) / 2;

  let ring = [];

  switch (shapeType) {
    case 'trapezoid':
      ring = [
        [cLng - w, cLat - h],
        [cLng + w, cLat - h],
        [cLng + (w * 0.45), cLat + h],
        [cLng - (w * 0.65), cLat + h],
        [cLng - w, cLat - h]
      ];
      break;

    case 'triangle':
      ring = [
        [cLng - w, cLat - h],
        [cLng + w, cLat - h],
        [cLng, cLat + h],
        [cLng - w, cLat - h]
      ];
      break;

    case 'lshape':
      ring = [
        [cLng - w, cLat - h],
        [cLng + w, cLat - h],
        [cLng + w, cLat],
        [cLng, cLat],
        [cLng, cLat + h],
        [cLng - w, cLat + h],
        [cLng - w, cLat - h]
      ];
      break;

    case 'pentagon':
      ring = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - (Math.PI / 2);
        ring.push([cLng + (w * Math.cos(angle)), cLat + (h * Math.sin(angle))]);
      }
      ring.push([ring[0][0], ring[0][1]]);
      break;

    case 'parallelogram':
      ring = [
        [cLng - w, cLat - h],
        [cLng + (w * 0.6), cLat - h],
        [cLng + w, cLat + h],
        [cLng - (w * 0.4), cLat + h],
        [cLng - w, cLat - h]
      ];
      break;

    case 'custom':
      if (state.surveyCoords && state.surveyCoords.length >= 4) {
        return state.surveyCoords;
      }
      return geometry.coordinates[0].map(([lng, lat]) => [lng, lat]);

    case 'rect':
    default:
      ring = [
        [cLng - w, cLat - h],
        [cLng + w, cLat - h],
        [cLng + w, cLat + h],
        [cLng - w, cLat + h],
        [cLng - w, cLat - h]
      ];
      break;
  }

  return ring;
}

// ==========================================
// ✏️ CUSTOM VERTEX DRAWING (OFFICER)
// ==========================================
function handleCustomMapClick(latlng) {
  const newPt = [latlng.lng, latlng.lat];

  if (!state.surveyCoords || state.surveyCoords.length === 0) {
    state.surveyCoords = [newPt];
    toast('Added vertex #1. Click next locations to form boundary.');
  } else if (state.surveyCoords.length === 1) {
    state.surveyCoords.push(newPt);
    toast('Added vertex #2. Click a 3rd point to enclose polygon.');
  } else {
    const unclosed = (state.surveyCoords.length > 2 && 
      state.surveyCoords[0][0] === state.surveyCoords[state.surveyCoords.length - 1][0] && 
      state.surveyCoords[0][1] === state.surveyCoords[state.surveyCoords.length - 1][1])
      ? state.surveyCoords.slice(0, -1)
      : [...state.surveyCoords];

    unclosed.push(newPt);
    unclosed.push([unclosed[0][0], unclosed[0][1]]);
    state.surveyCoords = unclosed;
    toast(`Added vertex #${unclosed.length - 1}.`);
  }

  renderFieldMapGeometry();
  onGeometryModified();
}

function removeCustomVertex(index) {
  if (!state.surveyCoords || state.surveyCoords.length <= 4) {
    toast('Polygon requires at least 3 points. Click "Clear" to redraw.', 'error');
    return;
  }

  const unclosed = state.surveyCoords.slice(0, -1);
  unclosed.splice(index, 1);
  unclosed.push([unclosed[0][0], unclosed[0][1]]);
  state.surveyCoords = unclosed;

  toast(`Removed vertex #${index + 1}.`);
  renderFieldMapGeometry();
  onGeometryModified();
}

function updateCustomToolbar() {
  const customToolbar = $('#custom-toolbar');
  const countBadge = $('#vertex-count-badge');
  const fieldContainer = $('.field-map-container');

  if (state.currentShape === 'custom') {
    if (customToolbar) customToolbar.style.display = 'flex';
    if (fieldContainer) fieldContainer.classList.add('custom-drawing-mode');
    
    const uniqueVertices = state.surveyCoords && state.surveyCoords.length > 1
      ? (state.surveyCoords[0][0] === state.surveyCoords[state.surveyCoords.length - 1][0] ? state.surveyCoords.length - 1 : state.surveyCoords.length)
      : (state.surveyCoords ? state.surveyCoords.length : 0);

    if (countBadge) countBadge.textContent = `${uniqueVertices} ${uniqueVertices === 1 ? 'Vertex' : 'Vertices'}`;
  } else {
    if (customToolbar) customToolbar.style.display = 'none';
    if (fieldContainer) fieldContainer.classList.remove('custom-drawing-mode');
  }
}

// ==========================================
// 📊 REAL-TIME SPATIAL MATH (TURF.JS)
// ==========================================
function calculateLiveSpatialMetrics() {
  if (!state.current || !state.surveyCoords || state.surveyCoords.length < 4) {
    return { iou: 0.0, centroid_displacement_m: 0.0, survey_area_sqm: 0, area_ratio: 0.0, risk_score: 100.0, decision: 'DISPUTED' };
  }

  try {
    const fOfficial = { type: 'Feature', properties: {}, geometry: state.current.geometry };
    const fSurvey = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [state.surveyCoords] } };

    if (typeof turf !== 'undefined') {
      const aOfficial = turf.area(fOfficial);
      const aSurvey = turf.area(fSurvey);

      let intersectionFeature = null;
      try { intersectionFeature = turf.intersect(turf.featureCollection([fOfficial, fSurvey])); } 
      catch (e) { try { intersectionFeature = turf.intersect(fOfficial, fSurvey); } catch (err) {} }

      const aInt = intersectionFeature ? turf.area(intersectionFeature) : 0;
      const aUnion = aOfficial + aSurvey - aInt;
      const iou = aUnion === 0 ? 0 : (aInt / aUnion);

      const cOfficial = turf.centroid(fOfficial);
      const cSurvey = turf.centroid(fSurvey);
      const centroidShiftM = turf.distance(cOfficial, cSurvey, { units: 'meters' });
      const areaRatio = aSurvey / (aOfficial || 1);
      const riskScore = Math.max(0, Math.min(100, (1 - iou) * 100));

      let decision = "CLEAR";
      if (riskScore > 5 && riskScore <= 20) decision = "UNCERTAIN";
      if (riskScore > 20) decision = "DISPUTED";

      return {
        iou: parseFloat(iou.toFixed(4)),
        centroid_displacement_m: parseFloat(centroidShiftM.toFixed(1)),
        survey_area_sqm: Math.round(aSurvey),
        area_ratio: parseFloat(areaRatio.toFixed(4)),
        risk_score: parseFloat(riskScore.toFixed(1)),
        decision: decision
      };
    }
  } catch (err) {
    console.warn("Live spatial math calculation:", err);
  }

  return { iou: 1.0, centroid_displacement_m: 0.0, survey_area_sqm: Math.round(state.current.area || 4047), area_ratio: 1.0, risk_score: 0.0, decision: 'CLEAR' };
}

function updateLiveHUD(metrics) {
  if (!metrics) return;
  setText('#hud-iou', metrics.iou.toFixed(4));
  setText('#hud-shift', `${metrics.centroid_displacement_m} m`);
  setText('#hud-area', `${metrics.survey_area_sqm.toLocaleString('en-IN')} m²`);
  
  const riskEl = $('#hud-risk');
  if (riskEl) {
    riskEl.className = '';
    if (metrics.decision === 'CLEAR') {
      riskEl.className = 'hud-clear';
      riskEl.textContent = `${metrics.risk_score}% (CLEAR)`;
    } else if (metrics.decision === 'UNCERTAIN') {
      riskEl.className = 'hud-uncertain';
      riskEl.textContent = `${metrics.risk_score}% (UNCERTAIN)`;
    } else {
      riskEl.className = 'hud-disputed';
      riskEl.textContent = `${metrics.risk_score}% (DISPUTED)`;
    }
  }
}

// ==========================================
// 🖱️ FIELD MAP DYNAMIC SHADING & RENDERING
// ==========================================
function renderFieldMapGeometry() {
  if (!state.fieldMap || !state.current || typeof L === 'undefined') return;

  try {
    const officialLatLngs = ringToLatLngs(state.current.geometry.coordinates[0]);

    if (state.fieldOfficialLayer) {
      state.fieldOfficialLayer.setLatLngs(officialLatLngs);
    } else {
      state.fieldOfficialLayer = L.polygon(officialLatLngs, {
        color: '#b45309',
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: '#f59e0b',
        fillOpacity: 0.50,
        fill: true
      }).addTo(state.fieldMap);
    }
    state.fieldOfficialLayer.bringToBack();

    const isClosedPolygon = state.surveyCoords && state.surveyCoords.length >= 4;
    const surveyLatLngs = state.surveyCoords ? ringToLatLngs(state.surveyCoords) : [];

    if (state.surveyCoords && state.surveyCoords.length >= 2 && !isClosedPolygon) {
      if (state.fieldLineLayer) {
        state.fieldLineLayer.setLatLngs(surveyLatLngs);
      } else {
        state.fieldLineLayer = L.polyline(surveyLatLngs, {
          color: '#00e5ff',
          weight: 3.5,
          dashArray: '4, 4'
        }).addTo(state.fieldMap);
      }
    } else if (state.fieldLineLayer) {
      state.fieldMap.removeLayer(state.fieldLineLayer);
      state.fieldLineLayer = null;
    }

    if (state.fieldSurveyLayer) {
      if (isClosedPolygon) {
        state.fieldSurveyLayer.setLatLngs(surveyLatLngs);
      } else {
        state.fieldSurveyLayer.setLatLngs([]);
      }
    } else if (isClosedPolygon) {
      state.fieldSurveyLayer = L.polygon(surveyLatLngs, {
        color: '#0097a7',
        weight: 3.5,
        fillColor: '#00e5ff',
        fillOpacity: 0.58,
        fill: true
      }).addTo(state.fieldMap);
    }
    if (state.fieldSurveyLayer) state.fieldSurveyLayer.bringToFront();

    if (isClosedPolygon) {
      const centroidLngLat = computeCentroid(state.surveyCoords);
      const centroidLatLng = [centroidLngLat[1], centroidLngLat[0]];

      if (!state.centroidMarker) {
        const beaconIcon = L.divIcon({
          className: 'leaflet-centroid-beacon',
          html: '🎯',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        state.centroidMarker = L.marker(centroidLatLng, {
          icon: beaconIcon,
          draggable: true,
          zIndexOffset: 1000
        }).addTo(state.fieldMap);

        let prevPos = null;
        state.centroidMarker.on('dragstart', (e) => { prevPos = e.target.getLatLng(); });
        state.centroidMarker.on('drag', (e) => {
          const currPos = e.target.getLatLng();
          const deltaLat = currPos.lat - prevPos.lat;
          const deltaLng = currPos.lng - prevPos.lng;
          prevPos = currPos;

          state.surveyCoords = state.surveyCoords.map(([lng, lat]) => [lng + deltaLng, lat + deltaLat]);
          if (state.fieldSurveyLayer) state.fieldSurveyLayer.setLatLngs(ringToLatLngs(state.surveyCoords));

          const numVertices = state.surveyCoords.length - 1;
          for (let i = 0; i < numVertices; i++) {
            if (state.vertexMarkers[i]) {
              state.vertexMarkers[i].setLatLng([state.surveyCoords[i][1], state.surveyCoords[i][0]]);
            }
          }

          const metrics = calculateLiveSpatialMetrics();
          updateLiveHUD(metrics);
        });

        state.centroidMarker.on('dragend', () => { onGeometryModified(); });
      } else {
        state.centroidMarker.setLatLng(centroidLatLng);
      }
    } else if (state.centroidMarker) {
      state.fieldMap.removeLayer(state.centroidMarker);
      state.centroidMarker = null;
    }

    const numVertices = state.surveyCoords && state.surveyCoords.length > 1 && 
      state.surveyCoords[0][0] === state.surveyCoords[state.surveyCoords.length - 1][0] && 
      state.surveyCoords[0][1] === state.surveyCoords[state.surveyCoords.length - 1][1]
      ? state.surveyCoords.length - 1
      : (state.surveyCoords ? state.surveyCoords.length : 0);

    while (state.vertexMarkers.length > numVertices) {
      const marker = state.vertexMarkers.pop();
      state.fieldMap.removeLayer(marker);
    }

    const handleIcon = L.divIcon({
      className: 'leaflet-vertex-handle',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    for (let i = 0; i < numVertices; i++) {
      const vertexLatLng = [state.surveyCoords[i][1], state.surveyCoords[i][0]];

      if (state.vertexMarkers[i]) {
        state.vertexMarkers[i].setLatLng(vertexLatLng);
      } else {
        const vMarker = L.marker(vertexLatLng, {
          icon: handleIcon,
          draggable: true,
          zIndexOffset: 900
        }).addTo(state.fieldMap);

        const vertexIndex = i;
        vMarker.on('click', () => {
          if (state.currentShape === 'custom') removeCustomVertex(vertexIndex);
        });

        vMarker.on('drag', (e) => {
          const newPos = e.target.getLatLng();
          state.surveyCoords[vertexIndex] = [newPos.lng, newPos.lat];
          
          if (vertexIndex === 0 && state.surveyCoords.length >= 4) {
            state.surveyCoords[state.surveyCoords.length - 1] = [newPos.lng, newPos.lat];
          }

          if (state.fieldSurveyLayer && state.surveyCoords.length >= 4) {
            state.fieldSurveyLayer.setLatLngs(ringToLatLngs(state.surveyCoords));
          }

          if (state.centroidMarker && state.surveyCoords.length >= 4) {
            const newCentroid = computeCentroid(state.surveyCoords);
            state.centroidMarker.setLatLng([newCentroid[1], newCentroid[0]]);
          }

          const metrics = calculateLiveSpatialMetrics();
          updateLiveHUD(metrics);
        });

        vMarker.on('dragend', () => { onGeometryModified(); });
        state.vertexMarkers.push(vMarker);
      }
    }

    updateCustomToolbar();
    const metrics = calculateLiveSpatialMetrics();
    updateLiveHUD(metrics);
  } catch (err) {
    console.warn("Field map render error:", err);
  }
}

function onGeometryModified() {
  if (state.capture) {
    state.capture = null;
    setBadge($('#field-capture-state'), 'Not captured');
    $('#capture-button').textContent = 'Capture field boundary';
    $('#capture-detail').textContent = 'Boundary modified; capture a new observation.';
    refreshSubmissionButton();
  }
}

function geometryCaption(geometry) {
  const point = geometry?.coordinates?.[0]?.[0];
  return point ? `Recorded origin: ${point[1].toFixed(5)}° N, ${point[0].toFixed(5)}° E · GeoJSON Polygon` : 'Geometry unavailable';
}

function initRegistryMap() {
  const container = document.getElementById('registry-map');
  if (!container || state.registryMap || typeof L === 'undefined') return;

  try {
    const { baseLayers, defaultLayer } = createTileLayers();
    state.registryMap = L.map('registry-map', {
      layers: [defaultLayer],
      zoomControl: true,
      attributionControl: false
    }).setView([16.51, 80.64], 16);

    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(state.registryMap);
  } catch (err) {
    console.warn("Registry map init deferred:", err);
  }
}

function initFieldMap() {
  const container = document.getElementById('field-map');
  if (!container || state.fieldMap || typeof L === 'undefined') return;

  try {
    const { baseLayers, defaultLayer } = createTileLayers();
    state.fieldMap = L.map('field-map', {
      layers: [defaultLayer],
      zoomControl: true,
      attributionControl: false
    }).setView([16.51, 80.64], 16);

    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(state.fieldMap);

    state.fieldMap.on('click', (e) => {
      if (state.currentShape !== 'custom') return;
      handleCustomMapClick(e.latlng);
    });
  } catch (err) {
    console.warn("Field map init deferred:", err);
  }
}

function renderCurrentParcel() {
  if (!state.current) return;
  const parcel = state.current;
  
  $$('[data-current="ulpin"]').forEach((node) => { node.textContent = parcel.ulpin; });
  setText('[data-current="location"]', parcel.source);
  setText('[data-current="parcel-id"]', parcel.parcel_id);
  setText('[data-current="area"]', `${Number(parcel.area).toLocaleString('en-IN')} m²`);
  setText('[data-current="version"]', `v${parcel.version}`);
  setText('#registry-coordinates', geometryCaption(parcel.geometry));
  const select = $('#parcel-select');
  if (select) select.value = parcel.ulpin;

  try {
    if (!state.registryMap && typeof L !== 'undefined') initRegistryMap();
    if (state.registryMap) {
      const latLngs = ringToLatLngs(parcel.geometry.coordinates[0]);
      if (state.registryLayer) {
        state.registryLayer.setLatLngs(latLngs);
      } else {
        state.registryLayer = L.polygon(latLngs, {
          color: '#b45309',
          weight: 3.5,
          dashArray: '6, 6',
          fillColor: '#f59e0b',
          fillOpacity: 0.55,
          fill: true
        }).addTo(state.registryMap);
      }
      const bounds = state.registryLayer.getBounds();
      if (bounds && bounds.isValid && bounds.isValid()) {
        state.registryMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      }
    }
  } catch (e) {
    console.warn("Registry map render warning:", e);
  }

  state.surveyCoords = generateShapeCoords(state.currentShape, parcel.geometry, state.scaleFactor);
  
  try {
    if (!state.fieldMap && typeof L !== 'undefined') initFieldMap();
    if (state.fieldMap) {
      renderFieldMapGeometry();
      if (state.fieldOfficialLayer) {
        const bounds = state.fieldOfficialLayer.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          state.fieldMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
        }
      }
    }
  } catch (e) {
    console.warn("Field map render warning:", e);
  }

  updateWorkflow();
}

function resetCaseState() {
  state.assessment = null;
  state.authenticated = false;
  state.capture = null;
  state.spatialResult = null;
  state.currentShape = 'rect';
  state.scaleFactor = 1.0;
  const scaleInput = $('#fine-scale');
  if (scaleInput) scaleInput.value = 100;
  setText('#scale-val', '100%');
  
  $$('.shape-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.shape === 'rect'));
  updateCustomToolbar();

  $('#authenticate-button').textContent = 'Authenticate device key';
  $('#authentication-state').textContent = 'No device signature attached';
  $('#capture-button').textContent = 'Capture field boundary';
  $('#capture-detail').textContent = 'Adjust or drag field lines, then capture.';
  setBadge($('#field-capture-state'), 'Not captured');
  $('#submit-evidence-button').disabled = true;

  renderAssessment();
  renderSpatialResult();
}

function updateWorkflow() {
  const assessmentState = state.assessment?.evaluation?.state;
  const spatialState = state.spatialResult?.state;
  const decision = state.decisions.get(state.current?.parcel_id);
  const docket = state.dockets.find((item) => item.parcel_id === state.current?.parcel_id);

  setText('#step-assessment', assessmentState ? label(assessmentState) : 'Awaiting review');
  setText('#step-field', spatialState ? label(spatialState) : 'No observation');
  setText('#step-revenue', decision ? label(decision) : (spatialState && spatialState !== 'CLEAR' ? 'Awaiting decision' : 'No decision'));
  setText('#step-tribunal', docket ? 'Title workflow frozen' : 'Not escalated');

  const workflowButtons = $$('.workflow-steps button');
  workflowButtons.forEach((button) => button.classList.remove('workflow-complete', 'workflow-alert'));
  if (assessmentState) workflowButtons[0].classList.add(assessmentState === 'VERIFIED' ? 'workflow-complete' : 'workflow-alert');
  if (spatialState) workflowButtons[1].classList.add(spatialState === 'CLEAR' ? 'workflow-complete' : 'workflow-alert');
  if (decision) workflowButtons[2].classList.add(decision === 'CERTIFIED_CLEAR' ? 'workflow-complete' : 'workflow-alert');
  if (docket) workflowButtons[3].classList.add('workflow-alert');

  setText('#overview-graph-state', assessmentState ? label(assessmentState) : 'Ready for review');
  setText('#overview-sdi-state', spatialState ? label(spatialState) : 'Awaiting observation');
  setText('#overview-decision-state', decision ? label(decision) : 'No decision recorded');
}

function showView(name) {
  if (name === 'gateway') {
    state.userRole = 'gateway';
    updateUserInterfaceRole();
  }

  if (name.startsWith('citizen-')) {
    const subTab = name.replace('citizen-', '');
    showCitizenSubTab(subTab);
    name = 'citizen';
  }

  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  $$('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.navigate === name || button.dataset.navigate === `citizen-${name}`));
  window.location.hash = name;

  const refreshMap = () => {
    try {
      if (name === 'registry') {
        if (!state.registryMap && typeof L !== 'undefined') initRegistryMap();
        if (state.registryMap) {
          state.registryMap.invalidateSize();
          if (state.current) renderCurrentParcel();
        }
      } else if (name === 'field') {
        if (!state.fieldMap && typeof L !== 'undefined') initFieldMap();
        if (state.fieldMap) {
          state.fieldMap.invalidateSize();
          renderFieldMapGeometry();
          if (state.fieldOfficialLayer) {
            const b = state.fieldOfficialLayer.getBounds();
            if (b && b.isValid && b.isValid()) state.fieldMap.fitBounds(b, { padding: [60, 60], maxZoom: 18 });
          }
        }
      } else if (name === 'citizen') {
        state.holdingMaps.forEach(m => m.invalidateSize());
      }
    } catch (err) {
      console.warn("View transition map resize:", err);
    }
  };

  refreshMap();
  window.setTimeout(refreshMap, 150);

  if (name === 'revenue') loadInbox();
  if (name === 'grievances') loadAdminGrievances();
  if (name === 'tribunal') loadDockets();
}

function renderAssessment() {
  const assessment = state.assessment;
  const graph = $('#evidence-graph');
  const flags = $('#assessment-flags');
  const exportBtn = $('#export-assessment-button');
  
  if (!assessment) {
    setText('#assessment-title', 'Select a record');
    setBadge($('#assessment-badge'), 'Not assessed');
    setText('#assessment-summary', 'The graph engine checks whether the authoritative sources describe a coherent parcel history.');
    setText('#assessment-confidence', '—');
    setText('#assessment-authority', '—');
    setText('#assessment-action', '—');
    if (graph) {
      graph.className = 'evidence-graph empty-state';
      graph.replaceChildren(createElement('p', '', 'Run the assessment to build the evidence graph.'));
    }
    if (flags) {
      flags.replaceChildren(flagItem('—', 'Evidence signals will be listed here after the record assessment.'));
    }
    if (exportBtn) exportBtn.disabled = true;
    updateWorkflow();
    return;
  }

  const { evaluation, routing } = assessment;
  setText('#assessment-title', label(evaluation.state));
  setBadge($('#assessment-badge'), evaluation.state);
  setText('#assessment-summary', routing.next_action);
  setText('#assessment-confidence', `${Math.round(evaluation.confidence * 100)}% evidence confidence`);
  setText('#assessment-authority', routing.responsible_authority.replaceAll('_', ' '));
  setText('#assessment-action', routing.next_action);
  
  if (graph) {
    graph.className = 'evidence-graph';
    graph.replaceChildren();
    assessment.graph.nodes.forEach((node, index) => {
      if (index) graph.append(createElement('span', 'graph-arrow'));
      const severity = node.type === 'Court_Case' ? ' graph-court' : (evaluation.state === 'VERIFIED' ? '' : ' graph-alert');
      const card = createElement('div', `graph-node${severity}`);
      card.append(createElement('b', '', node.type.replaceAll('_', ' ')));
      card.append(createElement('small', '', node.source_authority));
      graph.append(card);
    });
  }

  if (flags) {
    flags.replaceChildren(...evaluation.flags.map((item) => flagItem('!', item)));
  }
  if (exportBtn) exportBtn.disabled = false;
  updateWorkflow();
}

function flagItem(symbol, text) {
  const item = createElement('li');
  item.append(createElement('span', 'flag-symbol', symbol), createElement('p', '', text));
  return item;
}

function renderSpatialResult() {
  const result = state.spatialResult;
  if (!result) {
    setBadge($('#spatial-result-badge'), 'Awaiting submission');
    setText('#metric-iou', '—');
    setText('#metric-centroid', '—');
    setText('#metric-area-ratio', '—');
    setText('#metric-risk', '—');
    setText('#spatial-summary', 'A captured, signed observation is required before evaluation.');
    updateWorkflow();
    return;
  }

  const metrics = result.metrics;
  setBadge($('#spatial-result-badge'), result.state);
  setText('#metric-iou', metrics.iou.toFixed(4));
  setText('#metric-centroid', `${metrics.centroid_displacement_m.toFixed(1)} m`);
  setText('#metric-area-ratio', metrics.area_ratio.toFixed(4));
  setText('#metric-risk', `${metrics.risk_score.toFixed(1)}%`);
  setText('#spatial-summary', result.state === 'CLEAR'
    ? 'The observed geometry is within the MVP’s clear consistency threshold.'
    : 'The observation is locked and routed to the Revenue Officer because the spatial evidence exceeds the clear threshold.');
  updateWorkflow();
}

function refreshSubmissionButton() {
  const btn = $('#submit-evidence-button');
  if (btn) btn.disabled = !(state.authenticated && state.capture);
}

async function selectParcel(ulpin) {
  const next = state.parcels.find((parcel) => parcel.ulpin === ulpin);
  if (!next) return;
  state.current = next;
  resetCaseState();
  renderCurrentParcel();
}

async function runAssessment() {
  const button = $('#assess-button');
  setBusy(button, true, 'Assessing evidence…');
  try {
    state.assessment = await api(`/ulpin/assessment/${encodeURIComponent(state.current.ulpin)}`);
    renderAssessment();
    toast(`Evidence assessment completed for ${state.current.ulpin}.`);
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    setBusy(button, false);
  }
}

function authenticateSurveyor() {
  const equip = $('#gnss-equipment')?.value.toUpperCase() || 'RTK';
  state.authenticated = true;
  $('#authenticate-button').textContent = `Device authenticated (${equip})`;
  $('#authentication-state').textContent = `ECDSA signed payload · DEVICE_${equip}_9X`;
  refreshSubmissionButton();
  toast(`Surveyor hardware key authenticated with ${equip} telemetry.`);
}

function captureBoundary() {
  if (!state.surveyCoords || state.surveyCoords.length < 4) {
    toast('Cannot capture: survey plot must have at least 3 vertices.', 'error');
    return;
  }

  const customGeoJSON = {
    type: "Polygon",
    coordinates: [state.surveyCoords]
  };

  const metrics = calculateLiveSpatialMetrics();
  state.capture = {
    geometry: customGeoJSON,
    metrics: metrics,
    capturedAt: new Date().toISOString()
  };

  setBadge($('#field-capture-state'), 'Captured');
  $('#capture-button').textContent = 'Boundary captured';
  $('#capture-detail').textContent = `Frozen with ${metrics.centroid_displacement_m}m shift & ${metrics.survey_area_sqm} m² area.`;
  refreshSubmissionButton();
  toast('Field boundary captured and held for signed submission.');
}

async function submitEvidence() {
  const button = $('#submit-evidence-button');
  setBusy(button, true, 'Submitting evidence…');
  try {
    const result = await api('/pipeline/compare/execute', {
      method: 'POST',
      body: JSON.stringify({
        parcel_id: state.current.parcel_id,
        surveyorId: 'OFFICER_ECDSA_9X',
        legacyPolygon: state.current.geometry,
        surveyPolygon: state.capture.geometry
      })
    });
    state.spatialResult = result;
    renderSpatialResult();
    await refreshCounts();
    toast(result.state === 'CLEAR' ? 'Spatial evidence cleared automated threshold.' : 'Spatial evidence routed to Revenue Desk.');
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    setBusy(button, false);
    refreshSubmissionButton();
  }
}

function rowButton(text, className, handler) {
  const button = createElement('button', `button ${className}`, text);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

function emptyRow(message) {
  const row = createElement('tr', 'empty-row');
  const cell = createElement('td', '', message);
  cell.colSpan = 5;
  row.append(cell);
  return row;
}

function addCell(row, content) {
  const cell = document.createElement('td');
  if (content instanceof Node) cell.append(content); else cell.textContent = content;
  row.append(cell);
  return cell;
}

async function loadInbox() {
  const body = $('#revenue-inbox');
  if (!body) return;
  try {
    const queue = await api('/pipeline/verify/pending');
    setText('#inbox-count', `${queue.queue_count} open ${queue.queue_count === 1 ? 'case' : 'cases'}`);
    body.replaceChildren();
    if (!queue.items.length) {
      body.append(emptyRow('No spatial discrepancies are awaiting a revenue decision.'));
      return;
    }
    queue.items.forEach((item) => {
      const row = document.createElement('tr');
      const ulpin = createElement('span', '', item.ulpin);
      ulpin.append(createElement('span', 'table-subtext', item.parcel_id));
      addCell(row, ulpin);
      addCell(row, item.source);
      const badge = createElement('span');
      setBadge(badge, item.decision);
      addCell(row, badge);
      const evidence = createElement('span', '', `${Number(item.risk_score).toFixed(1)}% risk`);
      evidence.append(createElement('span', 'table-subtext', `${Number(item.hausdorff_distance).toFixed(1)} m estimated shift`));
      addCell(row, evidence);
      const actions = createElement('div', 'table-actions');
      actions.append(
        rowButton('Certify & anchor', 'button-secondary', () => decideCase(item, 'CERTIFIED_CLEAR')),
        rowButton('Escalate', 'button-danger', () => decideCase(item, 'COURT_ESCALATION'))
      );
      addCell(row, actions);
      body.append(row);
    });
  } catch (error) {
    body.replaceChildren(emptyRow(`Unable to load revenue queue: ${error.message}`));
    toast(error.message, 'error');
  }
}

function renderLedgerReceipt(receipt) {
  setBadge($('#ledger-badge'), 'CERTIFIED');
  setText('#ledger-output', [
    `STATUS        ${receipt.message}`,
    `TRANSACTION   ${receipt.hyperledger_receipt.transaction_id}`,
    `ASSET         ${receipt.hyperledger_receipt.parcel_id}`,
    `VERSION       P(${receipt.hyperledger_receipt.version_id - 1}) → P(${receipt.hyperledger_receipt.version_id})`,
    `BLOCK HASH    ${receipt.hyperledger_receipt.current_state_hash}`,
    `ENDORSED BY   ${receipt.network_peers_endorsed.join(', ')}`
  ].join('\n'));
  setText('#overview-ledger-state', 'State transition anchored');
}

async function decideCase(item, decision) {
  try {
    const result = await api('/pipeline/verify/certify', {
      method: 'POST',
      body: JSON.stringify({ parcel_id: item.parcel_id, officer_action: decision, officer_id: state.officerId })
    });
    state.decisions.set(item.parcel_id, decision);
    if (decision === 'COURT_ESCALATION') {
      toast(`Case escalated: ${result.docket.docket_id} created.`);
      await Promise.all([loadInbox(), loadDockets(), refreshCounts()]);
      showView('tribunal');
      updateWorkflow();
      return;
    }
    const parcel = state.parcels.find((entry) => entry.parcel_id === item.parcel_id);
    const receipt = await api('/pipeline/anchor/state-transition', {
      method: 'POST',
      body: JSON.stringify({
        ulpin: parcel.ulpin,
        transition_type: 'BOUNDARY_CORRECTION',
        authority_id: state.officerId,
        evidence_documents: [{ type: 'SPATIAL_SDI_REPORT', reference: `VER-${item.parcel_id}` }],
        new_owners: []
      })
    });
    renderLedgerReceipt(receipt);
    toast(`${item.ulpin} certified and anchored to consortium ledger.`);
    await Promise.all([loadInbox(), refreshCounts()]);
    updateWorkflow();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderDockets(items) {
  const list = $('#docket-list');
  if (!list) return;
  list.replaceChildren();
  if (!items.length) {
    const empty = createElement('div', 'empty-docket');
    empty.append(createElement('span', 'empty-icon', '§'), createElement('h2', '', 'No active judicial holds'), createElement('p', '', 'Escalate a case from the Revenue Desk to freeze its title workflow and create a docket.'));
    list.append(empty);
    updateWorkflow();
    return;
  }
  items.forEach((docket) => {
    const card = createElement('article', 'docket-card');
    const identity = createElement('div');
    identity.append(createElement('p', 'eyebrow', docket.docket_id), createElement('h2', '', docket.ulpin));
    const detail = createElement('div');
    detail.append(createElement('p', '', `The parcel is frozen for litigation. No mutation, partition or ledger transition may proceed until an authorised judicial order is recorded.`), createElement('p', '', `Jurisdiction: ${docket.source} · Opened: ${new Date(docket.created_at).toLocaleString('en-IN')}`));
    
    const actionsWrapper = createElement('div', 'docket-state', '');
    actionsWrapper.style.display = 'flex';
    actionsWrapper.style.flexDirection = 'column';
    actionsWrapper.style.alignItems = 'flex-end';
    actionsWrapper.style.gap = '10px';

    const badge = createElement('span');
    setBadge(badge, docket.status);

    const summonBtn = createElement('button', 'button button-secondary', 'Generate Summons');
    summonBtn.onclick = () => toast(`Legal summons draft generated for ${docket.docket_id}.`);

    actionsWrapper.append(badge, summonBtn);

    card.append(identity, detail, actionsWrapper);
    list.append(card);
  });
  updateWorkflow();
}

async function loadDockets() {
  try {
    const result = await api('/pipeline/verify/dockets');
    state.dockets = result.items;
    renderDockets(result.items);
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function refreshCounts() {
  try {
    const [pending, dockets, grievances] = await Promise.all([
      api('/pipeline/verify/pending'),
      api('/pipeline/verify/dockets'),
      api('/admin/grievances')
    ]);
    setText('#metric-pending', pending.queue_count);
    setText('#metric-dockets', dockets.docket_count);
    setText('#metric-grievances', grievances.pending_count);
    setText('#nav-grievance-count', grievances.pending_count);
    state.dockets = dockets.items;
    updateWorkflow();
  } catch (error) {
    setText('#metric-pending', '—');
    setText('#metric-dockets', '—');
  }
}

async function loadHealth() {
  try {
    const health = await request(`${ORIGIN}/api/health`);
    const gatewayEl = $('#gateway-status');
    if (gatewayEl) {
      gatewayEl.className = 'gateway-status online';
      setText('#gateway-status span:last-child', 'Gateway operational');
    }
    setText('#metric-health', 'Operational');
    setText('#metric-architecture', health.architecture);
  } catch (error) {
    console.error("Gateway health check failed:", error);
    const gatewayEl = $('#gateway-status');
    if (gatewayEl) {
      gatewayEl.className = 'gateway-status offline';
      setText('#gateway-status span:last-child', 'Gateway unavailable');
    }
    setText('#metric-health', 'Offline');
    setText('#metric-architecture', 'Start the API gateway on port 8080');
  }
}

function bindEvents() {
  // Brand Click: returns to portal root based on role
  $('.brand')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.userRole === 'citizen') {
      showView('citizen');
    } else if (state.userRole === 'officer') {
      showView('overview');
    } else {
      showView('gateway');
    }
  });

  // Navigation Links
  $$('[data-navigate]').forEach((element) => element.addEventListener('click', (event) => {
    if (element.tagName === 'A') event.preventDefault();
    showView(element.dataset.navigate);
  }));

  // Citizen Subtabs
  $$('.citizen-tab').forEach((tab) => {
    tab.addEventListener('click', () => showCitizenSubTab(tab.dataset.citizenTab));
  });

  // Switch Portal & Logout
  $('#switch-portal-btn')?.addEventListener('click', () => {
    if (state.userRole === 'citizen') {
      loginAsOfficer('TAHSILDAR_REV_88', '882190');
    } else {
      loginAsCitizen('918247214210', '482910');
    }
  });

  $('#logout-btn')?.addEventListener('click', logout);

  // Citizen Login Form
  $('#citizen-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const aadhaar = $('#citizen-aadhaar-input')?.value;
    const otp = $('#citizen-otp-input')?.value;
    loginAsCitizen(aadhaar, otp);
  });

  $('#citizen-get-otp-btn')?.addEventListener('click', async () => {
    const aadhaar = $('#citizen-aadhaar-input')?.value;
    if (!aadhaar) return toast('Please enter Aadhaar number', 'error');
    try {
      const res = await api('/citizen/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ aadhaar: aadhaar.replace(/\s+/g, '') })
      });
      $('#citizen-otp-input').value = res.simulatedOtp;
      toast(`OTP sent: ${res.simulatedOtp} (${res.message})`);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  // Load all generated citizen profiles into dropdown
  const loadProfilesDropdown = async () => {
    try {
      const res = await api('/citizen/auth/profiles');
      const select = $('#demo-profile-select');
      if (!select) return;
      select.innerHTML = '<option value="">Select a citizen profile...</option>';
      res.profiles.forEach(p => {
        const option = createElement('option', '', `${p.name} (${p.state} · ${p.district})`);
        option.value = p.aadhaar;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };
  loadProfilesDropdown();

  // Reset Demo DB Logic
  const resetDemoData = async () => {
    try {
      if (!confirm('This will wipe all active grievances, dockets, and spatial decisions. Proceed?')) return;
      toast('Purging database...');
      const res = await api('/debug/reset-db', { method: 'POST' });
      toast('✅ ' + res.message);
      setTimeout(() => window.location.reload(), 1500);
    } catch(err) {
      toast('Failed to reset: ' + err.message, 'error');
    }
  };
  $('#reset-demo-btn')?.addEventListener('click', resetDemoData);
  $('#gateway-reset-demo-btn')?.addEventListener('click', resetDemoData);

  $('#load-demo-profile-btn')?.addEventListener('click', () => {
    const aadhaar = $('#demo-profile-select').value;
    if (aadhaar) {
      $('#citizen-aadhaar-input').value = aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
      $('#citizen-otp-input').value = '482910';
      loginAsCitizen(aadhaar, '482910');
    } else {
      toast('Please select a profile first.', 'error');
    }
  });

  // Officer Login Form
  $('#officer-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#officer-id-input')?.value;
    const pin = $('#officer-otp-input')?.value;
    loginAsOfficer(id, pin);
  });

  $('#demo-officer-fill')?.addEventListener('click', () => {
    loginAsOfficer('TAHSILDAR_REV_88', '882190');
  });

  // Citizen Grievance Filing
  $('#file-grievance-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ulpin = $('#grievance-ulpin-select')?.value;
    const category = $('#grievance-category-select')?.value;
    const title = $('#grievance-title-input')?.value;
    const description = $('#grievance-desc-input')?.value;

    const btn = $('#submit-grievance-btn');
    setBusy(btn, true, 'Submitting to Revenue Desk…');

    try {
      const res = await api('/citizen/grievance/create', {
        method: 'POST',
        body: JSON.stringify({
          aadhaar: state.activeCitizen.aadhaar,
          ulpin,
          category,
          title,
          description
        })
      });

      toast(`Grievance ${res.grievance.grievance_id} submitted with Aadhaar e-Sign.`);
      $('#file-grievance-form').reset();
      await loadCitizenDashboard(state.activeCitizen.aadhaar);
      showCitizenSubTab('tracker');
    } catch (err) {
      toast(`Submission failed: ${err.message}`, 'error');
    } finally {
      setBusy(btn, false);
    }
  });

  $('#reset-grievance-btn')?.addEventListener('click', () => {
    $('#file-grievance-form')?.reset();
  });

  // Officer Toolbar & Maps
  $('#parcel-select')?.addEventListener('change', (event) => selectParcel(event.target.value));
  $('#assess-button')?.addEventListener('click', runAssessment);
  $('#export-assessment-button')?.addEventListener('click', () => {
    if (!state.current?.ulpin) return toast('No record selected.', 'error');
    toast('Generating PDF report...');
    window.open(`${API_BASE}/export/${state.current.ulpin}`, '_blank');
  });

  $$('.shape-btn').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.shape-btn').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      state.currentShape = button.dataset.shape;
      
      if (state.current) {
        state.surveyCoords = generateShapeCoords(state.currentShape, state.current.geometry, state.scaleFactor);
        renderFieldMapGeometry();
        onGeometryModified();
      }
      
      if (state.currentShape === 'custom') {
        toast('Custom Vertex Mode: Click map to place vertices, click handles to remove.');
      } else {
        toast(`Switched surveyed plot model to ${button.textContent}.`);
      }
    });
  });

  $('#custom-clear-btn')?.addEventListener('click', () => {
    state.surveyCoords = [];
    renderFieldMapGeometry();
    onGeometryModified();
    toast('Cleared custom vertices. Click anywhere on the map to draw a new shape from scratch.');
  });

  $('#custom-undo-btn')?.addEventListener('click', () => {
    if (!state.surveyCoords || state.surveyCoords.length === 0) return;
    if (state.surveyCoords.length <= 4) {
      state.surveyCoords = [];
      toast('Cleared points. Click map to place vertices.');
    } else {
      const unclosed = state.surveyCoords.slice(0, -1);
      unclosed.pop();
      unclosed.push([unclosed[0][0], unclosed[0][1]]);
      state.surveyCoords = unclosed;
      toast(`Undid last point. ${unclosed.length - 1} vertices remaining.`);
    }
    renderFieldMapGeometry();
    onGeometryModified();
  });

  $('#custom-reset-btn')?.addEventListener('click', () => {
    if (!state.current) return;
    state.surveyCoords = state.current.geometry.coordinates[0].map(([lng, lat]) => [lng, lat]);
    renderFieldMapGeometry();
    onGeometryModified();
    toast('Reset custom vertices to official record boundary.');
  });

  $('#fine-scale')?.addEventListener('input', (e) => {
    const newScale = Number(e.target.value) / 100;
    setText('#scale-val', `${e.target.value}%`);
    if (state.current && state.currentShape !== 'custom' && state.surveyCoords) {
      // Find current centroid of surveyCoords
      let sumLng = 0, sumLat = 0;
      const numPts = state.surveyCoords.length - 1;
      for (let i = 0; i < numPts; i++) {
         sumLng += state.surveyCoords[i][0];
         sumLat += state.surveyCoords[i][1];
      }
      const curCentroid = [sumLng / numPts, sumLat / numPts];
      
      const ratio = state.scaleFactor === 0 ? 1 : newScale / state.scaleFactor;
      state.scaleFactor = newScale;
      
      // Scale all points relative to curCentroid
      state.surveyCoords = state.surveyCoords.map(([lng, lat]) => [
        curCentroid[0] + (lng - curCentroid[0]) * ratio,
        curCentroid[1] + (lat - curCentroid[1]) * ratio
      ]);
      
      renderFieldMapGeometry();
      onGeometryModified();
    }
  });

  $('#authenticate-button')?.addEventListener('click', authenticateSurveyor);
  $('#capture-button')?.addEventListener('click', captureBoundary);
  $('#submit-evidence-button')?.addEventListener('click', submitEvidence);

  $('#gnss-equipment')?.addEventListener('change', (e) => {
    const mapEl = $('#field-map');
    if (!mapEl) return;
    mapEl.classList.remove('gnss-rtk', 'gnss-dgps', 'gnss-handheld');
    mapEl.classList.add(`gnss-${e.target.value}`);
  });

  $('#refresh-inbox-button')?.addEventListener('click', async () => { await loadInbox(); await refreshCounts(); });
  $('#refresh-admin-grievances-btn')?.addEventListener('click', async () => { await loadAdminGrievances(); await refreshCounts(); });
  $('#refresh-dockets-button')?.addEventListener('click', async () => { await loadDockets(); await refreshCounts(); });
  
  const searchInput = $('#revenue-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      $$('#revenue-inbox tr').forEach(row => {
        if (row.classList.contains('empty-row')) return;
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }
}

async function initialise() {
  bindEvents();
  initRealtimeSync();
  await loadHealth();
  try {
    const registry = await api('/ulpin/parcels');
    state.parcels = registry.items;
    setText('#metric-parcels', registry.count);
    const select = $('#parcel-select');
    if (select) {
      select.replaceChildren(...registry.items.map((parcel) => {
        const option = document.createElement('option');
        option.value = parcel.ulpin;
        option.textContent = `${parcel.ulpin} — ${parcel.source}`;
        return option;
      }));
    }
    if (registry.items && registry.items.length > 0) {
      await selectParcel(registry.items[0].ulpin);
    }
    await Promise.all([refreshCounts(), loadAdminGrievances(), loadDockets()]);
    
    // Always start at Gateway mode on clean load unless explicit sub-hash
    const requestedView = window.location.hash.replace('#', '');
    if (requestedView === 'citizen' && state.activeCitizen) {
      state.userRole = 'citizen';
      updateUserInterfaceRole();
      showView('citizen');
    } else if (['overview', 'registry', 'field', 'revenue', 'grievances', 'tribunal'].includes(requestedView)) {
      state.userRole = 'officer';
      updateUserInterfaceRole();
      showView(requestedView);
    } else {
      state.userRole = 'gateway';
      updateUserInterfaceRole();
      showView('gateway');
    }
  } catch (error) {
    console.error("Registry initialization error:", error);
    toast(`Unable to load the registry: ${error.message}`, 'error');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialise);
} else {
  initialise();
}
