/* ================================================================
   CareerLink — frontend logic (Phase 2 + OS concepts + full-screen modal)
   ================================================================ */

/* ---------- inline SVG icons ---------- */
const ICONS = {
  target:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  file:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  user:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  bell:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  chart:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  users:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  layers:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>`,
  close:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  expand:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
};

/* ---------- helpers ---------- */
const $id = (x) => document.getElementById(x);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
  c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const token = () => localStorage.getItem("cl_token") || "";

const authHeaders = (json = true) => {
  const h = { "Authorization": `Bearer ${token()}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
};

async function api(path, opts = {}) {
  const r = await fetch(path, opts);
  let body = null;
  try { body = await r.json(); } catch (_) {}
  if (r.status === 401 && token()) { hardLogout(); throw new Error("Session expired"); }
  if (!r.ok) throw new Error((body && body.error) || `Request failed (${r.status})`);
  return body;
}

const state = { role: null, user: null, allSkills: [], statsTimer: null, lastOpps: [] };

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, kind = "") {
  const t = $id("toast");
  t.textContent = msg;
  t.className = "toast show " + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ================================================================
   AUTH SCREEN
   ================================================================ */
let authRole = "student";

function showAuthStep(id) {
  ["stLogin","stRegister","stForgot","adLogin"].forEach(x => $id(x).classList.remove("on"));
  $id(id).classList.add("on");
  ["stLoginErr","rgErr","fpErr","adLoginErr"].forEach(x => { $id(x).style.display = "none"; });
}

function showErr(id, msg) {
  const el = $id(id);
  el.textContent = msg;
  el.style.display = "block";
}

function goRegisterStep(n) {
  [1,2,3].forEach(i => {
    $id("rgStep" + i).classList.toggle("on", i === n);
  });
  document.querySelectorAll(".regprogress .dot").forEach((d, i) =>
    d.classList.toggle("on", i < n));
}

document.querySelectorAll(".roletabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".roletabs button").forEach(x =>
    x.setAttribute("aria-selected", x === b));
  authRole = b.dataset.role;
  ["stEmail","stPass","rgName","rgRoll","rgEmail","rgPass","rgPass2","rgOtp",
   "fpEmail","fpOtp","fpPass","fpPass2","adEmail","adPass"].forEach(x => $id(x).value = "");
  goRegisterStep(1);
  $id("fpStep1").style.display = "block";
  $id("fpStep2").style.display = "none";
  showAuthStep(authRole === "student" ? "stLogin" : "adLogin");
});

/* --- student: login --- */
$id("stLoginBtn").onclick = async () => {
  const email = $id("stEmail").value.trim().toLowerCase();
  const password = $id("stPass").value;
  if (!email || !password) return showErr("stLoginErr", "Enter email and password");
  try {
    const j = await api("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "student", email, password }),
    });
    localStorage.setItem("cl_token", j.token);
    enterApp(j.role, j.user);
  } catch (e) { showErr("stLoginErr", e.message); }
};
$id("stLogin").addEventListener("keydown", e => { if (e.key === "Enter") $id("stLoginBtn").click(); });

$id("stRegisterLink").onclick = e => { e.preventDefault(); showAuthStep("stRegister"); goRegisterStep(1); };
$id("stBackLogin").onclick = e => { e.preventDefault(); showAuthStep("stLogin"); };
$id("stForgotLink").onclick = e => { e.preventDefault(); showAuthStep("stForgot"); };
$id("fpBack").onclick = e => { e.preventDefault(); showAuthStep("stLogin"); };

/* --- register step 1 → check roll+email, then send OTP --- */
$id("rgSendOtp").onclick = async () => {
  const email = $id("rgEmail").value.trim().toLowerCase();
  const name = $id("rgName").value.trim();
  const roll = $id("rgRoll").value.trim().toUpperCase();
  const pass = $id("rgPass").value;
  const pass2 = $id("rgPass2").value;

  if (!email.endsWith("@gmail.com")) return showErr("rgErr", "Use a @gmail.com email address");
  if (name.length < 2) return showErr("rgErr", "Enter your full name");
  if (!roll) return showErr("rgErr", "Enter your roll number");
  if (pass.length < 8) return showErr("rgErr", "Password must be at least 8 characters");
  if (pass !== pass2) return showErr("rgErr", "Passwords don't match");

  $id("rgErr").style.display = "none";
  const btn = $id("rgSendOtp");
  btn.disabled = true; btn.textContent = "Checking records…";

  try {
    const check = await api("/api/auth/check-student", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roll_no: roll, email }),
    });
    if (check.name && check.name.trim().toLowerCase() !== name.toLowerCase()) {
      $id("rgName").value = check.name;
    }
    if (check.branch) {
      const sel = $id("rgBranch");
      [...sel.options].forEach(o => { if (o.value === check.branch) sel.value = o.value; });
    }

    btn.textContent = "Sending code…";
    await api("/api/auth/send-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roll_no: roll, purpose: "register" }),
    });

    $id("rgEmailEcho").textContent = email;
    goRegisterStep(2);
    $id("rgOtp").focus();
    toast("Verification code sent", "ok");
  } catch (e) {
    showErr("rgErr", e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Send verification code";
  }
};

/* --- register step 2 → verify OTP --- */
$id("rgVerify").onclick = async () => {
  const email = $id("rgEmail").value.trim().toLowerCase();
  const otp = $id("rgOtp").value.trim();
  if (otp.length !== 6) return showErr("rgErr", "Enter the 6-digit code");

  const btn = $id("rgVerify");
  btn.disabled = true; btn.textContent = "Verifying…";
  try {
    await api("/api/auth/verify-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, purpose: "register" }),
    });
    $id("rgErr").style.display = "none";
    await loadSkillCatalogue();
    renderRegisterSkills();
    goRegisterStep(3);
  } catch (e) {
    showErr("rgErr", e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Verify code";
  }
};
$id("rgBackTo1").onclick = () => goRegisterStep(1);

/* --- register step 3 → create account --- */
$id("rgFinish").onclick = async () => {
  const email = $id("rgEmail").value.trim().toLowerCase();
  const otp = $id("rgOtp").value.trim();
  const name = $id("rgName").value.trim();
  const rollNo = $id("rgRoll").value.trim().toUpperCase();
  const password = $id("rgPass").value;
  const branch = $id("rgBranch").value;
  const cgpa = parseFloat($id("rgCgpa").value || "0");
  const backlog_count = parseInt($id("rgBacklogs").value || "0", 10);
  const phone = $id("rgPhone").value.trim();
  const skills = [...document.querySelectorAll("#rgSkills .skill-chip.on")].map(el => el.dataset.name);

  if (!(cgpa >= 0 && cgpa <= 10)) return showErr("rgErr", "Enter a valid CGPA (0–10)");
  if (!skills.length) {
    if (!confirm("You haven't picked any skills. Continue anyway? You can add them later from your profile.")) return;
  }

  const btn = $id("rgFinish");
  btn.disabled = true; btn.textContent = "Creating account…";
  try {
    const j = await api("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, otp, name, roll_no: rollNo, password,
        branch, cgpa, backlog_count, phone, skills,
      }),
    });
    localStorage.setItem("cl_token", j.token);
    toast("Welcome to CareerLink", "ok");
    enterApp(j.role, j.user);
  } catch (e) {
    showErr("rgErr", e.message);
    btn.disabled = false; btn.textContent = "Create account";
  }
};

/* --- forgot password --- */
$id("fpSendOtp").onclick = async () => {
  const email = $id("fpEmail").value.trim().toLowerCase();
  if (!email.endsWith("@gmail.com")) return showErr("fpErr", "Use a @gmail.com email address");
  try {
    await api("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    $id("fpEmailEcho").textContent = email;
    $id("fpStep1").style.display = "none";
    $id("fpStep2").style.display = "block";
    toast("Reset code sent", "ok");
  } catch (e) { showErr("fpErr", e.message); }
};

$id("fpFinish").onclick = async () => {
  const email = $id("fpEmail").value.trim().toLowerCase();
  const otp = $id("fpOtp").value.trim();
  const password = $id("fpPass").value;
  const confirm = $id("fpPass2").value;
  if (otp.length !== 6) return showErr("fpErr", "Enter the 6-digit code");
  if (password.length < 8) return showErr("fpErr", "Password must be at least 8 characters");
  if (password !== confirm) return showErr("fpErr", "Passwords don't match");
  try {
    const j = await api("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, password }),
    });
    localStorage.setItem("cl_token", j.token);
    toast("Password updated", "ok");
    enterApp(j.role, j.user);
  } catch (e) { showErr("fpErr", e.message); }
};

/* --- admin login --- */
$id("adLoginBtn").onclick = async () => {
  const email = $id("adEmail").value.trim().toLowerCase();
  const password = $id("adPass").value;
  if (!email || !password) return showErr("adLoginErr", "Enter email and password");
  try {
    const j = await api("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin", email, password }),
    });
    localStorage.setItem("cl_token", j.token);
    enterApp(j.role, j.user);
  } catch (e) { showErr("adLoginErr", e.message); }
};
$id("adLogin").addEventListener("keydown", e => { if (e.key === "Enter") $id("adLoginBtn").click(); });

/* ================================================================
   SKILLS
   ================================================================ */
async function loadSkillCatalogue() {
  if (state.allSkills.length) return;
  try {
    state.allSkills = await api("/api/skills");
  } catch (_) { state.allSkills = []; }
}

function renderRegisterSkills() {
  const box = $id("rgSkills");
  if (!state.allSkills.length) {
    box.innerHTML = `<span class="chip-empty">No skills loaded — you can add them later from your profile.</span>`;
    return;
  }
  box.innerHTML = state.allSkills.map(s =>
    `<button type="button" class="skill-chip" data-name="${esc(s)}">${esc(s)}</button>`
  ).join("");
  box.querySelectorAll(".skill-chip").forEach(c => c.onclick = () => {
    c.classList.toggle("on");
    updateRegSkillCount();
  });
  updateRegSkillCount();
}

function updateRegSkillCount() {
  const n = document.querySelectorAll("#rgSkills .skill-chip.on").length;
  $id("rgSkillCount").textContent = `${n} selected`;
}

/* ================================================================
   APP SHELL
   ================================================================ */
const NAV = {
  student: [
    ["opps",    "Opportunities",    ICONS.target],
    ["mine",    "My Applications",  ICONS.file],
    ["profile", "My Profile",       ICONS.user],
    ["notes",   "Notifications",    ICONS.bell],
  ],
  admin: [
    ["overview",  "Overview",         ICONS.chart],
    ["students",  "Students",         ICONS.users],
    ["post",      "Post Opportunity", ICONS.plus],
    ["apps",      "Applications",     ICONS.layers],
    ["companies", "Companies",        ICONS.building],
  ],
};

function enterApp(role, user) {
  state.role = role;
  state.user = user;

  $id("auth").style.display = "none";
  $id("app").classList.add("on");
  $id("portalName").textContent = role === "student" ? "Student Portal" : "Placement Cell Portal";
  $id("avatar").textContent = role === "student"
    ? (user.name || "S").trim().charAt(0).toUpperCase()
    : "P";

  const items = NAV[role];
  $id("nav").innerHTML = items.map(([k, label, icon], i) =>
    `<button data-view="${k}" class="${i ? "" : "active"}">
       <span class="ic">${icon}</span>${label}</button>`).join("");

  $id("nav").querySelectorAll("button").forEach(b => b.onclick = () => {
    $id("nav").querySelectorAll("button").forEach(x =>
      x.classList.toggle("active", x === b));
    render(b.dataset.view);
  });

  render(items[0][0]);
  if (role === "student") loadNotificationBadge();
  window.scrollTo(0, 0);
}

function hardLogout() {
  localStorage.removeItem("cl_token");
  state.role = null; state.user = null;
  if (state.statsTimer) { clearInterval(state.statsTimer); state.statsTimer = null; }
  $id("app").classList.remove("on");
  $id("auth").style.display = "grid";
  showAuthStep("stLogin");
}

$id("signout").onclick = () => {
  if (!confirm("Sign out of CareerLink?")) return;
  hardLogout();
};

$id("chpwd").onclick = () => {
  if (state.role === "student") {
    $id("app").classList.remove("on");
    $id("auth").style.display = "grid";
    showAuthStep("stForgot");
    $id("fpEmail").value = state.user.email || "";
  } else {
    toast("Admin passwords are managed by the placement cell team", "err");
  }
};

/* ================================================================
   VIEW ROUTER
   ================================================================ */
const VIEWS = {
  opps:      viewOpportunities,
  mine:      viewMyApplications,
  profile:   viewProfile,
  notes:     viewNotifications,
  overview:  viewAdminOverview,
  students:  viewAdminStudents,
  post:      viewAdminPost,
  apps:      viewAdminApplications,
  companies: viewAdminCompanies,
};

function render(view) {
  const fn = VIEWS[view];
  if (!fn) return;
  if (state.statsTimer && view !== "apps") {
    clearInterval(state.statsTimer);
    state.statsTimer = null;
  }
  const main = $id("main");
  main.innerHTML = `<div class="empty">Loading…</div>`;
  Promise.resolve(fn())
    .then(html => { main.innerHTML = html; bindView(view); window.scrollTo(0, 0); })
    .catch(e => { main.innerHTML = `<div class="empty"><b>Couldn't load</b>${esc(e.message)}</div>`; });
}

function head(title, subtitle, extra = "") {
  return `<div class="pagehead">
    <div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
    ${extra}
  </div>`;
}

/* ================================================================
   STUDENT VIEWS
   ================================================================ */
async function viewOpportunities() {
  const opps = await api("/api/opportunities", { headers: authHeaders(false) });
  state.lastOpps = opps;   // cached for the modal
  if (!opps.length) return head("Opportunities", "No active postings yet.") +
    `<div class="panel empty"><b>Nothing here yet</b>The placement cell hasn't posted anything.</div>`;

  const me = state.user;
  const ruleLine = me.current_offer_package
    ? `You can only apply to roles paying more than your current offer of <b>₹${me.current_offer_package} LPA</b>.`
    : `You don't have an offer yet, so every role is open (subject to eligibility).`;

  const cards = opps.map(o => {
    const locked = !o.eligible;
    const appliedAlready = o.already_applied;
    return `<article class="job ${locked ? "locked" : ""}" data-opp-id="${o.id}" tabindex="0">
      <div>
        <h3>
          ${esc(o.role)}
          ${locked ? '<span class="badge warn">Not eligible</span>'
                   : '<span class="badge">Eligible</span>'}
          <span class="expand-hint">${ICONS.expand} Click for details</span>
        </h3>
        <p class="co">${esc(o.company)} · ₹${o.package_offered} LPA · ${o.number_of_openings} openings</p>
        ${o.company_description ? `<p class="about">${esc(o.company_description)}</p>` : ""}
        <div class="tags">
          <span class="tag">CGPA ≥ ${o.eligibility_cgpa}</span>
          <span class="tag">${esc(o.eligible_branch || "Any branch")}</span>
          <span class="tag">Backlogs ≤ ${o.max_backlogs}</span>
          <span class="tag">Apply by ${esc(o.application_deadline || "TBD")}</span>
          ${(o.required_skills || "").split(",").map(s => s.trim()).filter(Boolean)
            .map(s => `<span class="tag skill">${esc(s)}</span>`).join("")}
        </div>
      </div>
      <div>
        <div class="pkg">₹${o.package_offered} LPA<small>${o.applicant_count} applied</small></div>
        <div class="act">
          <button class="apply" data-apply="${o.id}"
            ${locked || appliedAlready ? "disabled" : ""}>
            ${appliedAlready ? "Applied" : locked ? "Locked" : "Apply now"}
          </button>
          ${locked ? `<span class="why">${esc(o.ineligible_reason)}</span>` : ""}
        </div>
      </div>
    </article>`;
  }).join("");

  return head("Opportunities", "Roles open to you right now. Click any card for full details.",
    `<span class="chip on">${esc(me.branch || "—")} · CGPA ${me.cgpa ?? "—"}</span>`)
    + `<div class="banner"><h3>Package rule</h3><p>${ruleLine}</p></div>`
    + cards;
}

async function viewMyApplications() {
  const apps = await api("/api/applications/mine", { headers: authHeaders(false) });
  if (!apps.length) return head("My Applications", "Track where each application stands.")
    + `<div class="panel empty"><b>Nothing here yet</b>Apply to a role and it will show up here.</div>`;

  const stages = ["Applied", "Shortlisted", "Interview", "Selected"];
  const cards = apps.map(a => {
    const rejected = a.status === "Rejected";
    const idx = stages.indexOf(a.status);
    const timeline = stages.map((s, i) => {
      const done = !rejected && i <= idx;
      return `<li class="${done ? "done" : ""}">${s}</li>`;
    }).join("");
    const rejLine = rejected ? `<li class="done" style="color:var(--rose)">Rejected</li>` : "";
    return `<div class="panel" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:flex-start">
        <div>
          <h3 style="font-size:17px">${esc(a.role)}</h3>
          <p style="margin:4px 0 0;color:var(--ink-soft);font-size:13.5px">
            ${esc(a.company)} · applied ${a.application_date} · ₹${a.package_offered} LPA
          </p>
        </div>
        <span class="pill ${a.status.toLowerCase()}">${a.status}</span>
      </div>
      <ul class="timeline">${timeline}${rejLine}</ul>
    </div>`;
  }).join("");

  return head("My Applications", "Track where each application stands.") + cards;
}

async function viewProfile() {
  const p = await api("/api/students/me", { headers: authHeaders(false) });
  await loadSkillCatalogue();
  const resumeName = p.resume_path || null;

  const skillChips = p.skills.length
    ? p.skills.map(s => `<span class="tag skill" data-remove-skill="${esc(s)}"
        style="cursor:pointer;padding-right:8px">
          ${esc(s)} <span style="opacity:.55;margin-left:4px">×</span>
        </span>`).join("")
    : '<span style="color:var(--ink-soft);font-size:13.5px">No skills selected yet.</span>';

  return head("My Profile", "What recruiters and the placement cell see.") + `
  <div class="grid g4" style="margin-bottom:18px">
    <div class="panel stat"><b>${p.cgpa ?? "—"}</b><small>CGPA</small></div>
    <div class="panel stat"><b>${p.backlog_count ?? 0}</b><small>Active backlogs</small></div>
    <div class="panel stat"><b>${esc(p.branch || "—")}</b><small>Branch</small></div>
    <div class="panel stat accent"><b>${p.current_offer_package ? "₹" + p.current_offer_package + " LPA" : "None"}</b><small>Current offer</small></div>
  </div>

  <div class="grid g2">
    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:14px">Personal details</h3>
      <label class="field"><span class="lab"><span>Full name</span></span>
        <input class="input" id="pfName" value="${esc(p.name)}"></label>
      <label class="field"><span class="lab"><span>Roll number</span></span>
        <input class="input" value="${esc(p.roll_no)}" disabled></label>
      <label class="field"><span class="lab"><span>Email</span></span>
        <input class="input" value="${esc(p.email)}" disabled></label>
      <div class="field-row">
        <label class="field"><span class="lab"><span>Branch</span></span>
          <select class="input" id="pfBranch">
            ${["CSE","IT","ECE","EEE","ME","CE"].map(b =>
              `<option ${b === p.branch ? "selected" : ""}>${b}</option>`).join("")}
          </select></label>
        <label class="field"><span class="lab"><span>Phone</span></span>
          <input class="input" id="pfPhone" value="${esc(p.phone || "")}" placeholder="+91…"></label>
      </div>
      <div class="field-row">
        <label class="field"><span class="lab"><span>CGPA</span></span>
          <input class="input" id="pfCgpa" type="number" step="0.01" min="0" max="10" value="${p.cgpa ?? 0}"></label>
        <label class="field"><span class="lab"><span>Backlogs</span></span>
          <input class="input" id="pfBacklogs" type="number" min="0" value="${p.backlog_count ?? 0}"></label>
      </div>
      <label class="field"><span class="lab"><span>Current offer package (₹ LPA) — set to 0 if none</span></span>
        <input class="input" id="pfOffer" type="number" step="0.01" min="0" value="${p.current_offer_package ?? 0}"></label>
      <button class="btn" id="pfSave">Save changes</button>
    </div>

    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:14px">Resume</h3>
      ${resumeName
        ? `<div class="resume-row">
             <div class="file"><b>${esc(resumeName)}</b><small>Uploaded</small></div>
             <a class="mini" href="/uploads/resumes/${encodeURIComponent(resumeName)}" target="_blank">View</a>
           </div>`
        : `<div class="resume-row">
             <div class="file"><b>No resume uploaded</b>
             <small>Upload a PDF — we'll extract your skills and CGPA automatically.</small></div>
           </div>`}
      <label class="field" style="margin-top:14px">
        <span class="lab"><span>Upload new resume (PDF, max 5 MB)</span></span>
        <input class="input" id="pfResume" type="file" accept="application/pdf">
      </label>
      <button class="btn" id="pfUpload">Upload &amp; extract</button>

      <div id="extractPanel" style="display:none;margin-top:16px"></div>
    </div>
  </div>

  <div class="panel" style="margin-top:16px">
    <h3 style="font-size:16px;margin-bottom:6px">Your skills</h3>
    <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 14px">
      Tap a skill to add or remove it. Skills are matched against each role's requirements during shortlisting.
    </p>
    <div class="tags" id="pfSkillTags" style="margin-bottom:14px">${skillChips}</div>
    <div class="chip-picker" id="pfSkillPicker"></div>
    <button class="btn" id="pfSkillSave" style="max-width:220px">Save skills</button>
  </div>`;
}

async function viewNotifications() {
  const data = await api("/api/notifications", { headers: authHeaders(false) });
  if (!data.items.length) return head("Notifications", "Updates about your applications and new roles.")
    + `<div class="panel empty"><b>Nothing yet</b>You'll hear from us here.</div>`;

  const items = data.items.map(n => `
    <div class="notif-item ${n.is_read ? "" : "unread"} k-${n.kind}"
         data-nid="${n.id}" style="border-radius:12px;margin-bottom:8px;border:1px solid var(--line)">
      <b>${esc(n.title)}</b>
      <p>${esc(n.message)}</p>
      <small>${esc(n.created_at)}</small>
    </div>`).join("");

  return head("Notifications", "Updates about your applications and new roles.",
    data.unread ? `<span class="chip on">${data.unread} unread</span>` : "")
    + `<div class="panel">${items}</div>`;
}

/* ================================================================
   ADMIN VIEWS
   ================================================================ */
async function viewAdminOverview() {
  const s = await api("/api/admin/overview", { headers: authHeaders(false) });
  const recent = await api("/api/admin/applications", { headers: authHeaders(false) });
  const rows = recent.slice(0, 6).map(a => `<tr>
    <td><b>${esc(a.student.name)}</b><br><small style="color:var(--ink-soft)">${esc(a.student.roll_no)} · ${esc(a.student.branch)}</small></td>
    <td>${esc(a.role)}<br><small style="color:var(--ink-soft)">${esc(a.company)}</small></td>
    <td>${a.application_date}</td>
    <td><span class="pill ${a.status.toLowerCase()}">${a.status}</span></td>
  </tr>`).join("");

  return head("Overview", "Placement activity at a glance.") + `
  <div class="grid g4" style="margin-bottom:18px">
    <div class="panel stat"><b>${s.active_opportunities}</b><small>Active opportunities</small></div>
    <div class="panel stat"><b>${s.total_applications}</b><small>Total applications</small></div>
    <div class="panel stat"><b>${s.in_process}</b><small>In process</small></div>
    <div class="panel stat accent"><b>₹${s.highest_package} LPA</b><small>Highest package</small></div>
  </div>
  <div class="panel">
    <h3 style="font-size:16px;margin-bottom:12px">Recent applications</h3>
    ${rows ? `<div class="tablewrap"><table><thead>
      <tr><th>Student</th><th>Role</th><th>Applied</th><th>Status</th></tr>
    </thead><tbody>${rows}</tbody></table></div>`
      : `<div class="empty"><b>No applications yet</b>Post a role to start receiving them.</div>`}
  </div>`;
}

async function viewAdminStudents() {
  const list = await api("/api/admin/students", { headers: authHeaders(false) });
  if (!list.length) return head("Students", "Every registered student.")
    + `<div class="panel empty"><b>No students yet</b></div>`;

  const rows = list.map(s => `<tr>
    <td><b>${esc(s.name)}</b><br><small style="color:var(--ink-soft)">${esc(s.email)}</small></td>
    <td>${esc(s.roll_no)}</td>
    <td>${esc(s.branch || "—")}</td>
    <td>${s.cgpa ?? "—"}</td>
    <td>${s.backlog_count}</td>
    <td>${s.current_offer_package ? "₹" + s.current_offer_package : "—"}</td>
    <td>${s.applications}</td>
    <td>${s.resume_path
      ? `<a class="mini" href="/uploads/resumes/${encodeURIComponent(s.resume_path)}" target="_blank">Resume</a>`
      : '<span style="color:var(--ink-soft)">—</span>'}</td>
  </tr>`).join("");

  return head("Students", `${list.length} registered students.`) + `
  <div class="panel"><div class="tablewrap"><table>
    <thead><tr>
      <th>Student</th><th>Roll No</th><th>Branch</th><th>CGPA</th>
      <th>Backlogs</th><th>Offer</th><th>Apps</th><th>Resume</th>
    </tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

async function viewAdminPost() {
  return head("Post Opportunity", "Publish a role — eligible students get notified instantly.") + `
  <div class="panel" style="max-width:820px">
    <h3 style="font-size:16px;margin-bottom:14px">Company</h3>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Company name *</span></span>
        <input class="input" id="fCo" placeholder="Zeta Systems"></label>
      <label class="field"><span class="lab"><span>Website</span></span>
        <input class="input" id="fSite" placeholder="https://…"></label>
    </div>
    <label class="field"><span class="lab"><span>About the company *</span></span>
      <textarea class="input" id="fCoDesc" placeholder="Brief description of the company, its work, and culture."></textarea></label>

    <h3 style="font-size:16px;margin:22px 0 14px">Role</h3>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Role title *</span></span>
        <input class="input" id="fRole" placeholder="Software Engineer — Backend"></label>
      <label class="field"><span class="lab"><span>Package (₹ LPA) *</span></span>
        <input class="input" id="fPkg" type="number" step="0.1" min="0" placeholder="14"></label>
    </div>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Openings</span></span>
        <input class="input" id="fOpen" type="number" min="1" value="1"></label>
      <label class="field"><span class="lab"><span>Application deadline</span></span>
        <input class="input" id="fDl" placeholder="30 Sep"></label>
    </div>
    <label class="field"><span class="lab"><span>Job description</span></span>
      <textarea class="input" id="fJd" placeholder="What will the role involve?"></textarea></label>
    <label class="field"><span class="lab"><span>Required skills (comma-separated)</span></span>
      <input class="input" id="fSk" placeholder="Java, SQL, REST APIs"></label>

    <h3 style="font-size:16px;margin:22px 0 14px">Eligibility</h3>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Minimum CGPA</span></span>
        <input class="input" id="fCgpa" type="number" step="0.1" min="0" max="10" value="0"></label>
      <label class="field"><span class="lab"><span>Maximum backlogs</span></span>
        <input class="input" id="fBl" type="number" min="0" value="0"></label>
    </div>
    <label class="field"><span class="lab"><span>Eligible branches (comma-separated)</span></span>
      <input class="input" id="fBr" placeholder="CSE, IT"></label>

    <button class="btn" id="publishBtn" style="margin-top:8px">Publish opportunity</button>
    <p class="err" id="postErr"></p>
  </div>`;
}

async function viewAdminApplications() {
  const apps = await api("/api/admin/applications", { headers: authHeaders(false) });

  const rows = apps.map((a, i) => `<tr>
    <td style="font-weight:800;color:var(--sky-deep)">${i + 1}</td>
    <td><b>${esc(a.student.name)}</b><br>
      <small style="color:var(--ink-soft)">${esc(a.student.roll_no)} · ${esc(a.student.branch)} · ${a.student.cgpa} CGPA</small></td>
    <td>${esc(a.role)}<br><small style="color:var(--ink-soft)">${esc(a.company)}</small></td>
    <td>₹${a.package_offered} LPA</td>
    <td><span class="pill ${a.status.toLowerCase()}">${a.status}</span></td>
    <td style="white-space:nowrap">
      <button class="mini go" data-set="${a.id}" data-status="Shortlisted">Shortlist</button>
      <button class="mini" data-set="${a.id}" data-status="Interview">Interview</button>
      <button class="mini go" data-set="${a.id}" data-status="Selected">Select</button>
      <button class="mini no" data-set="${a.id}" data-status="Rejected">Reject</button>
    </td>
  </tr>`).join("");

  return head("Applications", `${apps.length} total — take a decision to move candidates forward.`) + `
  <div class="panel" style="margin-bottom:16px">
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <label style="font-size:13.5px;font-weight:700">Review queue policy:</label>
      <select class="input" id="policySelect" style="max-width:280px;padding:8px 12px">
        <option value="fcfs">FCFS — arrival order</option>
        <option value="priority">Priority — CGPA − backlogs</option>
        <option value="rr">Round Robin — across companies</option>
      </select>
      <span class="chip" id="queueStats" style="font-size:12.5px">Queue: —</span>
    </div>
    <p style="color:var(--ink-soft);font-size:12.5px;margin:10px 0 0">
      <b>OS concept:</b> CPU Scheduling. The dispatcher reorders the queue using the chosen policy.
    </p>
  </div>
  ${apps.length
    ? `<div class="panel"><div class="tablewrap"><table>
        <thead><tr><th>#</th><th>Student</th><th>Role</th><th>Package</th><th>Status</th><th>Decision</th></tr></thead>
        <tbody id="appsTableBody">${rows}</tbody></table></div></div>`
    : `<div class="panel empty"><b>No applications yet</b>Post a role to start receiving them.</div>`}`;
}

async function viewAdminCompanies() {
  const companies = await api("/api/admin/companies", { headers: authHeaders(false) });
  if (!companies.length) return head("Companies", "Recruiters hiring on campus.")
    + `<div class="panel empty"><b>No companies yet</b>Post an opportunity to add one.</div>`;

  const cards = companies.map(c => `<div class="panel">
    <h3 style="font-size:16px">${esc(c.name)}</h3>
    ${c.description ? `<p style="color:var(--ink-soft);font-size:13.5px;margin:6px 0 12px">${esc(c.description)}</p>` : ""}
    <p style="color:var(--ink-soft);font-size:13px;margin:8px 0 12px">
      ${c.opportunities.length} open role${c.opportunities.length > 1 ? "s" : ""} ·
      ${c.applicant_count} applicant${c.applicant_count === 1 ? "" : "s"}
    </p>
    <div class="tags">
      ${c.opportunities.map(o =>
        `<span class="tag">${esc(o.role)} — ₹${o.package_offered} LPA</span>`).join("")}
    </div>
  </div>`).join("");

  return head("Companies", `${companies.length} companies on campus.`)
    + `<div class="grid g2">${cards}</div>`;
}

/* ================================================================
   FULL-SCREEN OPPORTUNITY MODAL
   ================================================================ */
function ensureModal() {
  if ($id("oppModal")) return;
  const el = document.createElement("div");
  el.id = "oppModal";
  el.className = "modal-backdrop";
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" id="modalClose" aria-label="Close">${ICONS.close}</button>
      <div class="modal-body" id="modalBody"></div>
    </div>`;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => { if (e.target === el) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $id("oppModal").classList.contains("on")) closeModal();
  });
  $id("modalClose").addEventListener("click", closeModal);
}

function openOppModal(oppId) {
  const o = state.lastOpps.find(x => x.id === oppId);
  if (!o) return;
  ensureModal();

  const me = state.user || {};
  const locked = !o.eligible;
  const appliedAlready = o.already_applied;
  const ruleIssue = me.current_offer_package &&
                    o.package_offered <= me.current_offer_package;

  const branches = (o.eligible_branch || "").split(",").map(s => s.trim()).filter(Boolean);
  const skills = (o.required_skills || "").split(",").map(s => s.trim()).filter(Boolean);

  $id("modalBody").innerHTML = `
    <header class="modal-head">
      <div>
        <span class="modal-company">${esc(o.company)}</span>
        <h1>${esc(o.role)}</h1>
        <div class="modal-meta">
          ${locked
            ? '<span class="badge warn">Not eligible</span>'
            : '<span class="badge">You are eligible</span>'}
          <span class="tag">${o.number_of_openings} openings</span>
          <span class="tag">${o.applicant_count} applied</span>
          <span class="tag">Posted ${esc(o.posted_date || "—")}</span>
        </div>
      </div>
      <div class="modal-package">
        <small>Package</small>
        <b>₹${o.package_offered} LPA</b>
      </div>
    </header>

    <section class="modal-section">
      <h2>About ${esc(o.company)}</h2>
      <p>${esc(o.company_description || "No company description provided.")}</p>
      ${o.company_website ? `<p><b>Website:</b> <a href="${esc(o.company_website)}" target="_blank" rel="noopener">${esc(o.company_website)}</a></p>` : ""}
    </section>

    <section class="modal-section">
      <h2>Role description</h2>
      <p>${esc(o.job_description || "No detailed job description provided.")}</p>
    </section>

    <section class="modal-section">
      <h2>Required skills</h2>
      <div class="tags">
        ${skills.length
          ? skills.map(s => `<span class="tag skill">${esc(s)}</span>`).join("")
          : '<span style="color:var(--ink-soft);font-size:13.5px">Not specified</span>'}
      </div>
    </section>

    <section class="modal-section">
      <h2>Eligibility</h2>
      <ul class="modal-criteria">
        <li class="${me.cgpa >= o.eligibility_cgpa ? "pass" : "fail"}">
          Minimum CGPA: <b>${o.eligibility_cgpa}</b> — you have <b>${me.cgpa ?? "—"}</b>
        </li>
        <li class="${!branches.length || branches.includes(me.branch) ? "pass" : "fail"}">
          Branch: <b>${branches.length ? branches.join(", ") : "Any"}</b> — you are <b>${esc(me.branch || "—")}</b>
        </li>
        <li class="${(me.backlog_count ?? 0) <= o.max_backlogs ? "pass" : "fail"}">
          Max backlogs: <b>${o.max_backlogs}</b> — you have <b>${me.backlog_count ?? 0}</b>
        </li>
        <li class="${ruleIssue ? "fail" : "pass"}">
          Package rule: new offer must exceed your current package — yours is
          <b>${me.current_offer_package ? "₹" + me.current_offer_package + " LPA" : "none"}</b>
        </li>
      </ul>
      ${locked ? `<p class="modal-warn">${esc(o.ineligible_reason || "You are not eligible.")}</p>` : ""}
    </section>

    <section class="modal-section">
      <h2>Application deadline</h2>
      <p><b>${esc(o.application_deadline || "Not specified")}</b></p>
    </section>

    <footer class="modal-foot">
      <button class="btn" id="modalApply"
        ${locked || appliedAlready ? "disabled" : ""}>
        ${appliedAlready ? "Already applied" : locked ? "Not eligible" : "Apply now"}
      </button>
    </footer>
  `;

  $id("oppModal").classList.add("on");
  document.body.style.overflow = "hidden";

  const applyBtn = $id("modalApply");
  if (applyBtn && !applyBtn.disabled) {
    applyBtn.onclick = async () => {
      applyBtn.disabled = true;
      applyBtn.textContent = "Submitting…";
      try {
        await api("/api/applications", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({ opportunity_id: o.id }),
        });
        toast("Application submitted", "ok");
        closeModal();
        render("opps");
      } catch (e) {
        toast(e.message, "err");
        applyBtn.disabled = false;
        applyBtn.textContent = "Apply now";
      }
    };
  }
}

function closeModal() {
  const m = $id("oppModal");
  if (m) m.classList.remove("on");
  document.body.style.overflow = "";
}

/* ================================================================
   VIEW BINDINGS
   ================================================================ */
function bindView(view) {
  if (view === "opps") {
    // Apply buttons — do not trigger the card's modal
    document.querySelectorAll("[data-apply]").forEach(b => b.onclick = async (ev) => {
      ev.stopPropagation();
      b.disabled = true;
      try {
        await api("/api/applications", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({ opportunity_id: +b.dataset.apply }),
        });
        toast("Application submitted", "ok");
        render("opps");
      } catch (e) {
        toast(e.message, "err");
        b.disabled = false;
      }
    });

    // Card click / Enter key → full-screen modal
    document.querySelectorAll(".job[data-opp-id]").forEach(card => {
      card.addEventListener("click", () => openOppModal(+card.dataset.oppId));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openOppModal(+card.dataset.oppId);
        }
      });
    });
  }

  if (view === "profile") {
    const picked = new Set(
      [...document.querySelectorAll("#pfSkillTags [data-remove-skill]")]
        .map(el => el.dataset.removeSkill)
    );

    const picker = $id("pfSkillPicker");
    if (state.allSkills.length) {
      picker.innerHTML = state.allSkills.map(s =>
        `<button type="button" class="skill-chip ${picked.has(s) ? "on" : ""}"
                 data-name="${esc(s)}">${esc(s)}</button>`
      ).join("");
      picker.querySelectorAll(".skill-chip").forEach(c => c.onclick = () => {
        const n = c.dataset.name;
        if (c.classList.contains("on")) { picked.delete(n); c.classList.remove("on"); }
        else { picked.add(n); c.classList.add("on"); }
      });
    } else {
      picker.innerHTML = `<span class="chip-empty">Skill catalogue unavailable.</span>`;
    }

    $id("pfSave").onclick = async () => {
      try {
        await api("/api/students/me", {
          method: "PATCH", headers: authHeaders(),
          body: JSON.stringify({
            name: $id("pfName").value.trim(),
            branch: $id("pfBranch").value,
            phone: $id("pfPhone").value.trim(),
            cgpa: parseFloat($id("pfCgpa").value || "0"),
            backlog_count: parseInt($id("pfBacklogs").value || "0", 10),
            current_offer_package: parseFloat($id("pfOffer").value || "0"),
          }),
        });
        const me = await api("/api/auth/me", { headers: authHeaders(false) });
        state.user = me.user;
        toast("Profile updated", "ok");
      } catch (e) { toast(e.message, "err"); }
    };

    $id("pfSkillSave").onclick = async () => {
      try {
        await api("/api/students/me", {
          method: "PATCH", headers: authHeaders(),
          body: JSON.stringify({ skills: [...picked] }),
        });
        toast("Skills updated", "ok");
        render("profile");
      } catch (e) { toast(e.message, "err"); }
    };

    $id("pfUpload").onclick = async () => {
      const f = $id("pfResume").files[0];
      if (!f) return toast("Choose a PDF file first", "err");
      if (!f.name.toLowerCase().endsWith(".pdf")) return toast("Only PDF files are allowed", "err");
      const fd = new FormData();
      fd.append("resume", f);
      const panel = $id("extractPanel");
      panel.style.display = "block";
      panel.innerHTML = `<div class="hint">Uploading &amp; extracting…</div>`;
      try {
        const res = await api("/api/students/me/resume", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token()}` },
          body: fd,
        });
        renderExtraction(res.extracted || { skills: [], cgpa: null }, picked);
      } catch (e) {
        panel.innerHTML = `<div class="hint" style="color:var(--rose)">${esc(e.message)}</div>`;
      }
    };

    function renderExtraction(data, picked) {
      const panel = $id("extractPanel");
      const foundSkills = data.skills || [];
      const foundCgpa = data.cgpa;

      if (!foundSkills.length && !foundCgpa) {
        panel.innerHTML = `
          <div class="hint">
            We couldn't find any skills or CGPA in that PDF. You can still
            add them manually below. Resume uploaded successfully.
          </div>`;
        return;
      }

      const skillsLine = foundSkills.length
        ? foundSkills.map(s => `<span class="tag skill">${esc(s)}</span>`).join(" ")
        : `<span style="color:var(--ink-soft);font-size:13px">No skills detected</span>`;
      const cgpaLine = foundCgpa != null
        ? `<b>${foundCgpa}</b>`
        : `<span style="color:var(--ink-soft);font-size:13px">No CGPA detected</span>`;

      panel.innerHTML = `
        <div class="panel" style="background:var(--sky-soft);border-color:transparent">
          <h4 style="margin:0 0 12px;font-size:14.5px">We extracted these — apply them?</h4>
          <div style="margin-bottom:10px"><b style="font-size:13px">Skills:</b><br>${skillsLine}</div>
          <div style="margin-bottom:14px"><b style="font-size:13px">CGPA:</b> ${cgpaLine}</div>
          <div style="display:flex;gap:10px">
            <button class="mini go" id="applyExtract">Add to profile</button>
            <button class="mini" id="dismissExtract">Dismiss</button>
          </div>
        </div>`;

      $id("dismissExtract").onclick = () => { panel.style.display = "none"; };
      $id("applyExtract").onclick = async () => {
        try {
          const patch = {};
          if (foundSkills.length) {
            const merged = new Set([...picked, ...foundSkills]);
            patch.skills = [...merged];
          }
          if (foundCgpa != null) patch.cgpa = foundCgpa;
          await api("/api/students/me", {
            method: "PATCH", headers: authHeaders(),
            body: JSON.stringify(patch),
          });
          const me = await api("/api/auth/me", { headers: authHeaders(false) });
          state.user = me.user;
          toast("Extracted details added to your profile", "ok");
          render("profile");
        } catch (e) { toast(e.message, "err"); }
      };
    }
  }

  if (view === "notes") {
    document.querySelectorAll(".notif-item").forEach(el => el.onclick = async () => {
      if (el.classList.contains("unread")) {
        await api(`/api/notifications/${el.dataset.nid}/read`, {
          method: "POST", headers: authHeaders(false),
        });
        el.classList.remove("unread");
        loadNotificationBadge();
      }
    });
  }

  if (view === "apps") {
    const bindDecisionButtons = (scope) => {
      scope.querySelectorAll("[data-set]").forEach(b => b.onclick = async () => {
        b.disabled = true;
        try {
          await api(`/api/admin/applications/${b.dataset.set}`, {
            method: "PATCH", headers: authHeaders(),
            body: JSON.stringify({ status: b.dataset.status }),
          });
          toast(`Marked ${b.dataset.status.toLowerCase()}`, "ok");
          render("apps");
        } catch (e) {
          toast(e.message, "err");
          b.disabled = false;
        }
      });
    };
    bindDecisionButtons(document);

    const sel = $id("policySelect");
    const statsEl = $id("queueStats");

    const loadStats = async () => {
      if (!statsEl) return;
      try {
        const s = await api("/api/admin/queue-stats", { headers: authHeaders(false) });
        statsEl.textContent =
          `Queue: ${s.buffered}/${s.capacity} · processed ${s.processed} · workers ${s.workers}`;
      } catch (_) {}
    };

    const applyPolicy = async (policy) => {
      try {
        const data = await api(`/api/admin/schedule?policy=${policy}`,
                               { headers: authHeaders(false) });
        const body = $id("appsTableBody");
        if (!body) return;
        body.innerHTML = data.queue.map((a, i) => `
          <tr>
            <td style="font-weight:800;color:var(--sky-deep)">${i + 1}</td>
            <td><b>${esc(a.student.name)}</b><br>
              <small style="color:var(--ink-soft)">${esc(a.student.roll_no)} · ${esc(a.student.branch)} · ${a.student.cgpa} CGPA</small></td>
            <td>${esc(a.role)}<br><small style="color:var(--ink-soft)">${esc(a.company)}</small></td>
            <td>₹${a.package_offered} LPA</td>
            <td><span class="pill ${a.status.toLowerCase()}">${a.status}</span></td>
            <td style="white-space:nowrap">
              <button class="mini go" data-set="${a.id}" data-status="Shortlisted">Shortlist</button>
              <button class="mini" data-set="${a.id}" data-status="Interview">Interview</button>
              <button class="mini go" data-set="${a.id}" data-status="Selected">Select</button>
              <button class="mini no" data-set="${a.id}" data-status="Rejected">Reject</button>
            </td>
          </tr>`).join("");
        bindDecisionButtons(body);
        toast(`Scheduled using ${policy.toUpperCase()}`, "ok");
      } catch (e) { toast(e.message, "err"); }
    };

    if (sel) sel.onchange = () => applyPolicy(sel.value);

    loadStats();
    if (state.statsTimer) clearInterval(state.statsTimer);
    state.statsTimer = setInterval(loadStats, 8000);
  }

  if (view === "post") {
    $id("publishBtn").onclick = async () => {
      const v = (id) => $id(id).value.trim();
      const err = $id("postErr");
      err.style.display = "none";

      const payload = {
        company_name: v("fCo"),
        company_description: v("fCoDesc"),
        role: v("fRole"),
        package_offered: parseFloat(v("fPkg") || "0"),
        number_of_openings: parseInt(v("fOpen") || "1", 10),
        application_deadline: v("fDl"),
        job_description: v("fJd"),
        required_skills: v("fSk"),
        eligibility_cgpa: parseFloat(v("fCgpa") || "0"),
        max_backlogs: parseInt(v("fBl") || "0", 10),
        eligible_branch: v("fBr") || "CSE",
      };

      if (!payload.company_name) return postErr("Company name is required");
      if (!payload.company_description) return postErr("Company description is required");
      if (!payload.role) return postErr("Role title is required");
      if (!(payload.package_offered > 0)) return postErr("Enter a valid package");

      try {
        const res = await api("/api/admin/opportunities", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const q = res.notifications_queued;
        toast(q != null
          ? `Published — ${q} notification${q === 1 ? "" : "s"} queued`
          : "Opportunity published", "ok");
        document.querySelectorAll(".nav button").forEach(x =>
          x.classList.toggle("active", x.dataset.view === "companies"));
        render("companies");
      } catch (e) { postErr(e.message); }
    };

    function postErr(msg) {
      const el = $id("postErr");
      el.textContent = msg;
      el.style.display = "block";
    }
  }
}

/* ================================================================
   NOTIFICATIONS
   ================================================================ */
async function loadNotificationBadge() {
  if (state.role !== "student" || !token()) return;
  try {
    const data = await api("/api/notifications", { headers: authHeaders(false) });
    $id("bellDot").classList.toggle("on", data.unread > 0);
  } catch (_) {}
}

async function openNotificationPanel() {
  const panel = $id("notifPanel");
  panel.classList.add("on");
  const list = $id("notifList");
  list.innerHTML = `<div class="notif-empty">Loading…</div>`;
  try {
    const data = await api("/api/notifications", { headers: authHeaders(false) });
    if (!data.items.length) {
      list.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
      return;
    }
    list.innerHTML = data.items.map(n => `
      <div class="notif-item ${n.is_read ? "" : "unread"} k-${n.kind}" data-nid="${n.id}">
        <b>${esc(n.title)}</b>
        <p>${esc(n.message)}</p>
        <small>${esc(n.created_at)}</small>
      </div>`).join("");

    list.querySelectorAll(".notif-item").forEach(el => el.onclick = async () => {
      if (el.classList.contains("unread")) {
        await api(`/api/notifications/${el.dataset.nid}/read`, {
          method: "POST", headers: authHeaders(false),
        });
        el.classList.remove("unread");
        loadNotificationBadge();
      }
    });
  } catch (e) {
    list.innerHTML = `<div class="notif-empty">${esc(e.message)}</div>`;
  }
}

$id("bell").onclick = (e) => {
  e.stopPropagation();
  const panel = $id("notifPanel");
  if (panel.classList.contains("on")) panel.classList.remove("on");
  else openNotificationPanel();
};

$id("markAllRead").onclick = async (e) => {
  e.stopPropagation();
  try {
    await api("/api/notifications/read-all", { method: "POST", headers: authHeaders(false) });
    loadNotificationBadge();
    openNotificationPanel();
    if (state.role === "student" && $id("nav").querySelector('[data-view="notes"].active'))
      render("notes");
  } catch (err) { toast(err.message, "err"); }
};

document.addEventListener("click", (e) => {
  if (!e.target.closest("#notifPanel") && !e.target.closest("#bell"))
    $id("notifPanel").classList.remove("on");
});

setInterval(() => {
  if (state.role === "student" && token()) loadNotificationBadge();
}, 60000);

/* ================================================================
   BOOT
   ================================================================ */
(async function boot() {
  if (!token()) return;
  try {
    const me = await api("/api/auth/me", { headers: authHeaders(false) });
    enterApp(me.role, me.user);
  } catch (_) {
    hardLogout();
  }
})();