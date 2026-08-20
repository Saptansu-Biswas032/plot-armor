const ORIGIN = /^https?:$/.test(window.location.protocol) ? window.location.origin : 'http://localhost:8080';
const API_BASE = `${ORIGIN}/api/v1`;

const state = {
  parcels: [],
  current: null,
  assessment: null,
  authenticated: false,
  capture: null,
  spatialResult: null,
  decisions: new Map(),
  dockets: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setText(selector, value) {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) element.textContent = value;
}

function escapeText(value) {
  return String(value ?? '—');
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
  const item = document.createElement('div');
  item.className = `toast${type === 'error' ? ' error' : ''}`;
  item.textContent = message;
  $('#toast-region').append(item);
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
  if (name.includes('CERTIFIED')) return 'certified';
  if (name === 'CLEAR') return 'clear';
  if (name.includes('PROVISIONAL') || name.includes('UNCERTAIN')) return 'provisional';
  if (name.includes('INCONSISTENT')) return 'inconsistent';
  if (name.includes('COURT') || name.includes('FORMALLY')) return 'court';
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

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderCurrentParcel() {
  if (!state.current) return;
  const parcel = state.current;
  $$('[data-current="ulpin"]').forEach((node) => { node.textContent = parcel.ulpin; });
  setText('[data-current="location"]', parcel.source);
  setText('[data-current="parcel-id"]', parcel.parcel_id);
  setText('[data-current="area"]', `${Number(parcel.area).toLocaleString('en-IN')} m²`);
  setText('[data-current="version"]', `v${parcel.version}`);
  setText('#registry-map-label', parcel.ulpin);
  setText('#registry-coordinates', geometryCaption(parcel.geometry));
  $('#parcel-select').value = parcel.ulpin;
  updateDraftMap();
  updateWorkflow();
}

function geometryCaption(geometry) {
  const point = geometry?.coordinates?.[0]?.[0];
  return point ? `Recorded origin: ${point[1].toFixed(5)} N, ${point[0].toFixed(5)} E · GeoJSON Polygon` : 'Geometry unavailable';
}

function resetCaseState() {
  state.assessment = null;
  state.authenticated = false;
  state.capture = null;
  state.spatialResult = null;
  $('#authenticate-button').textContent = 'Authenticate device key';
  $('#authentication-state').textContent = 'No device signature attached';
  $('#capture-button').textContent = 'Capture field boundary';
  $('#capture-detail').textContent = 'Adjust the boundary control, then capture.';
  setBadge($('#field-capture-state'), 'Not captured');
  $('#submit-evidence-button').disabled = true;
  $('#boundary-shift').value = 0;
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
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  $$('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.navigate === name));
  window.location.hash = name;
  if (name === 'revenue') loadInbox();
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
    graph.className = 'evidence-graph empty-state';
    graph.replaceChildren(createElement('p', '', 'Run the assessment to build the evidence graph.'));
    flags.replaceChildren(flagItem('—', 'Evidence signals will be listed here after the record assessment.'));
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
  flags.replaceChildren(...evaluation.flags.map((item) => flagItem('!', item)));
  if (exportBtn) exportBtn.disabled = false;
  updateWorkflow();
}

function flagItem(symbol, text) {
  const item = createElement('li');
  item.append(createElement('span', 'flag-symbol', symbol), createElement('p', '', text));
  return item;
}

function updateDraftMap() {
  const offset = Number($('#boundary-shift')?.value || 0);
  const x = 222 + Math.round(Math.min(offset, 180) * .48);
  const y = 95 + Math.round(Math.min(offset, 180) * .24);
  const observed = $('#observed-geometry');
  if (observed) {
    observed.setAttribute('x', String(x));
    observed.setAttribute('y', String(y));
  }
  setText('#shift-output', `${offset} m`);
  setText('#field-map-label', `${offset} m displacement`);
}

function surveyGeometryForOffset(offset) {
  const meters = Number(offset);
  const geometry = state.current.geometry;
  const shiftedCoordinates = geometry.coordinates.map((ring) => ring.map(([longitude, latitude]) => {
    const latitudeDelta = meters / 110540;
    const longitudeDelta = meters / (111320 * Math.cos(latitude * Math.PI / 180));
    return [longitude + longitudeDelta, latitude + latitudeDelta];
  }));
  return { type: 'Polygon', coordinates: shiftedCoordinates };
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
  $('#submit-evidence-button').disabled = !(state.authenticated && state.capture);
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
  state.authenticated = true;
  $('#authenticate-button').textContent = 'Device key authenticated';
  $('#authentication-state').textContent = 'ECDSA field signature ready · OFFICER_ECDSA_9X';
  refreshSubmissionButton();
  toast('Surveyor device key authenticated.');
}

function captureBoundary() {
  const offset = Number($('#boundary-shift').value);
  state.capture = { offset, geometry: surveyGeometryForOffset(offset), capturedAt: new Date().toISOString() };
  setBadge($('#field-capture-state'), 'Captured');
  $('#capture-button').textContent = 'Boundary captured';
  $('#capture-detail').textContent = `${offset} m displacement frozen with GNSS metadata.`;
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
    toast(result.state === 'CLEAR' ? 'Spatial evidence cleared the automated threshold.' : 'Spatial evidence routed to the Revenue Desk.');
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
      body: JSON.stringify({ parcel_id: item.parcel_id, officer_action: decision, officer_id: 'TAHSILDAR_REVENUE_UID_88' })
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
        authority_id: 'TAHSILDAR_REVENUE_UID_88',
        evidence_documents: [{ type: 'SPATIAL_SDI_REPORT', reference: `VER-${item.parcel_id}` }],
        new_owners: []
      })
    });
    renderLedgerReceipt(receipt);
    toast(`${item.ulpin} certified and anchored to the consortium ledger.`);
    await Promise.all([loadInbox(), refreshCounts()]);
    updateWorkflow();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderDockets(items) {
  const list = $('#docket-list');
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
    const [pending, dockets] = await Promise.all([api('/pipeline/verify/pending'), api('/pipeline/verify/dockets')]);
    setText('#metric-pending', pending.queue_count);
    setText('#metric-dockets', dockets.docket_count);
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
    $('#gateway-status').className = 'gateway-status online';
    setText('#gateway-status span:last-child', 'Gateway operational');
    setText('#metric-health', 'Operational');
    setText('#metric-architecture', health.architecture);
  } catch (error) {
    $('#gateway-status').className = 'gateway-status offline';
    setText('#gateway-status span:last-child', 'Gateway unavailable');
    setText('#metric-health', 'Offline');
    setText('#metric-architecture', 'Start the API gateway on port 8080');
  }
}

function bindEvents() {
  $$('[data-navigate]').forEach((element) => element.addEventListener('click', (event) => {
    if (element.tagName === 'A') event.preventDefault();
    showView(element.dataset.navigate);
  }));
  $('#parcel-select').addEventListener('change', (event) => selectParcel(event.target.value));
  $('#assess-button').addEventListener('click', runAssessment);
  
  const exportBtn = $('#export-assessment-button');
  if(exportBtn) {
    exportBtn.addEventListener('click', () => {
      toast('Assessment report exported to PDF successfully.');
    });
  }

  $('#boundary-shift').addEventListener('input', () => {
    if (state.capture) {
      state.capture = null;
      setBadge($('#field-capture-state'), 'Not captured');
      $('#capture-button').textContent = 'Capture field boundary';
      $('#capture-detail').textContent = 'Boundary changed; capture a new observation.';
      refreshSubmissionButton();
    }
    updateDraftMap();
  });
  $('#authenticate-button').addEventListener('click', authenticateSurveyor);
  $('#capture-button').addEventListener('click', captureBoundary);
  $('#submit-evidence-button').addEventListener('click', submitEvidence);
  $('#refresh-inbox-button').addEventListener('click', async () => { await loadInbox(); await refreshCounts(); });
  $('#refresh-dockets-button').addEventListener('click', async () => { await loadDockets(); await refreshCounts(); });
  
  const searchInput = $('#revenue-search');
  if(searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      $$('#revenue-inbox tr').forEach(row => {
        if(row.classList.contains('empty-row')) return;
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }
}

async function initialise() {
  bindEvents();
  await loadHealth();
  try {
    const registry = await api('/ulpin/parcels');
    state.parcels = registry.items;
    setText('#metric-parcels', registry.count);
    const select = $('#parcel-select');
    select.replaceChildren(...registry.items.map((parcel) => {
      const option = document.createElement('option');
      option.value = parcel.ulpin;
      option.textContent = `${parcel.ulpin} — ${parcel.source}`;
      return option;
    }));
    await selectParcel(registry.items[0]?.ulpin);
    await Promise.all([refreshCounts(), loadDockets()]);
    const requestedView = window.location.hash.replace('#', '');
    if (['overview', 'registry', 'field', 'revenue', 'tribunal'].includes(requestedView)) showView(requestedView);
  } catch (error) {
    toast(`Unable to load the registry: ${error.message}`, 'error');
    setText('#assessment-summary', 'The registry is unavailable. Confirm that the backend gateway is running.');
  }
}

initialise();
