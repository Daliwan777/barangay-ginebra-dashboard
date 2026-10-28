const players = [
  { id: "scottie-thompson", name: "Scottie Thompson", number: 11, position: "Forward", gp: 42, ppg: 17.8, rpg: 9.6, apg: 5.1, spg: 1.8, bpg: 0.6, fg: 48.4, three: 32.1, ft: 75.6, mpg: 33.2, bio: "A relentless two-way force, Scottie sets the tone with his rebounding, playmaking, and trademark hustle.", highlight: "Multiple-time PBA champion and one of the league's premier all-around players.", recent: [16, 22, 14, 25, 18, 19] },
  { id: "japeth-aguilar", name: "Japeth Aguilar", number: 25, position: "Forward", gp: 39, ppg: 15.2, rpg: 7.1, apg: 1.8, spg: 0.7, bpg: 1.4, fg: 56.2, three: 28.6, ft: 72.8, mpg: 28.7, bio: "A high-flying veteran presence who protects the rim and finishes above it.", highlight: "A perennial All-Star and key anchor of Ginebra's championship frontcourt.", recent: [14, 18, 11, 20, 15, 17] },
  { id: "christian-standhardinger", name: "Christian Standhardinger", number: 34, position: "Forward", gp: 41, ppg: 14.6, rpg: 8.3, apg: 3.2, spg: 1.0, bpg: 0.4, fg: 52.1, three: 25.0, ft: 80.4, mpg: 29.1, bio: "A crafty inside scorer who brings toughness, touch, and veteran leadership to the paint.", highlight: "A multiple-time PBA champion and one of the league's most efficient big men.", recent: [13, 17, 18, 12, 21, 14] },
  { id: "stanley-pringle", name: "Stanley Pringle", number: 47, position: "Guard", gp: 35, ppg: 12.9, rpg: 3.1, apg: 4.7, spg: 1.1, bpg: 0.2, fg: 43.8, three: 36.1, ft: 84.2, mpg: 25.6, bio: "A dynamic guard with a scoring burst and the ability to create his own shot.", highlight: "Former PBA Best Player of the Conference and two-time PBA champion.", recent: [18, 12, 21, 9, 15, 17] },
  { id: "von-poon", name: "Von Pessumal", number: 18, position: "Guard", gp: 37, ppg: 9.8, rpg: 2.8, apg: 2.1, spg: 0.8, bpg: 0.2, fg: 42.6, three: 39.4, ft: 86.0, mpg: 21.3, bio: "A steady perimeter threat whose floor spacing opens up the offense.", highlight: "Known for clutch perimeter shooting and championship contributions.", recent: [11, 14, 8, 17, 12, 9] },
  { id: "kevin-ferrer", name: "Kevin Ferrer", number: 20, position: "Forward", gp: 32, ppg: 8.4, rpg: 4.2, apg: 1.4, spg: 0.9, bpg: 0.5, fg: 41.3, three: 34.2, ft: 73.1, mpg: 19.8, bio: "A versatile wing defender who brings energy, length, and timely shooting.", highlight: "Former collegiate standout and valued two-way contributor.", recent: [8, 12, 7, 11, 5, 10] },
  { id: "christian-paul", name: "Aljon Mariano", number: 31, position: "Forward", gp: 34, ppg: 7.7, rpg: 3.9, apg: 1.5, spg: 0.7, bpg: 0.3, fg: 45.7, three: 31.0, ft: 70.8, mpg: 18.5, bio: "A hard-nosed forward who does the little things and makes winning plays.", highlight: "Longtime Gin Kings mainstay and multiple-time PBA champion.", recent: [9, 6, 12, 8, 7, 11] },
  { id: "nards-pinto", name: "Nards Pinto", number: 6, position: "Guard", gp: 29, ppg: 6.9, rpg: 2.0, apg: 3.8, spg: 1.0, bpg: 0.1, fg: 40.1, three: 33.7, ft: 78.9, mpg: 17.2, bio: "A composed floor general who keeps the offense organized and competes on every possession.", highlight: "A relentless competitor who earned his place among the league's top guards.", recent: [7, 10, 4, 9, 6, 12] },
  { id: "maverick-ahanmisi", name: "Maverick Ahanmisi", number: 17, position: "Guard", gp: 31, ppg: 6.5, rpg: 2.4, apg: 2.6, spg: 0.6, bpg: 0.2, fg: 39.7, three: 35.0, ft: 81.2, mpg: 16.8, bio: "A skilled playmaker with a confident outside shot and patient court vision.", highlight: "A proven shot-maker and steady presence in the Ginebra backcourt.", recent: [8, 5, 13, 4, 9, 6] },
  { id: "dave-murrell", name: "Dave Murrell", number: 15, position: "Forward", gp: 23, ppg: 4.3, rpg: 3.1, apg: 0.8, spg: 0.4, bpg: 0.4, fg: 43.9, three: 32.4, ft: 67.5, mpg: 11.6, bio: "A young forward bringing length, athleticism, and room to grow.", highlight: "Emerging contributor developing into a versatile two-way player.", recent: [4, 7, 3, 5, 8, 4] },
  { id: "jeff-chan", name: "Jeff Chan", number: 7, position: "Guard", gp: 18, ppg: 4.0, rpg: 1.2, apg: 1.1, spg: 0.3, bpg: 0.0, fg: 38.2, three: 36.8, ft: 88.9, mpg: 10.1, bio: "A veteran sharpshooter whose experience and floor spacing remain valuable.", highlight: "One of the PBA's most respected perimeter shooters and a champion.", recent: [3, 6, 9, 2, 5, 4] },
  { id: "rj-abarrientos", name: "RJ Abarrientos", number: 0, position: "Guard", gp: 14, ppg: 3.5, rpg: 1.0, apg: 1.7, spg: 0.5, bpg: 0.1, fg: 37.5, three: 30.8, ft: 76.9, mpg: 9.4, bio: "A quick, creative young guard with the confidence to attack and make plays.", highlight: "Internationally experienced guard bringing energy and upside to the roster.", recent: [6, 3, 8, 2, 5, 4] }
];

const pageSize = 8;
let currentPage = 1;
let sortKey = "ppg";
let sortDirection = "descending";
let leaderKey = "ppg";
let profileChart;
let charts = [];

const numberFormat = (key, value) => {
  if (key === "number") return value;
  if (["fg", "three", "ft"].includes(key)) return `${value.toFixed(1)}%`;
  if (["ppg", "rpg", "apg", "spg", "bpg", "mpg"].includes(key)) return value.toFixed(1);
  return value;
};

function visiblePlayers() {
  const query = document.getElementById("playerSearch").value.trim().toLowerCase();
  const position = document.getElementById("positionFilter").value;
  return players.filter(player => player.name.toLowerCase().includes(query) && (position === "all" || player.position === position))
    .sort((a, b) => {
      const left = a[sortKey], right = b[sortKey];
      const compare = typeof left === "string" ? left.localeCompare(right) : left - right;
      return sortDirection === "ascending" ? compare : -compare;
    });
}

function renderPlayers() {
  const filtered = visiblePlayers();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const rows = document.getElementById("playerRows");
  rows.innerHTML = pageItems.map(player => `<tr>
    <td><div class="player-cell"><span class="player-avatar">${player.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><button class="player-name-button" type="button" data-player-id="${player.id}">${player.name}</button></div></td>
    <td>${numberFormat("number", player.number)}</td><td><span class="position-tag">${player.position}</span></td>
    <td>${player.gp}</td><td>${numberFormat("ppg", player.ppg)}</td><td>${numberFormat("rpg", player.rpg)}</td>
    <td>${numberFormat("apg", player.apg)}</td><td>${numberFormat("spg", player.spg)}</td><td>${numberFormat("bpg", player.bpg)}</td>
    <td>${numberFormat("fg", player.fg)}</td><td>${numberFormat("three", player.three)}</td><td>${numberFormat("ft", player.ft)}</td><td>${numberFormat("mpg", player.mpg)}</td>
  </tr>`).join("");
  document.getElementById("emptyState").hidden = filtered.length !== 0;
  document.getElementById("pageSummary").textContent = filtered.length ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} players` : "No players to show";
  document.getElementById("rosterCount").textContent = filtered.length;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages || filtered.length === 0;
  document.getElementById("pageNumbers").innerHTML = Array.from({ length: totalPages }, (_, index) => `<button class="page-number${index + 1 === currentPage ? " active" : ""}" type="button" aria-label="Page ${index + 1}" ${index + 1 === currentPage ? 'aria-current="page"' : ""}>${index + 1}</button>`).join("");
  document.querySelectorAll(".page-number").forEach(button => button.addEventListener("click", () => { currentPage = Number(button.textContent); renderPlayers(); }));
  document.querySelectorAll("[data-sort]").forEach(button => {
    if (button.dataset.sort === sortKey) button.setAttribute("aria-sort", sortDirection);
    else button.removeAttribute("aria-sort");
  });
}

function renderLeaders() {
  const sorted = [...players].sort((a, b) => b[leaderKey] - a[leaderKey]).slice(0, 4);
  const label = { ppg: "PPG", rpg: "RPG", apg: "APG" }[leaderKey];
  document.getElementById("leaderList").innerHTML = sorted.map((player, index) => `<div class="leader-row"><span class="leader-rank">0${index + 1}</span><div><div class="leader-name">${player.name}</div><div class="leader-position">${player.position} · #${player.number}</div></div><div class="leader-score">${player[leaderKey].toFixed(1)}<small>${label}</small></div></div>`).join("");
}

function openPlayerProfile(id) {
  const player = players.find(item => item.id === id);
  if (!player) return;
  document.getElementById("modalAvatar").alt = `Illustrative player portrait for ${player.name}`;
  document.getElementById("modalPosition").textContent = `${player.position.toUpperCase()} · #${player.number || "—"} · ${player.gp} GAMES`;
  document.getElementById("modalPlayerName").textContent = player.name;
  document.getElementById("modalBio").textContent = player.bio;
  document.getElementById("modalHighlight").textContent = player.highlight;
  document.getElementById("modalStats").innerHTML = [
    ["PPG", player.ppg.toFixed(1)], ["RPG", player.rpg.toFixed(1)], ["APG", player.apg.toFixed(1)],
    ["SPG", player.spg.toFixed(1)], ["BPG", player.bpg.toFixed(1)], ["FG%", `${player.fg.toFixed(1)}%`],
    ["3PT%", `${player.three.toFixed(1)}%`], ["FT%", `${player.ft.toFixed(1)}%`], ["MPG", player.mpg.toFixed(1)]
  ].map(([label, value]) => `<div class="modal-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
  if (profileChart) profileChart.destroy();
  profileChart = new Chart(document.getElementById("profileChart"), {
    type: "line",
    data: { labels: ["G-6", "G-5", "G-4", "G-3", "G-2", "Last"], datasets: [{ data: player.recent, borderColor: "#d7193f", backgroundColor: "rgba(215,25,63,.09)", fill: true, tension: .38, pointRadius: 3, pointBackgroundColor: "#d7193f" }] },
    options: chartOptions({ display: false, min: 0, beginAtZero: true })
  });
  bootstrap.Modal.getOrCreateInstance(document.getElementById("playerModal")).show();
}

function chartOptions({ display = true, min = undefined, beginAtZero = false } = {}) {
  const gridColor = getComputedStyle(document.body).getPropertyValue("--line").trim() || "#e9e9e8";
  const textColor = document.body.classList.contains("dark-mode") ? "#a2a4a8" : "#929498";
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display }, tooltip: { backgroundColor: "#17181a", padding: 9, titleFont: { family: "DM Sans", size: 10 }, bodyFont: { family: "DM Sans", size: 10 } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: textColor, font: { family: "DM Sans", size: 8 } } },
      y: { min, beginAtZero, grid: { color: gridColor, drawTicks: false }, border: { display: false }, ticks: { color: textColor, padding: 8, font: { family: "DM Sans", size: 8 } } }
    }
  };
}

function buildCharts() {
  charts.forEach(chart => chart.destroy());
  charts = [];
  const red = "#d7193f";
  const lineOptions = chartOptions({ display: false, beginAtZero: true });
  charts.push(new Chart(document.getElementById("pointsSparkline"), {
    type: "line", data: { labels: ["1", "2", "3", "4", "5", "6"], datasets: [{ data: [91, 97, 94, 102, 96, 98], borderColor: red, borderWidth: 2, pointRadius: 0, tension: .4 }] },
    options: { ...lineOptions, scales: { x: { display: false }, y: { display: false } }, elements: { line: { fill: false } } }
  }));
  charts.push(new Chart(document.getElementById("teamBarChart"), {
    type: "bar",
    data: { labels: ["Points", "Rebounds", "Assists", "Steals", "Blocks"], datasets: [
      { label: "Ginebra", data: [98.4, 44.7, 21.6, 7.4, 4.8], backgroundColor: red, borderRadius: 2, barPercentage: .55 },
      { label: "League average", data: [94.2, 42.1, 20.5, 7.1, 4.3], backgroundColor: "#dedfe1", borderRadius: 2, barPercentage: .55 }
    ] },
    options: { ...chartOptions({ display: true, beginAtZero: true }), plugins: { legend: { display: false }, tooltip: { backgroundColor: "#17181a" } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: document.body.classList.contains("dark-mode") ? "#aaa" : "#929498", font: { size: 8 } } }, y: { grid: { color: getComputedStyle(document.body).getPropertyValue("--line") }, border: { display: false }, ticks: { color: document.body.classList.contains("dark-mode") ? "#aaa" : "#929498", font: { size: 8 }, maxTicksLimit: 5 } } } }
  }));
  charts.push(new Chart(document.getElementById("shootingChart"), {
    type: "doughnut", data: { labels: ["Field goals", "3-pointers", "Free throws"], datasets: [{ data: [46.8, 35.2, 18], backgroundColor: [red, "#ed704b", "#dedfe1"], borderWidth: 0, hoverOffset: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "76%", plugins: { legend: { display: false }, tooltip: { backgroundColor: "#17181a" } } }
  }));
  charts.push(new Chart(document.getElementById("trendChart"), {
    type: "line", data: { labels: ["G-10", "G-9", "G-8", "G-7", "G-6", "G-5", "G-4", "G-3", "G-2", "Last"], datasets: [{ data: [91, 102, 96, 105, 88, 98, 101, 94, 103, 106], borderColor: red, backgroundColor: "rgba(215,25,63,.08)", fill: true, tension: .36, pointRadius: 2.5, pointBackgroundColor: red, borderWidth: 2 }] },
    options: { ...lineOptions, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: document.body.classList.contains("dark-mode") ? "#aaa" : "#929498", font: { size: 8 } } }, y: { min: 70, max: 120, grid: { color: getComputedStyle(document.body).getPropertyValue("--line") }, border: { display: false }, ticks: { stepSize: 10, color: document.body.classList.contains("dark-mode") ? "#aaa" : "#929498", padding: 8, font: { size: 8 } } } } }
  }));
}

document.getElementById("playerSearch").addEventListener("input", () => { currentPage = 1; renderPlayers(); });
document.getElementById("positionFilter").addEventListener("change", () => { currentPage = 1; renderPlayers(); });
document.getElementById("prevPage").addEventListener("click", () => { currentPage -= 1; renderPlayers(); });
document.getElementById("nextPage").addEventListener("click", () => { currentPage += 1; renderPlayers(); });
document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click", () => {
  const nextKey = button.dataset.sort;
  sortDirection = sortKey === nextKey && sortDirection === "descending" ? "ascending" : "descending";
  sortKey = nextKey; currentPage = 1; renderPlayers();
}));
document.querySelectorAll(".leader-tab").forEach(button => button.addEventListener("click", () => {
  leaderKey = button.dataset.leader;
  document.querySelectorAll(".leader-tab").forEach(tab => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
  renderLeaders();
}));
document.addEventListener("click", event => {
  const profileButton = event.target.closest("[data-player-id]");
  if (profileButton) openPlayerProfile(profileButton.dataset.playerId);
});
document.getElementById("themeToggle").addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark-mode");
  document.getElementById("themeToggle").innerHTML = `<span class="theme-icon" aria-hidden="true">${dark ? "☀" : "☾"}</span>`;
  document.getElementById("themeToggle").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  localStorage.setItem("ginebra-theme", dark ? "dark" : "light");
  buildCharts();
});
document.querySelectorAll(".navbar-nav .nav-link").forEach(link => link.addEventListener("click", () => {
  document.querySelector(".navbar-collapse").classList.remove("show");
  document.querySelectorAll(".navbar-nav .nav-link").forEach(navLink => navLink.classList.toggle("active", navLink === link));
}));

if (localStorage.getItem("ginebra-theme") === "dark") {
  document.body.classList.add("dark-mode");
  document.getElementById("themeToggle").innerHTML = '<span class="theme-icon" aria-hidden="true">☀</span>';
  document.getElementById("themeToggle").setAttribute("aria-label", "Switch to light mode");
}
renderPlayers();
renderLeaders();
if (window.Chart) buildCharts();
window.addEventListener("load", () => window.setTimeout(() => document.getElementById("loadingScreen").classList.add("loaded"), 350));
