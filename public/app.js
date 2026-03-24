// --- API helpers ---
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  if (res.status === 204) return null;
  return res.json();
}

function $(sel, parent = document) { return parent.querySelector(sel); }
function $$(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

// --- Markdown-lite renderer ---
function md(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// --- Navigation ---
let currentPage = 'dashboard';

$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    $$('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    currentPage = item.dataset.page;
    render();
  });
});

// --- Page renderers ---
const pages = {};

pages.dashboard = async () => {
  const [trials, regulatory, grants, projects, stakeholders, events] = await Promise.all([
    api('GET', '/clinical'),
    api('GET', '/regulatory'),
    api('GET', '/grants'),
    api('GET', '/projects'),
    api('GET', '/stakeholders'),
    api('GET', '/events'),
  ]);

  return `
    <h2>Dashboard</h2>
    <p class="subtitle">MedTech operations at a glance</p>
    <div class="dashboard-grid">
      <div class="stat-card"><div class="label">Clinical Trials</div><div class="value">${trials.length}</div></div>
      <div class="stat-card"><div class="label">Regulatory Items</div><div class="value">${regulatory.length}</div></div>
      <div class="stat-card"><div class="label">Grant Proposals</div><div class="value">${grants.length}</div></div>
      <div class="stat-card"><div class="label">Active Projects</div><div class="value">${projects.length}</div></div>
      <div class="stat-card"><div class="label">Stakeholders</div><div class="value">${stakeholders.length}</div></div>
      <div class="stat-card"><div class="label">Events</div><div class="value">${events.length}</div></div>
    </div>
    <div class="card">
      <h3>Quick Actions</h3>
      <div class="btn-group" style="flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigate('grants')">Draft Grant Proposal</button>
        <button class="btn btn-primary" onclick="navigate('clinical')">Plan Clinical Study</button>
        <button class="btn btn-primary" onclick="navigate('regulatory')">Regulatory Strategy</button>
        <button class="btn btn-secondary" onclick="navigate('projects')">Manage Projects</button>
        <button class="btn btn-secondary" onclick="navigate('presentations')">Create Presentation</button>
      </div>
    </div>`;
};

function navigate(page) {
  $$('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.page === page);
  });
  currentPage = page;
  render();
}

// --- CRUD + AI page builder ---
function buildCrudPage({ title, subtitle, collection, apiPath, fields, aiTools }) {
  return async () => {
    const items = await api('GET', apiPath);
    const fieldInputs = fields.map(f => `
      <div class="form-group">
        <label>${f.label}</label>
        ${f.type === 'textarea'
          ? `<textarea id="field-${f.key}" placeholder="${f.placeholder || ''}"></textarea>`
          : f.type === 'select'
            ? `<select id="field-${f.key}">${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`
            : `<input type="text" id="field-${f.key}" placeholder="${f.placeholder || ''}">`}
      </div>`).join('');

    const aiToolCards = aiTools.map(t => `
      <div class="card">
        <h3>${t.title}</h3>
        <p class="subtitle" style="margin-bottom:16px">${t.description}</p>
        ${t.fields.map(f => `
          <div class="form-group">
            <label>${f.label}</label>
            ${f.type === 'textarea'
              ? `<textarea id="ai-${t.id}-${f.key}" placeholder="${f.placeholder || ''}"></textarea>`
              : `<input type="text" id="ai-${t.id}-${f.key}" placeholder="${f.placeholder || ''}">`}
          </div>`).join('')}
        <button class="btn btn-primary" onclick="runAI('${t.id}', '${t.endpoint}', ${JSON.stringify(t.fields.map(f=>f.key))})">
          Generate with AI
        </button>
        <div id="ai-output-${t.id}"></div>
      </div>`).join('');

    const itemRows = items.length
      ? items.map(item => `
        <div class="item-row">
          <div>
            <div class="name">${item[fields[0].key] || 'Untitled'}</div>
            <div class="meta">${item.status || ''} &middot; ${new Date(item.createdAt).toLocaleDateString()}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="status-badge status-${(item.status || 'planning').toLowerCase()}">${item.status || 'Planning'}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('${apiPath}', '${item.id}')">Delete</button>
          </div>
        </div>`).join('')
      : '<div class="empty-state"><div class="icon">&#128203;</div><p>No items yet. Add one below.</p></div>';

    return `
      <h2>${title}</h2>
      <p class="subtitle">${subtitle}</p>

      <div class="tabs">
        <button class="tab active" onclick="showTab(this, 'tab-items-${collection}')">Items (${items.length})</button>
        <button class="tab" onclick="showTab(this, 'tab-add-${collection}')">Add New</button>
        <button class="tab" onclick="showTab(this, 'tab-ai-${collection}')">AI Tools</button>
      </div>

      <div id="tab-items-${collection}" class="tab-content">
        <div class="item-list">${itemRows}</div>
      </div>

      <div id="tab-add-${collection}" class="tab-content" style="display:none">
        <div class="card">
          <h3>Add ${title.replace(/s$/, '')}</h3>
          ${fieldInputs}
          <div class="form-group">
            <label>Status</label>
            <select id="field-status">
              <option>Planning</option>
              <option>Active</option>
              <option>Completed</option>
              <option>On Hold</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="addItem('${apiPath}', ${JSON.stringify(fields.map(f=>f.key))})">Save</button>
        </div>
      </div>

      <div id="tab-ai-${collection}" class="tab-content" style="display:none">
        ${aiToolCards}
      </div>`;
  };
}

// --- Tab switching ---
window.showTab = function(btn, tabId) {
  const parent = btn.closest('.main') || document.getElementById('content');
  $$('.tab-content', parent).forEach(t => t.style.display = 'none');
  $$('.tab', parent).forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).style.display = 'block';
};

// --- CRUD actions ---
window.addItem = async function(apiPath, keys) {
  const body = {};
  keys.forEach(k => { body[k] = $(`#field-${k}`).value; });
  body.status = $('#field-status').value;
  await api('POST', apiPath, body);
  render();
};

window.deleteItem = async function(apiPath, id) {
  await api('DELETE', `${apiPath}/${id}`);
  render();
};

// --- AI actions ---
window.runAI = async function(toolId, endpoint, keys) {
  const body = {};
  keys.forEach(k => { body[k] = $(`#ai-${toolId}-${k}`).value; });
  const output = document.getElementById(`ai-output-${toolId}`);
  output.innerHTML = '<div class="loading"><div class="spinner"></div> Generating with AI... this may take a moment</div>';

  try {
    const result = await api('POST', endpoint, body);
    const text = Object.values(result)[0];
    output.innerHTML = `<div class="ai-output">${md(text)}</div>`;
  } catch (err) {
    output.innerHTML = `<div class="ai-output" style="border-color:var(--red)">Error: ${err.message}. Check that your ANTHROPIC_API_KEY is set.</div>`;
  }
};

// --- Page definitions ---
pages.clinical = buildCrudPage({
  title: 'Clinical Trials',
  subtitle: 'Manage clinical studies and generate AI-powered study plans',
  collection: 'clinical',
  apiPath: '/clinical',
  fields: [
    { key: 'trialName', label: 'Trial Name', placeholder: 'e.g. CLARITY-1 Pivotal Study' },
    { key: 'indication', label: 'Indication', placeholder: 'e.g. Early detection of sepsis' },
    { key: 'phase', label: 'Phase', type: 'select', options: ['Feasibility', 'Pilot', 'Pivotal', 'Post-Market'] },
    { key: 'sites', label: 'Number of Sites', placeholder: 'e.g. 5' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional context...' },
  ],
  aiTools: [
    {
      id: 'study-plan', title: 'Generate Study Plan', endpoint: '/clinical/ai/study-plan',
      description: 'AI generates a comprehensive clinical study plan with timeline, endpoints, and risk mitigation.',
      fields: [
        { key: 'trialName', label: 'Trial Name', placeholder: 'e.g. CLARITY-1' },
        { key: 'indication', label: 'Indication', placeholder: 'e.g. Sepsis detection' },
        { key: 'phase', label: 'Phase', placeholder: 'e.g. Pivotal' },
        { key: 'sites', label: 'Sites', placeholder: 'e.g. 5 NHS trusts' },
        { key: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any specific requirements...' },
      ],
    },
    {
      id: 'protocol', title: 'Draft Protocol Synopsis', endpoint: '/clinical/ai/protocol-synopsis',
      description: 'AI drafts an ICH-GCP compliant protocol synopsis for your trial.',
      fields: [
        { key: 'trialName', label: 'Trial Name', placeholder: 'e.g. CLARITY-1' },
        { key: 'indication', label: 'Indication', placeholder: 'e.g. Sepsis detection' },
        { key: 'phase', label: 'Phase', placeholder: 'e.g. Pivotal' },
        { key: 'deviceDescription', label: 'Device Description', type: 'textarea', placeholder: 'Describe the medical device...' },
        { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any extras...' },
      ],
    },
  ],
});

pages.regulatory = buildCrudPage({
  title: 'Regulatory',
  subtitle: 'Track regulatory submissions and generate AI-powered strategies',
  collection: 'regulatory',
  apiPath: '/regulatory',
  fields: [
    { key: 'deviceName', label: 'Device Name', placeholder: 'e.g. SepsisAI Diagnostic' },
    { key: 'classification', label: 'Classification', placeholder: 'e.g. Class IIa (EU MDR)' },
    { key: 'targetMarkets', label: 'Target Markets', placeholder: 'e.g. UK, EU, US' },
    { key: 'deviceDescription', label: 'Description', type: 'textarea', placeholder: 'Device description...' },
  ],
  aiTools: [
    {
      id: 'reg-strategy', title: 'Generate Regulatory Strategy', endpoint: '/regulatory/ai/strategy',
      description: 'AI creates a multi-market regulatory strategy with timelines and standards mapping.',
      fields: [
        { key: 'deviceName', label: 'Device Name', placeholder: 'e.g. SepsisAI Diagnostic' },
        { key: 'classification', label: 'Classification', placeholder: 'e.g. Class IIa' },
        { key: 'targetMarkets', label: 'Target Markets', placeholder: 'UK, EU, US' },
        { key: 'deviceDescription', label: 'Description', type: 'textarea', placeholder: 'Describe the device...' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'gap-analysis', title: 'Regulatory Gap Analysis', endpoint: '/regulatory/ai/gap-analysis',
      description: 'AI identifies gaps in your regulatory submission readiness.',
      fields: [
        { key: 'deviceName', label: 'Device Name', placeholder: 'e.g. SepsisAI Diagnostic' },
        { key: 'currentStatus', label: 'Current Status', type: 'textarea', placeholder: 'Where are you now? e.g. Design verification complete, no clinical data yet...' },
        { key: 'targetSubmission', label: 'Target Submission', placeholder: 'e.g. UKCA marking Q3 2026' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
  ],
});

pages.grants = buildCrudPage({
  title: 'Grant Proposals',
  subtitle: 'Track grants and use AI to draft high-impact proposals',
  collection: 'grants',
  apiPath: '/grants',
  fields: [
    { key: 'projectTitle', label: 'Project Title', placeholder: 'e.g. AI-Powered Sepsis Early Warning System' },
    { key: 'grantBody', label: 'Funding Body', placeholder: 'e.g. Innovate UK, NIHR, Horizon Europe' },
    { key: 'fundingAmount', label: 'Funding Amount', placeholder: 'e.g. £500,000' },
    { key: 'projectSummary', label: 'Summary', type: 'textarea', placeholder: 'Brief project description...' },
  ],
  aiTools: [
    {
      id: 'grant-draft', title: 'Draft Full Proposal', endpoint: '/grants/ai/draft',
      description: 'AI drafts a complete grant proposal with work packages, impact plan, and budget justification.',
      fields: [
        { key: 'grantBody', label: 'Funding Body', placeholder: 'e.g. Innovate UK Biomedical Catalyst' },
        { key: 'fundingAmount', label: 'Funding Amount', placeholder: 'e.g. £500,000' },
        { key: 'projectTitle', label: 'Project Title', placeholder: 'Title of your project' },
        { key: 'projectSummary', label: 'Project Summary', type: 'textarea', placeholder: 'Describe your project in 2-3 paragraphs...' },
        { key: 'teamBackground', label: 'Team Background', type: 'textarea', placeholder: 'Key team members and expertise...' },
        { key: 'notes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
    {
      id: 'grant-strengthen', title: 'Strengthen Existing Text', endpoint: '/grants/ai/strengthen',
      description: 'Paste in your draft text and AI will improve it to score higher against funder criteria.',
      fields: [
        { key: 'text', label: 'Your Draft Text', type: 'textarea', placeholder: 'Paste your existing grant text here...' },
        { key: 'grantBody', label: 'Funding Body', placeholder: 'e.g. Innovate UK' },
        { key: 'criteria', label: 'Assessment Criteria', type: 'textarea', placeholder: 'e.g. Innovation, Impact, Feasibility, Value for Money' },
      ],
    },
  ],
});

pages.projects = buildCrudPage({
  title: 'Projects',
  subtitle: 'Track projects and use AI for breakdowns and status reports',
  collection: 'projects',
  apiPath: '/projects',
  fields: [
    { key: 'projectName', label: 'Project Name', placeholder: 'e.g. NHS Pilot Programme' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What is this project about?' },
    { key: 'deadline', label: 'Deadline', placeholder: 'e.g. 2026-06-30' },
    { key: 'teamSize', label: 'Team Size', placeholder: 'e.g. 3' },
  ],
  aiTools: [
    {
      id: 'proj-breakdown', title: 'Project Breakdown', endpoint: '/projects/ai/breakdown',
      description: 'AI creates a full work breakdown structure with dependencies and estimates.',
      fields: [
        { key: 'projectName', label: 'Project Name', placeholder: 'e.g. NHS Pilot Programme' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the project...' },
        { key: 'deadline', label: 'Deadline', placeholder: 'e.g. 2026-06-30' },
        { key: 'teamSize', label: 'Team Size', placeholder: 'e.g. 3' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'status-report', title: 'Weekly Status Report', endpoint: '/projects/ai/status-report',
      description: 'AI generates a professional weekly status update for founders and stakeholders.',
      fields: [
        { key: 'projectName', label: 'Project Name', placeholder: 'e.g. NHS Pilot Programme' },
        { key: 'completedThisWeek', label: 'Completed This Week', type: 'textarea', placeholder: 'What was done...' },
        { key: 'plannedNextWeek', label: 'Planned Next Week', type: 'textarea', placeholder: 'What is coming up...' },
        { key: 'blockers', label: 'Blockers', type: 'textarea', placeholder: 'Any blockers...' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
  ],
});

pages.stakeholders = buildCrudPage({
  title: 'Stakeholders',
  subtitle: 'Manage relationships with NHS, MIT, Harvard, and other partners',
  collection: 'stakeholders',
  apiPath: '/stakeholders',
  fields: [
    { key: 'stakeholderName', label: 'Name', placeholder: 'e.g. Dr Sarah Chen' },
    { key: 'organisation', label: 'Organisation', placeholder: 'e.g. NHS England, MIT, Harvard' },
    { key: 'role', label: 'Role', placeholder: 'e.g. Clinical Lead' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Relationship context...' },
  ],
  aiTools: [
    {
      id: 'draft-comms', title: 'Draft Communication', endpoint: '/stakeholders/ai/draft-comms',
      description: 'AI drafts a professional email or message for a specific stakeholder.',
      fields: [
        { key: 'stakeholderName', label: 'Stakeholder Name', placeholder: 'e.g. Dr Sarah Chen' },
        { key: 'organisation', label: 'Organisation', placeholder: 'e.g. NHS England' },
        { key: 'context', label: 'Context', type: 'textarea', placeholder: 'Background on the relationship...' },
        { key: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'What do you want to achieve?' },
        { key: 'tone', label: 'Tone', placeholder: 'e.g. Formal, Collaborative, Urgent' },
      ],
    },
    {
      id: 'stakeholder-map', title: 'Stakeholder Mapping', endpoint: '/stakeholders/ai/mapping',
      description: 'AI creates a power/interest grid and engagement strategy for your stakeholders.',
      fields: [
        { key: 'projectContext', label: 'Project Context', type: 'textarea', placeholder: 'What project is this for?' },
        { key: 'stakeholderList', label: 'Stakeholders', type: 'textarea', placeholder: 'List stakeholders, one per line with org...' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
  ],
});

pages.events = buildCrudPage({
  title: 'Events',
  subtitle: 'Plan webinars, conferences, and stakeholder engagement events',
  collection: 'events',
  apiPath: '/events',
  fields: [
    { key: 'eventName', label: 'Event Name', placeholder: 'e.g. Q2 NHS Innovation Webinar' },
    { key: 'eventType', label: 'Type', type: 'select', options: ['Webinar', 'Conference', 'Workshop', 'Demo Day', 'Investor Event', 'Other'] },
    { key: 'date', label: 'Date', placeholder: 'e.g. 2026-05-15' },
    { key: 'audience', label: 'Target Audience', placeholder: 'e.g. NHS clinicians, MedTech investors' },
  ],
  aiTools: [
    {
      id: 'event-plan', title: 'Event Planning', endpoint: '/events/ai/plan',
      description: 'AI creates a full event plan with run-of-show, marketing timeline, and success metrics.',
      fields: [
        { key: 'eventName', label: 'Event Name', placeholder: 'e.g. Q2 NHS Innovation Webinar' },
        { key: 'eventType', label: 'Type', placeholder: 'e.g. Webinar' },
        { key: 'date', label: 'Date', placeholder: 'e.g. 2026-05-15' },
        { key: 'audience', label: 'Target Audience', type: 'textarea', placeholder: 'Who is this for?' },
        { key: 'budget', label: 'Budget', placeholder: 'e.g. £2,000' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
  ],
});

pages.presentations = async () => {
  const aiToolCards = [
    {
      id: 'pres-outline', title: 'Presentation Outline', endpoint: '/presentations/ai/outline',
      description: 'AI creates a slide-by-slide outline with speaker notes and design recommendations.',
      fields: [
        { key: 'topic', label: 'Topic', placeholder: 'e.g. Series A Investor Pitch' },
        { key: 'audience', label: 'Audience', placeholder: 'e.g. VC investors, NHS board' },
        { key: 'duration', label: 'Duration', placeholder: 'e.g. 15 minutes' },
        { key: 'keyMessages', label: 'Key Messages', type: 'textarea', placeholder: 'What are the 2-3 things the audience must remember?' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
    {
      id: 'talking-points', title: 'Talking Points', endpoint: '/presentations/ai/talking-points',
      description: 'AI generates structured talking points with anticipated Q&A.',
      fields: [
        { key: 'context', label: 'Context', type: 'textarea', placeholder: 'e.g. Presenting our clinical trial results at MedTech World...' },
        { key: 'audience', label: 'Audience', placeholder: 'e.g. Healthcare professionals, investors' },
        { key: 'keyObjectives', label: 'Key Objectives', type: 'textarea', placeholder: 'What do you want to achieve?' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
  ];

  const toolsHtml = aiToolCards.map(t => `
    <div class="card">
      <h3>${t.title}</h3>
      <p class="subtitle" style="margin-bottom:16px">${t.description}</p>
      ${t.fields.map(f => `
        <div class="form-group">
          <label>${f.label}</label>
          ${f.type === 'textarea'
            ? `<textarea id="ai-${t.id}-${f.key}" placeholder="${f.placeholder || ''}"></textarea>`
            : `<input type="text" id="ai-${t.id}-${f.key}" placeholder="${f.placeholder || ''}">`}
        </div>`).join('')}
      <button class="btn btn-primary" onclick="runAI('${t.id}', '${t.endpoint}', ${JSON.stringify(t.fields.map(f=>f.key))})">
        Generate with AI
      </button>
      <div id="ai-output-${t.id}"></div>
    </div>`).join('');

  return `
    <h2>Presentations</h2>
    <p class="subtitle">AI-powered presentation planning and talking point generation</p>
    ${toolsHtml}`;
};

// --- Render ---
async function render() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';
  try {
    content.innerHTML = await pages[currentPage]();
  } catch (err) {
    content.innerHTML = `<div class="card"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

render();
