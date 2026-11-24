/* ================================================================
   CareerLink — Final Frontend Logic
   ================================================================ */

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
  megaphone:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  upload:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const $id = (x) => document.getElementById(x);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
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

const state = { role: null, user: null, allSkills: [], statsTimer: null, lastOpps: [], adminOpps: [] };

let toastTimer;
function toast(msg, kind = "") {
  const t = $id("toast");
  t.textContent = msg;
  t.className = "toast show " + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ================================================================
   ANNOUNCEMENT POPUPS
   ================================================================ */
async function showAnnouncements() {
  if (state.role !== "student" || !token()) return;
  try {
    const data = await api("/api/announcements", { headers: authHeaders(false) });
    if (!data.items.length) return;

    const seen = new Set(JSON.parse(sessionStorage.getItem("seen_announcements") || "[]"));
    const toShow = data.items.filter(a => !seen.has(a.id));
    if (!toShow.length) return;

    let container = $id("announcementBar");
    if (!container) {
      container = document.createElement("div");
      container.id = "announcementBar";
      container.className = "announcement-bar";
      document.body.appendChild(container);
    }

    toShow.forEach(a => {
      const banner = document.createElement("div");
      banner.className = `announcement-banner ${a.priority}`;
      banner.setAttribute("role", "status");
      banner.innerHTML = `
        <div class="ann-icon">${a.priority === "important" ? ICONS.alert : ICONS.megaphone}</div>
        <div class="ann-body">
          <b>${esc(a.title)}</b>
          <p>${esc(a.message)}</p>
        </div>
        <button class="ann-close" aria-label="Dismiss">×</button>`;

      container.appendChild(banner);
      requestAnimationFrame(() => banner.classList.add("show"));

      const timeout = setTimeout(() => dismissAnnouncement(banner), a.priority === "important" ? 12000 : 8000);
      banner.querySelector(".ann-close").onclick = () => { clearTimeout(timeout); dismissAnnouncement(banner); };

      seen.add(a.id);
      sessionStorage.setItem("seen_announcements", JSON.stringify([...seen]));
    });
  } catch (_) {}
}

function dismissAnnouncement(banner) {
  banner.classList.remove("show");
  banner.classList.add("hide");
  setTimeout(() => {
    banner.remove();
    const c = $id("announcementBar");
    if (c && !c.children.length) c.remove();
  }, 320);
}

/* ================================================================
   AUTH SCREEN
   ================================================================ */
let authRole = "student";

function showAuthStep(id) {
  ["stLogin","stRegister","stForgot","adLogin"].forEach(x => $id(x).classList.remove("on"));
  $id(id).classList.add("on");
  if (id === "stForgot") { $id("fpStep1").style.display = "block"; $id("fpStep2").style.display = "none"; }
  ["stLoginErr","rgErr","fpErr","adLoginErr"].forEach(x => { $id(x).style.display = "none"; });
}

function showErr(id, msg) {
  const el = $id(id);
  el.textContent = msg;
  el.style.display = "block";
}

function goRegisterStep(n) {
  [1,2,3].forEach(i => { $id("rgStep" + i).classList.toggle("on", i === n); });
  document.querySelectorAll(".regprogress .dot").forEach((d, i) => d.classList.toggle("on", i < n));
}

document.querySelectorAll(".roletabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".roletabs button").forEach(x => x.setAttribute("aria-selected", x === b));
  authRole = b.dataset.role;
  ["stEmail","stPass","rgName","rgRoll","rgEmail","rgPass","rgPass2","rgOtp", "fpEmail","fpOtp","fpPass","fpPass2","adEmail","adPass"].forEach(x => $id(x).value = "");
  goRegisterStep(1);
  $id("fpStep1").style.display = "block";
  $id("fpStep2").style.display = "none";
  showAuthStep(authRole === "student" ? "stLogin" : "adLogin");
});

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
    if (check.name && check.name.trim().toLowerCase() !== name.toLowerCase()) $id("rgName").value = check.name;
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
  } catch (e) { showErr("rgErr", e.message); }
  finally { btn.disabled = false; btn.textContent = "Send verification code"; }
};

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
  } catch (e) { showErr("rgErr", e.message); }
  finally { btn.disabled = false; btn.textContent = "Verify code"; }
};
$id("rgBackTo1").onclick = () => goRegisterStep(1);

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
  if (!skills.length && !(await askConfirm({ title: "Continue without skills?", message: "You can add skills later from your profile.", confirmText: "Continue" }))) return;

  const btn = $id("rgFinish");
  btn.disabled = true; btn.textContent = "Creating account…";
  try {
    const j = await api("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, name, roll_no: rollNo, password, branch, cgpa, backlog_count, phone, skills }),
    });
    localStorage.setItem("cl_token", j.token);
    toast("Welcome to CareerLink", "ok");
    enterApp(j.role, j.user);
  } catch (e) {
    showErr("rgErr", e.message);
    btn.disabled = false; btn.textContent = "Create account";
  }
};

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
  try { state.allSkills = await api("/api/skills"); } catch (_) { state.allSkills = []; }
}

function renderRegisterSkills() {
  const box = $id("rgSkills");
  if (!state.allSkills.length) {
    box.innerHTML = `<span class="chip-empty">No skills loaded — you can add them later from your profile.</span>`;
    return;
  }
  box.innerHTML = state.allSkills.map(s => `<button type="button" class="skill-chip" data-name="${esc(s)}">${esc(s)}</button>`).join("");
  box.querySelectorAll(".skill-chip").forEach(c => c.onclick = () => { c.classList.toggle("on"); updateRegSkillCount(); });
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
    ["overview",      "Overview",          ICONS.chart],
    ["students",      "Students",          ICONS.users],
    ["post",          "Post Opportunity",  ICONS.plus],
    ["apps",          "Applications",      ICONS.layers],
    ["companies",     "Companies",         ICONS.building],
    ["announcements", "Announcements",     ICONS.megaphone],
    ["placements",    "Bulk Placements",   ICONS.upload],
  ],
};

function enterApp(role, user) {
  state.role = role;
  state.user = user;

  $id("auth").style.display = "none";
  $id("app").classList.add("on");
  $id("portalName").textContent = role === "student" ? "Student Portal" : "Placement Cell Portal";
  $id("avatar").textContent = role === "student" ? (user.name || "S").trim().charAt(0).toUpperCase() : "P";

  const items = NAV[role];
  $id("nav").innerHTML = items.map(([k, label, icon], i) =>
    `<button data-view="${k}" class="${i ? "" : "active"}"><span class="ic">${icon}</span>${label}</button>`).join("");

  $id("nav").querySelectorAll("button").forEach(b => b.onclick = () => {
    $id("nav").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });   // keeps the active pill visible on phones
    render(b.dataset.view);
  });

  render(items[0][0]);
  if (role === "student") {
    loadNotificationBadge();
    showAnnouncements();
  }
  window.scrollTo(0, 0);
}

function hardLogout() {
  localStorage.removeItem("cl_token");
  sessionStorage.removeItem("seen_announcements");
  state.role = null; state.user = null;
  if (state.statsTimer) { clearInterval(state.statsTimer); state.statsTimer = null; }
  $id("app").classList.remove("on");
  $id("main").innerHTML = "";
  const bar = $id("announcementBar"); if (bar) bar.remove();
  $id("auth").style.display = "grid";
  showAuthStep("stLogin");
}

$id("signout").onclick = async () => {
  if (await askConfirm({ title: "Sign out of CareerLink?", message: "You'll need to sign in again to continue.", confirmText: "Sign out", danger: true })) hardLogout();
};

$id("chpwd").onclick = () => {
  if (state.role === "student") {
    $id("app").classList.remove("on");
    $id("auth").style.display = "grid";
    showAuthStep("stForgot");
    $id("fpEmail").value = state.user.email || "";
  } else {
    toast("Admin passwords are managed by the placement cell team");
  }
};

/* ================================================================
   VIEW ROUTER
   ================================================================ */
const VIEWS = {
  opps: viewOpportunities, mine: viewMyApplications, profile: viewProfile, notes: viewNotifications,
  overview: viewAdminOverview, students: viewAdminStudents, post: viewAdminPost, apps: viewAdminApplications,
  companies: viewAdminCompanies, announcements: viewAdminAnnouncements, placements: viewAdminPlacements,
};

let renderSeq = 0;
function render(view) {
  const fn = VIEWS[view];
  if (!fn) return;
  if (state.statsTimer && view !== "apps") { clearInterval(state.statsTimer); state.statsTimer = null; }
  const main = $id("main");
  const seq = ++renderSeq;               // a slower, older request must never overwrite a newer view
  main.classList.remove("swap");
  main.innerHTML = `<div class="empty">Loading…</div>`;
  Promise.resolve(fn())
    .then(html => {
      if (seq !== renderSeq) return;
      main.innerHTML = html; bindView(view); window.scrollTo(0, 0);
      void main.offsetWidth; main.classList.add("swap");
    })
    .catch(e => { if (seq === renderSeq) main.innerHTML = `<div class="empty"><b>Couldn't load</b>${esc(e.message)}</div>`; });
}

function head(title, subtitle, extra = "") {
  return `<div class="pagehead"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${extra}</div>`;
}

/* ================================================================
   STUDENT VIEWS
   ================================================================ */
async function viewOpportunities() {
  const opps = await api("/api/opportunities", { headers: authHeaders(false) });
  state.lastOpps = opps;
  if (!opps.length) return head("Opportunities", "No active postings yet.") + `<div class="panel empty"><b>Nothing here yet</b>The placement cell hasn't posted anything.</div>`;

  const me = state.user;
  const cards = opps.map(o => {
    const locked = !o.eligible;
    const appliedAlready = o.already_applied;
    return `<article class="job ${locked ? "locked" : ""}" data-opp-id="${o.id}" tabindex="0">
      <div>
        <h3>${esc(o.role)} ${locked ? '<span class="badge warn">Not eligible</span>' : '<span class="badge">Eligible</span>'}</h3>
        <p class="co">${esc(o.company)} · ${o.number_of_openings} opening${Number(o.number_of_openings) === 1 ? "" : "s"}</p>
        ${o.company_description ? `<p class="about">${esc(o.company_description)}</p>` : ""}
        <div class="tags">
          <span class="tag">CGPA ≥ ${o.eligibility_cgpa}</span>
          <span class="tag">${esc(o.eligible_branch || "Any branch")}</span>
          <span class="tag">Backlogs ≤ ${o.max_backlogs}</span>
          <span class="tag">Apply by ${esc(o.application_deadline || "TBD")}</span>
          ${(o.required_skills || "").split(",").map(s => s.trim()).filter(Boolean).map(s => `<span class="tag skill">${esc(s)}</span>`).join("")}
          ${o.match_score != null ? `<span class="tag match">${o.match_score}% match · ${esc(o.match_label)}</span>` : ""}
        </div>
      </div>
      <div class="jobside">
        <div class="pkg">₹${o.package_offered} LPA<small>${o.applicant_count} applied</small></div>
        <div class="act">
          <button class="apply" data-apply="${o.id}" ${locked || appliedAlready ? "disabled" : ""}>${appliedAlready ? "Applied" : locked ? "Locked" : "Apply now"}</button>
          ${locked ? `<span class="why">${esc(o.ineligible_reason)}</span>` : ""}
        </div>
      </div>
    </article>`;
  }).join("");

  return head("Opportunities", "Roles open to you right now. Click any card for full details.",
    `<span class="chip on">${esc(me.branch || "—")} · CGPA ${me.cgpa ?? "—"}</span>`) + cards;
}

async function viewMyApplications() {
  const apps = await api("/api/applications/mine", { headers: authHeaders(false) });
  if (!apps.length) return head("My Applications", "Track where each application stands.") + `<div class="panel empty"><b>Nothing here yet</b>Apply to a role and it will show up here.</div>`;

  const stages = ["Applied", "Shortlisted", "Interview", "Selected"];
  const cards = apps.map(a => {
    const rejected = a.status === "Rejected";
    const withdrawn = a.status === "Withdrawn";
    const idx = stages.indexOf(a.status);
    const timeline = stages.map((s, i) => `<li class="${!rejected && !withdrawn && i <= idx ? "done" : ""}">${s}</li>`).join("");
    const rejLine = rejected ? `<li class="bad">Rejected</li>` : withdrawn ? `<li class="muted">Withdrawn</li>` : "";
    const canWithdraw = a.status === "Applied" || a.status === "Shortlisted";

    const interviewsBlock = (a.interviews && a.interviews.length) ? `
      <div class="app-extra">
        <b class="subhead">Interviews</b>
        ${a.interviews.map(iv => `
          <div class="iv">
            <b>Round ${iv.round}</b> · ${esc((iv.date || "TBD").replace(/,?\s*00:00$/, ""))}${iv.mode ? " · " + esc(iv.mode) : ""}
            ${iv.result && iv.result !== "Pending" ? `<span class="pill ${iv.result === "Cleared" ? "selected" : "rejected"}" style="margin-left:8px">${esc(iv.result)}</span>` : ""}
            ${iv.remarks ? `<br><small>${esc(iv.remarks)}</small>` : ""}
          </div>`).join("")}
      </div>` : "";

    const offerBlock = a.offer ? `
      <div class="offer">
        <b>Offer: ₹${a.offer.package_offered} LPA</b>
        ${a.offer.joining_date ? `<br><small>Joining ${esc(a.offer.joining_date)}</small>` : ""}
        <div class="acts">
          ${a.offer.status === "Pending"
            ? `<button class="mini go" data-offer-accept="${a.offer.id}">Accept offer</button><button class="mini no" data-offer-reject="${a.offer.id}">Decline</button>`
            : `<span class="pill ${a.offer.status.toLowerCase()}">${esc(a.offer.status)}</span>`}
        </div>
      </div>` : "";

    return `<div class="panel" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:flex-start">
        <div>
          <h3 style="font-size:17px">${esc(a.role)}</h3>
          <p style="margin-top:4px;color:var(--ink-soft);font-size:14px">${esc(a.company)} · applied ${esc(a.application_date)} · ₹${a.package_offered} LPA</p>
        </div>
        <span class="pill ${a.status.toLowerCase()}">${esc(a.status)}</span>
      </div>
      <ul class="timeline">${timeline}${rejLine}</ul>
      ${canWithdraw ? `<button class="mini no" data-withdraw="${a.id}" style="margin-top:10px">Withdraw application</button>` : ""}
      ${interviewsBlock}
      ${offerBlock}
    </div>`;
  }).join("");

  return head("My Applications", "Track where each application stands.") + cards;
}

async function viewProfile() {
  const p = await api("/api/students/me", { headers: authHeaders(false) });
  await loadSkillCatalogue();
  const resumeName = p.resume_path || null;

  const skillChips = p.skills.length
    ? p.skills.map(s => `<span class="tag skill" data-remove-skill="${esc(s)}" style="cursor:pointer;padding-right:8px">${esc(s)} <span style="opacity:.55;margin-left:4px">×</span></span>`).join("")
    : '<span style="color:var(--ink-soft);font-size:13.5px">No skills selected yet.</span>';

  const placementsBlock = (p.placements && p.placements.length) ? `
    <div class="panel" style="margin-top:16px;border-color:var(--green)">
      <h3 style="margin-bottom:12px;color:var(--green)">Placements</h3>
      ${p.placements.map(pl => `
        <div style="padding:12px;background:var(--green-soft);border-radius:10px;margin-bottom:8px">
          <b>${esc(pl.company)}</b> — ${esc(pl.role)}
          <br><small style="color:var(--ink-soft)">₹${pl.package_offered} LPA${pl.joining_date ? " · Joining " + esc(pl.joining_date) : ""}</small>
        </div>`).join("")}
    </div>` : "";

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
      <label class="field"><span class="lab"><span>Full name</span></span><input class="input" id="pfName" value="${esc(p.name)}"></label>
      <label class="field"><span class="lab"><span>Roll number</span></span><input class="input" value="${esc(p.roll_no)}" disabled></label>
      <label class="field"><span class="lab"><span>Email</span></span><input class="input" value="${esc(p.email)}" disabled></label>
      <div class="field-row">
        <label class="field"><span class="lab"><span>Branch</span></span>
          <select class="input" id="pfBranch">${["CSE","IT","ECE","EEE","ME","CE"].map(b => `<option ${b === p.branch ? "selected" : ""}>${b}</option>`).join("")}</select></label>
        <label class="field"><span class="lab"><span>Phone</span></span><input class="input" id="pfPhone" value="${esc(p.phone || "")}" placeholder="+91…"></label>
      </div>
      <div class="field-row">
        <label class="field"><span class="lab"><span>CGPA</span></span><input class="input" id="pfCgpa" type="number" step="0.01" min="0" max="10" value="${p.cgpa ?? 0}"></label>
        <label class="field"><span class="lab"><span>Backlogs</span></span><input class="input" id="pfBacklogs" type="number" min="0" value="${p.backlog_count ?? 0}"></label>
      </div>
      <label class="field"><span class="lab"><span>Current offer package (₹ LPA) — set to 0 if none</span></span><input class="input" id="pfOffer" type="number" step="0.01" min="0" value="${p.current_offer_package ?? 0}"></label>
      <button class="btn" id="pfSave">Save changes</button>
    </div>

    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:14px">Resume</h3>
      ${resumeName
        ? `<div class="resume-row"><div class="file"><b>${esc(resumeName)}</b><small>Uploaded</small></div><a class="mini" href="/uploads/resumes/${encodeURIComponent(resumeName)}" target="_blank" rel="noopener">View</a></div>`
        : `<div class="resume-row"><div class="file"><b>No resume uploaded</b><small>Upload a PDF — we'll extract your skills and CGPA automatically.</small></div></div>`}
      <label class="field" style="margin-top:14px"><span class="lab"><span>Upload new resume (PDF, max 5 MB)</span></span><input class="input" id="pfResume" type="file" accept="application/pdf"></label>
      <button class="btn" id="pfUpload">Upload &amp; extract</button>
      <div id="extractPanel" style="display:none;margin-top:16px"></div>
    </div>
  </div>

  <div class="panel" style="margin-top:16px">
    <h3 style="font-size:16px;margin-bottom:6px">Your skills</h3>
    <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 14px">Tap a skill to add or remove it. Skills are matched against each role's requirements during shortlisting.</p>
    <div class="tags" id="pfSkillTags" style="margin-bottom:14px">${skillChips}</div>
    <div class="chip-picker" id="pfSkillPicker"></div>
    <button class="btn" id="pfSkillSave" style="max-width:220px">Save skills</button>
  </div>
  ${placementsBlock}`;
}

async function viewNotifications() {
  const data = await api("/api/notifications", { headers: authHeaders(false) });
  if (!data.items.length) return head("Notifications", "Updates about your applications and new roles.") + `<div class="panel empty"><b>Nothing yet</b>You'll hear from us here.</div>`;

  const items = data.items.map(n => `
    <div class="notif-item ${n.is_read ? "" : "unread"} k-${n.kind}" data-nid="${n.id}">
      <b>${esc(n.title)}</b><p>${esc(n.message)}</p><small>${esc(n.created_at)}</small>
    </div>`).join("");

  const extra = data.unread ? `<div class="headactions"><span class="chip on">${data.unread} unread</span><button class="mini" id="markAllRead">Mark all as read</button></div>` : "";
  return head("Notifications", "Updates about your applications and new roles.", extra) + `<div class="panel flush">${items}</div>`;
}

/* ================================================================
   ADMIN VIEWS
   ================================================================ */
async function viewAdminOverview() {
  const s = await api("/api/admin/overview", { headers: authHeaders(false) });
  const recent = await api("/api/admin/applications", { headers: authHeaders(false) });
  const rows = recent.slice(0, 6).map(a => `<tr>
    <td><b>${esc(a.student.name)}</b><br><small style="color:var(--ink-soft)">${esc(a.student.roll_no)} · ${esc(a.student.branch)}</small></td>
    <td data-label="Role"><span>${esc(a.role)}<br><small style="color:var(--ink-soft)">${esc(a.company)}</small></span></td>
    <td data-label="Applied">${esc(a.application_date)}</td>
    <td data-label="Status"><span class="pill ${a.status.toLowerCase()}">${a.status}</span></td>
  </tr>`).join("");

  return head("Overview", "Placement activity at a glance.") + `
  <div class="grid g4" style="margin-bottom:18px">
    <div class="panel stat"><b>${s.active_opportunities}</b><small>Active opportunities</small></div>
    <div class="panel stat"><b>${s.total_applications}</b><small>Total applications</small></div>
    <div class="panel stat"><b>${s.in_process}</b><small>In process</small></div>
    <div class="panel stat accent"><b>${s.placed_count ?? 0}</b><small>Students placed</small></div>
  </div>

  <div class="grid g2" style="margin-bottom:18px">
    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:14px">Pipeline</h3>
      ${["Applied","Shortlisted","Interview","Selected","Rejected"].map(st => `<div class="pipe-row"><span>${st}</span><b>${recent.filter(a => a.status === st).length}</b></div>`).join("")}
    </div>
    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:14px">Placement rate</h3>
      <div class="pipe-row"><span>Students registered</span><b>${s.total_students ?? "—"}</b></div>
      <div class="pipe-row"><span>Students placed</span><b>${s.placed_count ?? 0}</b></div>
      <div class="pipe-row"><span>Highest package</span><b>${s.highest_package ? "₹" + s.highest_package + " LPA" : "—"}</b></div>
      <div class="pipe-row"><span>Average package</span><b>${s.average_package ? "₹" + s.average_package + " LPA" : "—"}</b></div>
    </div>
  </div>

  <div class="panel">
    <h3 style="font-size:16px;margin-bottom:12px">Recent applications</h3>
    ${recent.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Student</th><th>Role</th><th>Applied</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty"><b>No applications yet</b>They'll appear here as students apply.</div>`}
  </div>`;
}

async function viewAdminStudents() {
  const data = await api("/api/admin/students", { headers: authHeaders(false) });
  const list = Array.isArray(data) ? data : (data.students || []);
  if (!list.length) return head("Students", "Every registered student.") + `<div class="panel empty"><b>No students yet</b>Registrations will appear here.</div>`;

  const rows = list.map(s => `<tr data-student="${s.id}">
    <td><b>${esc(s.name)}</b><br><small style="color:var(--ink-soft)">${esc(s.roll_no)} · ${esc(s.branch || "—")}</small></td>
    <td data-label="CGPA">${s.cgpa ?? "—"}</td>
    <td data-label="Backlogs">${s.backlog_count ?? 0}</td>
    <td data-label="Skills"><small>${(s.skills || []).slice(0, 3).map(esc).join(", ") || "—"}</small></td>
    <td data-label="Status">${(s.placements && s.placements.length) ? `<span class="pill selected">Placed</span>` : `<span class="pill applied">Active</span>`}</td>
  </tr>`).join("");

  return head("Students", "Every registered student. Click a row for details.", `<input class="input" id="stSearch" placeholder="Search name or roll…" style="max-width:260px">`) + `
  <div class="panel"><div class="tablewrap"><table class="tbl" id="studentsTbl"><thead><tr><th>Student</th><th>CGPA</th><th>Backlogs</th><th>Skills</th><th>Status</th></tr></thead><tbody id="studentsBody">${rows}</tbody></table></div></div>`;
}

async function viewAdminPost() {
  return head("Post Opportunity", "Publish a role to eligible students.") + `
  <div class="panel" style="max-width:760px">
    <div class="field-row">
      <label class="field"><span class="lab"><span>Company</span></span><input class="input" id="poCompany" placeholder="Acme Corp"></label>
      <label class="field"><span class="lab"><span>Role</span></span><input class="input" id="poRole" placeholder="Software Engineer"></label>
    </div>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Package (₹ LPA)</span></span><input class="input" id="poPackage" type="number" step="0.01" min="0" placeholder="12"></label>
      <label class="field"><span class="lab"><span>Openings</span></span><input class="input" id="poOpenings" type="number" min="1" value="1"></label>
    </div>
    <label class="field"><span class="lab"><span>Company description</span></span><textarea class="input" id="poDesc" rows="3" placeholder="A short note students will see on the card."></textarea></label>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Minimum CGPA</span></span><input class="input" id="poCgpa" type="number" step="0.01" min="0" max="10" value="0"></label>
      <label class="field"><span class="lab"><span>Maximum backlogs</span></span><input class="input" id="poBacklogs" type="number" min="0" value="0"></label>
    </div>
    <div class="field-row">
      <label class="field"><span class="lab"><span>Eligible branch</span></span><select class="input" id="poBranch"><option value="">Any branch</option>${["CSE","IT","ECE","EEE","ME","CE"].map(b => `<option>${b}</option>`).join("")}</select></label>
      <label class="field"><span class="lab"><span>Application deadline</span></span><input class="input" id="poDeadline" type="date"></label>
    </div>
    <label class="field"><span class="lab"><span>Required skills (comma separated)</span></span><input class="input" id="poSkills" placeholder="React, Node.js, SQL"></label>
    <div id="poErr" class="err"></div>
    <button class="btn" id="poSubmit" style="max-width:240px">Publish opportunity</button>
  </div>`;
}

/* ---------- admin applications ---------- */
const APP_STATUSES = ["Applied","Shortlisted","Interview","Selected","Rejected","Withdrawn"];

function applicationRows(rows, filter = "All") {
  const list = filter === "All" ? rows : rows.filter(a => a.status === filter);
  if (!list.length) return `<tr><td colspan="5"><div class="empty" style="padding:24px"><b>Nothing here</b>No applications match this filter.</div></td></tr>`;

  return list.map(a => `<tr data-app="${a.id}">
    <td><b>${esc(a.student.name)}</b><br><small style="color:var(--ink-soft)">${esc(a.student.roll_no)} · ${esc(a.student.branch)}</small></td>
    <td data-label="Role"><span>${esc(a.role)}<br><small style="color:var(--ink-soft)">${esc(a.company)}</small></span></td>
    <td data-label="Applied"><small>${esc(a.application_date)}</small></td>
    <td data-label="Status"><select class="input mini-select" data-status="${a.id}">${APP_STATUSES.map(s => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td class="rowact"><button class="mini" data-interview="${a.id}">Interview</button><button class="mini go" data-offer="${a.id}">Offer</button></td>
  </tr>`).join("");
}

function bindAppRows(scope) {
  scope.querySelectorAll("[data-status]").forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.status;
      sel.disabled = true;
      try {
        await api(`/api/admin/applications/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status: sel.value }) });
        toast("Status updated", "ok");
      } catch (e) { toast(e.message, "err"); } finally { sel.disabled = false; }
    };
  });
  scope.querySelectorAll("[data-interview]").forEach(b => { b.onclick = () => interviewModal(b.dataset.interview); });
  scope.querySelectorAll("[data-offer]").forEach(b => { b.onclick = () => offerModal(b.dataset.offer); });
}

function interviewModal(appId) {
  const m = openModal(`
    <div class="modal-head"><h3>Schedule interview</h3><button class="modal-close" data-close>${ICONS.close}</button></div>
    <div class="modal-section" style="display:flex;flex-direction:column;gap:14px">
      <div class="field-row">
        <label class="field"><span class="lab"><span>Round</span></span><input class="input" id="ivRound" type="number" min="1" value="1"></label>
        <label class="field"><span class="lab"><span>Date</span></span><input class="input" id="ivDate" type="date"></label>
      </div>
      <label class="field"><span class="lab"><span>Mode</span></span><input class="input" id="ivMode" placeholder="Online / On-campus / Telephonic"></label>
      <label class="field"><span class="lab"><span>Remarks</span></span><textarea class="input" id="ivRemarks" rows="2"></textarea></label>
    </div>
    <div class="modal-foot"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="ivSave">Save round</button></div>`);

  m.el.querySelector("#ivSave").onclick = async (e) => {
    const btn = e.target; btn.disabled = true; btn.textContent = "Saving…";
    try {
      await api(`/api/admin/applications/${appId}/interviews`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ round: Number($id("ivRound").value || 1), date: $id("ivDate").value, mode: $id("ivMode").value.trim(), remarks: $id("ivRemarks").value.trim() }),
      });
      toast("Interview scheduled", "ok"); m.close(); render("apps");
    } catch (err) { toast(err.message, "err"); btn.disabled = false; btn.textContent = "Save round"; }
  };
}

function offerModal(appId) {
  const m = openModal(`
    <div class="modal-head"><h3>Release offer</h3><button class="modal-close" data-close>${ICONS.close}</button></div>
    <div class="modal-section" style="display:flex;flex-direction:column;gap:14px">
      <div class="field-row">
        <label class="field"><span class="lab"><span>Package (₹ LPA)</span></span><input class="input" id="ofPackage" type="number" step="0.01" min="0"></label>
        <label class="field"><span class="lab"><span>Joining date</span></span><input class="input" id="ofJoining" type="date"></label>
      </div>
    </div>
    <div class="modal-foot"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="ofSave">Send offer</button></div>`);

  m.el.querySelector("#ofSave").onclick = async (e) => {
    const btn = e.target; btn.disabled = true; btn.textContent = "Sending…";
    try {
      await api(`/api/admin/applications/${appId}/offer`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ package_offered: parseFloat($id("ofPackage").value || "0"), joining_date: $id("ofJoining").value }),
      });
      toast("Offer released", "ok"); m.close(); render("apps");
    } catch (err) { toast(err.message, "err"); btn.disabled = false; btn.textContent = "Send offer"; }
  };
}

async function viewAdminApplications() {
  const rows = await api("/api/admin/applications", { headers: authHeaders(false) });
  return head("Applications", "Move candidates through the pipeline.", `<select class="input" id="apFilter" style="max-width:190px"><option>All</option>${APP_STATUSES.map(s => `<option>${s}</option>`).join("")}</select>`) + `
  <div class="panel"><div class="tablewrap"><table class="tbl"><thead><tr><th>Student</th><th>Role</th><th>Applied</th><th>Status</th><th></th></tr></thead><tbody id="appsBody">${applicationRows(rows)}</tbody></table></div></div>`;
}

async function viewAdminCompanies() {
  const companies = await api("/api/admin/companies", { headers: authHeaders(false) });
  
  if (!companies.length) return head("Companies", "Recruiters on the platform.")
    + `<div class="panel empty"><b>No companies yet</b>Post an opportunity to get started.</div>`;

  state.adminOpps = [];
  const cards = companies.sort((a, b) => b.applicant_count - a.applicant_count).map(c => `
    <div class="panel" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div>
          <h3 style="font-size:17px;margin:0">${esc(c.name)}</h3>
          <p style="margin:6px 0 0;color:var(--ink-soft);font-size:13.5px">
            ${c.opportunities.length} role${c.opportunities.length === 1 ? "" : "s"} · 
            ${c.applicant_count} application${c.applicant_count === 1 ? "" : "s"}
          </p>
          ${c.description ? `<p class="about" style="margin-top:8px">${esc(c.description)}</p>` : ""}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          ${c.opportunities.map(o => `
            <button class="mini" data-admin-opp="${state.adminOpps.push(o) - 1}">
              ${esc(o.role)} · ₹${o.package_offered} LPA · Details
            </button>
          `).join("")}
        </div>
      </div>
    </div>`).join("");

  return head("Companies", "Recruiters on the platform, ranked by activity.") + cards;
}

async function viewAdminAnnouncements() {
  let items = [];
  try {
    const d = await api("/api/admin/announcements", { headers: authHeaders(false) });
    items = Array.isArray(d) ? d : (d.items || []);
  } catch (_) { items = []; }

  const list = items.length ? items.map(a => `
    <div class="panel" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start">
        <div>
          <b>${esc(a.title)}</b>
          <span class="pill ${a.priority === "important" ? "rejected" : "interview"}" style="margin-left:8px">${esc(a.priority)}</span>
          ${a.status === "Pending" ? `<span class="pill applied" style="margin-left:8px">Pending approval</span>` : ""}
          <p style="margin:8px 0 0;font-size:13.5px;color:var(--ink-soft)">${esc(a.message)}</p>
          <small style="color:var(--ink-soft)">Posted by ${esc(a.created_by)} · ${esc(a.created_at || "")}</small>
        </div>
        <div style="display:flex;gap:6px;flex-direction:column;">
          ${state.user.is_super && a.status === "Pending" 
            ? `<button class="mini go" data-approve-ann="${a.id}">Approve</button>` : ""}
          <button class="mini no" data-del-ann="${a.id}">Delete</button>
        </div>
      </div>
    </div>`).join("") : `<div class="empty"><b>No announcements</b>Post one and it pops up for students on login.</div>`;

  return head("Announcements", "Students see these as pop-ups the next time they sign in.") + `
  <div class="grid g2">
    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:14px">New announcement</h3>
      <label class="field"><span class="lab"><span>Title</span></span><input class="input" id="anTitle" placeholder="Amazon drive on Friday"></label>
      <label class="field"><span class="lab"><span>Message</span></span><textarea class="input" id="anMsg" rows="4" placeholder="Details students need to know…"></textarea></label>
      <label class="field"><span class="lab"><span>Priority</span></span><select class="input" id="anPriority"><option value="normal">Normal</option><option value="important">Important</option></select></label>
      <div id="anErr" class="err"></div>
      <button class="btn" id="anPost" style="max-width:200px">Publish</button>
      ${!state.user.is_super ? `<p style="font-size:12px;color:var(--ink-soft);margin-top:8px">Note: Your announcement will be sent to a Super Admin for approval.</p>` : ""}
    </div>
    <div><h3 style="font-size:16px;margin-bottom:14px">Published</h3>${list}</div>
  </div>`;
}

async function viewAdminPlacements() {
  return head("Bulk Placements", "Record offers in one go — CSV or manual entry.") + `
  <div class="grid g2">
    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:8px">Upload CSV</h3>
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 14px">One row per placement: <code>roll_no, company, role, package, joining_date</code>.</p>
      <label class="field"><span class="lab"><span>File</span></span><input class="input" id="plFile" type="file" accept=".csv,text/csv"></label>
      <label class="field"><span class="lab"><span>…or paste rows</span></span><textarea class="input" id="plCsv" rows="6" placeholder="21CSE001, Acme Corp, Software Engineer, 12, 2026-07-01"></textarea></label>
      <div id="plErr" class="err"></div>
      <button class="btn" id="plImport" style="max-width:220px">Import placements</button>
      <div id="plResult" style="margin-top:16px"></div>
    </div>

    <div class="panel">
      <h3 style="font-size:16px;margin-bottom:8px">Manual entry</h3>
      <label class="field"><span class="lab"><span>Roll number</span></span><input class="input" id="plRoll" placeholder="21CSE001"></label>
      <div class="field-row">
        <label class="field"><span class="lab"><span>Company</span></span><input class="input" id="plCompany" placeholder="Acme Corp"></label>
        <label class="field"><span class="lab"><span>Role</span></span><input class="input" id="plRole" placeholder="Software Engineer"></label>
      </div>
      <div class="field-row">
        <label class="field"><span class="lab"><span>Package (₹ LPA)</span></span><input class="input" id="plPackage" type="number" step="0.01" min="0"></label>
        <label class="field"><span class="lab"><span>Joining date</span></span><input class="input" id="plJoining" type="date"></label>
      </div>
      <button class="btn" id="plAdd" style="max-width:220px">Add placement</button>
    </div>
  </div>`;
}

/* ================================================================
   MODAL & BINDINGS
   ================================================================ */
let modalCount = 0;
function openModal(inner, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop" + (opts.small ? " small" : "");
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" tabindex="-1">${inner}</div>`;
  document.body.appendChild(wrap);

  const returnTo = document.activeElement;
  if (++modalCount === 1) document.body.style.overflow = "hidden";   // stop the page scrolling behind the sheet
  requestAnimationFrame(() => { wrap.classList.add("on"); const m = wrap.querySelector(".modal"); if (m && !m.contains(document.activeElement)) m.focus({ preventScroll: true }); });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.remove("on");
    document.removeEventListener("keydown", onKey);
    if (--modalCount === 0) document.body.style.overflow = "";
    if (returnTo && returnTo.focus && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
    if (opts.onClose) opts.onClose();
    setTimeout(() => wrap.remove(), 250);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
  wrap.querySelectorAll("[data-close]").forEach(b => b.onclick = close);
  document.addEventListener("keydown", onKey);

  return { wrap, close, el: wrap.querySelector(".modal") };
}

/* Apple-style confirmation sheet — replaces the browser's native confirm() */
function askConfirm({ title, message = "", confirmText = "Confirm", cancelText = "Cancel", danger = false }) {
  return new Promise(resolve => {
    let decided = false;
    const m = openModal(`
      <div class="dialog">
        <h3>${esc(title)}</h3>
        ${message ? `<p>${esc(message)}</p>` : ""}
        <div class="dialog-actions">
          <button class="btn ghost" data-close>${esc(cancelText)}</button>
          <button class="btn ${danger ? "danger" : ""}" id="dlgOk">${esc(confirmText)}</button>
        </div>
      </div>`, { small: true, onClose: () => { if (!decided) { decided = true; resolve(false); } } });
    const ok = m.el.querySelector("#dlgOk");
    ok.onclick = () => { decided = true; m.close(); resolve(true); };
    setTimeout(() => ok.focus({ preventScroll: true }), 30);
  });
}

async function openOpportunity(id) {
  try {
    let o = (state.lastOpps || []).find(x => String(x.id) === String(id));
    if (!o) {
      const opps = await api("/api/opportunities", { headers: authHeaders(false) });
      state.lastOpps = opps;
      o = opps.find(x => String(x.id) === String(id));
    }
    if (!o) return toast("Could not load details", "err");

    const locked = !o.eligible;
    const applied = o.already_applied;

    // Mark each requirement on its own; fall back to the server's overall verdict if profile data is missing/stale.
    const u = state.user || {};
    const branches = (o.eligible_branch || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
    let checks = {
      cgpa:    u.cgpa == null ? null : Number(u.cgpa) >= Number(o.eligibility_cgpa),
      branch:  !branches.length ? true : (u.branch ? branches.includes(String(u.branch).toLowerCase()) : null),
      backlog: u.backlog_count == null ? null : Number(u.backlog_count) <= Number(o.max_backlogs),
    };
    const anyFail = Object.values(checks).includes(false);
    const cls = (k) => !locked ? "pass" : (anyFail ? (checks[k] === false ? "fail" : "pass") : "fail");

    const m = openModal(`
      <button class="modal-close" data-close>${ICONS.close}</button>
      <div class="modal-head">
        <div>
          <span class="modal-company">${esc(o.company)}</span>
          <h1>${esc(o.role)}</h1>
          <div class="modal-meta">
            <span class="tag">CGPA ≥ ${o.eligibility_cgpa}</span>
            <span class="tag">${esc(o.eligible_branch || "Any branch")}</span>
            <span class="tag">Backlogs ≤ ${o.max_backlogs}</span>
            <span class="tag">Apply by ${esc(o.application_deadline || "TBD")}</span>
          </div>
        </div>
        <div class="modal-package"><small>Package</small><b>₹${o.package_offered} LPA</b></div>
      </div>

      ${o.company_description ? `<div class="modal-section"><h2>About the role</h2><p>${esc(o.company_description)}</p></div>` : ""}

      <div class="modal-section">
        <h2>Eligibility Criteria</h2>
        <ul class="modal-criteria">
          <li class="${cls("cgpa")}">CGPA ≥ ${o.eligibility_cgpa}</li>
          <li class="${cls("branch")}">${esc(o.eligible_branch || "Any branch")}</li>
          <li class="${cls("backlog")}">Max ${o.max_backlogs} active ${Number(o.max_backlogs) === 1 ? "backlog" : "backlogs"}</li>
        </ul>
        ${locked ? `<div class="modal-warn">${esc(o.ineligible_reason || "You aren't eligible for this role.")}</div>` : ""}
      </div>

      <div class="modal-section">
        <h2>Required Skills</h2>
        <div class="tags">
          ${(o.required_skills || "").split(",").map(s => s.trim()).filter(Boolean).map(s => `<span class="tag skill">${esc(s)}</span>`).join("") || '<span class="tag">None specified</span>'}
          ${o.match_score != null ? `<span class="tag match">${o.match_score}% match</span>` : ""}
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn" id="modalApply" ${locked || applied ? "disabled" : ""}>${applied ? "Already applied" : locked ? "Not eligible" : "Apply Now"}</button>
      </div>
    `);

    const applyBtn = m.el.querySelector("#modalApply");
    if (applyBtn && !applyBtn.disabled) {
      applyBtn.onclick = async () => {
        applyBtn.disabled = true; applyBtn.textContent = "Applying…";
        try {
          await api("/api/applications", { method: "POST", headers: authHeaders(), body: JSON.stringify({ opportunity_id: Number(o.id) }) });
          toast("Application submitted", "ok"); m.close(); render("opps");
        } catch (e) { toast(e.message, "err"); applyBtn.disabled = false; applyBtn.textContent = "Apply Now"; }
      };
    }
  } catch (err) {
    console.error(err); toast("Failed to open details", "err");
  }
}

function openAdminOpportunityModal(o) {
  const m = openModal(`
    <button class="modal-close" data-close>${ICONS.close}</button>
    <div class="modal-head">
      <div>
        <span class="modal-company">${esc(o.company)}</span>
        <h1>${esc(o.role)}</h1>
        <div class="modal-meta">
          <span class="tag">CGPA ≥ ${o.eligibility_cgpa}</span>
          <span class="tag">${esc(o.eligible_branch || "Any branch")}</span>
          <span class="tag">Backlogs ≤ ${o.max_backlogs}</span>
        </div>
      </div>
      <div class="modal-package"><small>Package</small><b>₹${o.package_offered} LPA</b></div>
    </div>
    <div class="modal-section">
      <h2>Description</h2>
      <p>${esc(o.company_description || o.job_description || "No description provided.")}</p>
    </div>
    <div class="modal-section">
      <h2>Stats</h2>
      <div class="pipe-row"><span>Total Applicants</span><b>${o.applicant_count}</b></div>
      <div class="pipe-row"><span>Posted Date</span><b>${esc(o.posted_date || "—")}</b></div>
      <div class="pipe-row"><span>Deadline</span><b>${esc(o.application_deadline || "TBD")}</b></div>
    </div>
    <div class="modal-foot">
      <button class="btn ghost" data-close>Close</button>
    </div>
  `);
}

function bindView(view) {
  const main = $id("main");

  if (view === "opps") {
    main.querySelectorAll("[data-apply]").forEach(b => {
      b.onclick = async (e) => {
        e.stopPropagation();
        if (!(await askConfirm({ title: "Submit your application?", message: "You can withdraw it later from My Applications.", confirmText: "Apply" }))) return;
        const id = b.dataset.apply;
        b.disabled = true; b.textContent = "Applying…";
        try {
          await api("/api/applications", { method: "POST", headers: authHeaders(), body: JSON.stringify({ opportunity_id: Number(id) }) });
          toast("Application submitted", "ok"); render("opps");
        } catch (err) { toast(err.message, "err"); b.disabled = false; b.textContent = "Apply now"; }
      };
    });
    main.querySelectorAll(".job").forEach(card => {
      card.onclick = () => openOpportunity(card.dataset.oppId);
      card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); } };
    });
  }

  if (view === "mine") {
    main.querySelectorAll("[data-withdraw]").forEach(b => {
      b.onclick = async () => {
        if (!(await askConfirm({ title: "Withdraw this application?", message: "This can't be undone.", confirmText: "Withdraw", danger: true }))) return;
        b.disabled = true; b.textContent = "Withdrawing…";
        try {
          await api(`/api/applications/${b.dataset.withdraw}/withdraw`, { method: "POST", headers: authHeaders() });
          toast("Application withdrawn", "ok"); render("mine");
        } catch (e) { toast(e.message, "err"); b.disabled = false; b.textContent = "Withdraw application"; }
      };
    });

    const respond = async (offerId, action, btn) => {
      const accepting = action === "accept";
      if (!(await askConfirm({ title: accepting ? "Accept this offer?" : "Decline this offer?", confirmText: accepting ? "Accept" : "Decline", danger: !accepting }))) return;
      btn.disabled = true;
      try {
        await api(`/api/offers/${offerId}/respond`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ action }) });
        toast(accepting ? "Offer accepted" : "Offer declined", "ok"); render("mine");
      } catch (e) { toast(e.message, "err"); btn.disabled = false; }
    };

    main.querySelectorAll("[data-offer-accept]").forEach(b => { b.onclick = () => respond(b.dataset.offerAccept, "accept", b); });
    main.querySelectorAll("[data-offer-reject]").forEach(b => { b.onclick = () => respond(b.dataset.offerReject, "reject", b); });
  }

  if (view === "profile") {
    $id("pfSave").onclick = async (e) => {
      const btn = e.target;
      const cgpa = parseFloat($id("pfCgpa").value || "0");
      if (!(cgpa >= 0 && cgpa <= 10)) return toast("CGPA must be between 0 and 10", "err");
      btn.disabled = true; btn.textContent = "Saving…";
      try {
        await api("/api/students/me", {
          method: "PATCH", headers: authHeaders(),
          body: JSON.stringify({
            name: $id("pfName").value.trim(), branch: $id("pfBranch").value, phone: $id("pfPhone").value.trim(),
            cgpa, backlog_count: parseInt($id("pfBacklogs").value || "0", 10), current_offer_package: parseFloat($id("pfOffer").value || "0"),
          }),
        });
        Object.assign(state.user, {
          name: $id("pfName").value.trim() || state.user.name, branch: $id("pfBranch").value, phone: $id("pfPhone").value.trim(),
          cgpa, backlog_count: parseInt($id("pfBacklogs").value || "0", 10),
        });
        $id("avatar").textContent = (state.user.name || "S").trim().charAt(0).toUpperCase();
        toast("Profile updated", "ok");
      } catch (err) { toast(err.message, "err"); } finally { btn.disabled = false; btn.textContent = "Save changes"; }
    };

    const picker = $id("pfSkillPicker");
    const selected = new Set([...document.querySelectorAll("#pfSkillTags [data-remove-skill]")].map(el => el.dataset.removeSkill));

    if (state.allSkills.length) {
      picker.innerHTML = state.allSkills.map(s => `<button type="button" class="skill-chip ${selected.has(s) ? "on" : ""}" data-pick="${esc(s)}">${esc(s)}</button>`).join("");
      picker.querySelectorAll(".skill-chip").forEach(c => {
        c.onclick = () => { c.classList.toggle("on"); c.classList.contains("on") ? selected.add(c.dataset.pick) : selected.delete(c.dataset.pick); };
      });
    } else { picker.innerHTML = `<span class="chip-empty">No skills loaded.</span>`; }

    document.querySelectorAll("#pfSkillTags [data-remove-skill]").forEach(el => {
      el.onclick = () => { el.remove(); selected.delete(el.dataset.removeSkill); };
    });

    $id("pfSkillSave").onclick = async (e) => {
      const btn = e.target; btn.disabled = true; btn.textContent = "Saving…";
      try {
        await api("/api/students/me", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ skills: [...selected] }) });
        toast("Skills saved", "ok"); render("profile");
      } catch (err) { toast(err.message, "err"); btn.disabled = false; btn.textContent = "Save skills"; }
    };

    $id("pfUpload").onclick = async (e) => {
      const input = $id("pfResume");
      const file = input.files && input.files[0];
      if (!file) return toast("Choose a PDF first", "err");
      if (file.type !== "application/pdf") return toast("Only PDF files are allowed", "err");
      if (file.size > 5 * 1024 * 1024) return toast("File is larger than 5 MB", "err");

      const btn = e.target; btn.disabled = true; btn.textContent = "Uploading…";
      try {
        const fd = new FormData(); fd.append("resume", file);
        const j = await api("/api/students/me/resume", { method: "POST", headers: authHeaders(false), body: fd });
        toast("Resume uploaded", "ok");
        const ex = j.extracted || {};
        const panel = $id("extractPanel");
        panel.style.display = "block";
        panel.innerHTML = `
          <div class="panel" style="background:var(--paper);box-shadow:none">
            <b style="font-size:14px">Extracted from your resume</b>
            <p style="margin:8px 0 0;font-size:13.5px;color:var(--ink-soft)">
              ${ex.cgpa != null ? `CGPA <b>${ex.cgpa}</b><br>` : ""}
              ${(ex.skills && ex.skills.length) ? "Skills: " + ex.skills.map(s => `<span class="tag skill">${esc(s)}</span>`).join(" ") : "No skills detected."}
            </p>
            <button class="mini go" id="pfApplyExtract" style="margin-top:12px">Apply to profile</button>
          </div>`;
        $id("pfApplyExtract").onclick = async (ev) => {
          ev.target.disabled = true;
          try {
            await api("/api/students/me", {
              method: "PATCH", headers: authHeaders(),
              body: JSON.stringify({ skills: [...new Set([...selected, ...(ex.skills || [])])], ...(ex.cgpa != null ? { cgpa: ex.cgpa } : {}) }),
            });
            toast("Profile updated from resume", "ok"); render("profile");
          } catch (err) { toast(err.message, "err"); ev.target.disabled = false; }
        };
      } catch (err) { toast(err.message, "err"); } finally { btn.disabled = false; btn.textContent = "Upload & extract"; }
    };
  }

  if (view === "notes") {
    const markAll = $id("markAllRead");
    if (markAll) markAll.onclick = async () => {
      markAll.disabled = true;
      try {
        await api("/api/notifications/read-all", { method: "POST", headers: authHeaders() });
        toast("All caught up", "ok"); render("notes"); loadNotificationBadge();
      } catch (e) { toast(e.message, "err"); markAll.disabled = false; }
    };
    main.querySelectorAll("[data-nid]").forEach(el => {
      el.onclick = async () => {
        if (!el.classList.contains("unread")) return;
        el.classList.remove("unread");
        try { await api(`/api/notifications/${el.dataset.nid}/read`, { method: "POST", headers: authHeaders() }); loadNotificationBadge(); } catch (_) {}
      };
    });
  }

  if (view === "students") {
    const body = $id("studentsBody");
    const search = $id("stSearch");
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      body.querySelectorAll("tr").forEach(tr => { tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? "" : "none"; });
    };
    body.querySelectorAll("[data-student]").forEach(tr => {
      tr.style.cursor = "pointer"; tr.onclick = () => studentModal(tr.dataset.student);
    });
  }

  if (view === "post") {
    $id("poSubmit").onclick = async (e) => {
      const err = $id("poErr"); err.style.display = "none";
      const payload = {
        company: $id("poCompany").value.trim(), role: $id("poRole").value.trim(),
        package_offered: parseFloat($id("poPackage").value || "0"), company_description: $id("poDesc").value.trim(),
        eligibility_cgpa: parseFloat($id("poCgpa").value || "0"), eligible_branch: $id("poBranch").value,
        max_backlogs: parseInt($id("poBacklogs").value || "0", 10), number_of_openings: parseInt($id("poOpenings").value || "1", 10),
        application_deadline: $id("poDeadline").value, required_skills: $id("poSkills").value.trim(),
      };
      const fail = (m) => { err.textContent = m; err.style.display = "block"; };
      if (!payload.company) return fail("Company name is required");
      if (!payload.role) return fail("Role is required");
      if (!(payload.package_offered > 0)) return fail("Enter a package greater than 0");

      const btn = e.target; btn.disabled = true; btn.textContent = "Publishing…";
      try {
        await api("/api/admin/opportunities", { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
        toast("Opportunity published", "ok"); render("post");
      } catch (ex) { fail(ex.message); btn.disabled = false; btn.textContent = "Publish opportunity"; }
    };
  }

  if (view === "apps") {
    const filter = $id("apFilter");
    const refresh = async () => {
      try {
        const rows = await api("/api/admin/applications", { headers: authHeaders(false) });
        const tbody = $id("appsBody");
        if (!tbody) return;
        if (tbody.contains(document.activeElement)) return;   // user is mid-edit; skip this refresh
        tbody.innerHTML = applicationRows(rows, filter.value);
        bindAppRows(tbody);
      } catch (_) {}
    };
    filter.onchange = refresh; bindAppRows(main); state.statsTimer = setInterval(refresh, 20000);
  }

  if (view === "announcements") {
    $id("anPost").onclick = async (e) => {
      const err = $id("anErr"); err.style.display = "none";
      const title = $id("anTitle").value.trim(); const message = $id("anMsg").value.trim();
      if (!title) { err.textContent = "Give the announcement a title"; err.style.display = "block"; return; }
      if (!message) { err.textContent = "Write a message"; err.style.display = "block"; return; }
      const btn = e.target; btn.disabled = true; btn.textContent = "Publishing…";
      try {
        await api("/api/admin/announcements", { method: "POST", headers: authHeaders(), body: JSON.stringify({ title, message, priority: $id("anPriority").value }) });
        toast("Announcement published", "ok"); render("announcements");
      } catch (ex) { err.textContent = ex.message; err.style.display = "block"; btn.disabled = false; btn.textContent = "Publish"; }
    };

    main.querySelectorAll("[data-approve-ann]").forEach(b => {
      b.onclick = async () => {
        b.disabled = true;
        try {
          await api(`/api/admin/announcements/${b.dataset.approveAnn}/approve`, { method: "POST", headers: authHeaders() });
          toast("Announcement Approved", "ok");
          render("announcements");
        } catch (e) { toast(e.message, "err"); b.disabled = false; }
      };
    });

    main.querySelectorAll("[data-del-ann]").forEach(b => {
      b.onclick = async () => {
        if (!(await askConfirm({ title: "Delete this announcement?", confirmText: "Delete", danger: true }))) return;
        b.disabled = true;
        try { await api(`/api/admin/announcements/${b.dataset.delAnn}`, { method: "DELETE", headers: authHeaders() }); toast("Deleted", "ok"); render("announcements"); }
        catch (e) { toast(e.message, "err"); b.disabled = false; }
      };
    });
  }

  if (view === "companies") {
    main.querySelectorAll("[data-admin-opp]").forEach(btn => {
      btn.onclick = () => {
        const o = state.adminOpps[Number(btn.dataset.adminOpp)];
        if (o) openAdminOpportunityModal(o);
      };
    });
  }

  if (view === "placements") {
    const send = async (items, btn, label) => {
      const err = $id("plErr"); err.style.display = "none";
      if (!items.length) { err.textContent = "Nothing to import"; err.style.display = "block"; return; }
      btn.disabled = true; btn.textContent = "Importing…";
      try {
        const res = await api("/api/admin/placements/bulk", { method: "POST", headers: authHeaders(), body: JSON.stringify({ items }) });
        const ok = res.imported ?? items.length; const skipped = (res.skipped || []).length;
        $id("plResult").innerHTML = `<div class="notice ok"><b>${ok} placement${ok === 1 ? "" : "s"} recorded.</b>${skipped ? `<br>${skipped} row(s) skipped: ${esc((res.skipped || []).join(", "))}` : ""}</div>`;
        toast("Placements imported", "ok");
        if (!skipped) { $id("plCsv").value = ""; $id("plFile").value = ""; }
      } catch (e) { err.textContent = e.message; err.style.display = "block"; } finally { btn.disabled = false; btn.textContent = label; }
    };

    const parseCsv = (text) => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
      const p = line.split(",").map(s => s.trim());
      if (/^roll/i.test(p[0])) return null;
      const [roll_no, company, role, pkg, joining_date] = p;
      return { roll_no: (roll_no || "").toUpperCase(), company: company || "", role: role || "", package_offered: parseFloat(pkg || "0"), joining_date: joining_date || "" };
    }).filter(Boolean);

    $id("plImport").onclick = async (e) => {
      const file = $id("plFile").files && $id("plFile").files[0];
      if (file) { const text = await file.text(); return send(parseCsv(text), e.target, "Import placements"); }
      send(parseCsv($id("plCsv").value), e.target, "Import placements");
    };

    $id("plAdd").onclick = async (e) => {
      const roll = $id("plRoll").value.trim().toUpperCase(); const company = $id("plCompany").value.trim();
      const role = $id("plRole").value.trim(); const pkg = parseFloat($id("plPackage").value || "0"); const joining = $id("plJoining").value;
      const err = $id("plErr"); err.style.display = "none";
      if (!roll) { err.textContent = "Roll number is required"; err.style.display = "block"; return; }
      if (!company) { err.textContent = "Company is required"; err.style.display = "block"; return; }
      if (!(pkg > 0)) { err.textContent = "Enter a package greater than 0"; err.style.display = "block"; return; }
      await send([{ roll_no: roll, company, role, package_offered: pkg, joining_date: joining }], e.target, "Add placement");
    };
  }
}

async function studentModal(id) {
  const m = openModal(`<div class="empty">Loading…</div>`);
  try {
    const s = await api(`/api/admin/students/${id}`, { headers: authHeaders(false) });
    const apps = s.applications || [];
    m.el.innerHTML = `
      <div class="modal-head">
        <div>
          <h3>${esc(s.name)}</h3>
          <p style="margin:4px 0 0;color:var(--ink-soft);font-size:13.5px">${esc(s.roll_no)} · ${esc(s.branch || "—")} · ${esc(s.email)}</p>
        </div>
        <button class="modal-close" data-close>${ICONS.close}</button>
      </div>
      <div class="modal-section">
        <div class="grid g4" style="margin:4px 0 18px">
          <div class="panel stat" style="box-shadow:none;background:var(--paper)"><b>${s.cgpa ?? "—"}</b><small>CGPA</small></div>
          <div class="panel stat" style="box-shadow:none;background:var(--paper)"><b>${s.backlog_count ?? 0}</b><small>Backlogs</small></div>
          <div class="panel stat" style="box-shadow:none;background:var(--paper)"><b>${apps.length}</b><small>Applications</small></div>
          <div class="panel stat" style="box-shadow:none;background:var(--paper)"><b>${(s.placements && s.placements.length) ? "Placed" : "—"}</b><small>Status</small></div>
        </div>
        <div class="pipe-row"><span>Phone</span><b>${esc(s.phone || "—")}</b></div>
        <div class="pipe-row"><span>Resume</span><b>${s.resume_path ? `<a href="/uploads/resumes/${encodeURIComponent(s.resume_path)}" target="_blank" rel="noopener">View</a>` : "Not uploaded"}</b></div>
        <div style="margin-top:14px">
          <b class="subhead">Skills</b>
          <div class="tags" style="margin-top:8px">
            ${(s.skills || []).length ? s.skills.map(k => `<span class="tag skill">${esc(k)}</span>`).join("") : '<span style="color:var(--ink-soft);font-size:13.5px">None listed</span>'}
          </div>
        </div>
        <div style="margin-top:18px">
          <b class="subhead">Applications</b>
          ${apps.length ? apps.map(a => `
            <div style="padding:12px;background:var(--paper);border-radius:10px;margin-top:8px;display:flex;justify-content:space-between;gap:10px;align-items:center">
              <div style="font-size:13.5px"><b>${esc(a.role)}</b><br><small style="color:var(--ink-soft)">${esc(a.company)} · ${esc(a.application_date)}</small></div>
              <span class="pill ${a.status.toLowerCase()}">${esc(a.status)}</span>
            </div>`).join("") : `<p style="color:var(--ink-soft);font-size:13.5px;margin:8px 0 0">No applications yet.</p>`}
        </div>
      </div>
      <div class="modal-foot"><button class="btn ghost" data-close>Close</button></div>`;
    m.el.querySelectorAll("[data-close]").forEach(b => b.onclick = m.close);
  } catch (e) {
    m.el.innerHTML = `<div class="empty"><b>Couldn't load</b>${esc(e.message)}</div><div class="modal-foot"><button class="btn ghost" data-close>Close</button></div>`;
    m.el.querySelectorAll("[data-close]").forEach(b => b.onclick = m.close);
  }
}

async function loadNotificationBadge() {
  if (state.role !== "student") return;
  try {
    const d = await api("/api/notifications", { headers: authHeaders(false) });
    const btn = document.querySelector('#nav button[data-view="notes"]');
    if (!btn) return;
    const old = btn.querySelector(".badge-count"); if (old) old.remove();
    if (d.unread) {
      const b = document.createElement("span");
      b.className = "badge-count"; b.textContent = d.unread > 99 ? "99+" : d.unread;
      btn.appendChild(b);
    }
  } catch (_) {}
}

(async function boot() {
  if (token()) {
    try {
      const j = await api("/api/auth/me", { headers: authHeaders(false) });
      enterApp(j.role, j.user); return;
    } catch (_) {}
  }
  $id("auth").style.display = "grid";
  showAuthStep("stLogin");
})();