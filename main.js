const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const speedSlider = document.getElementById("speedSlider");
const zoomSlider = document.getElementById("zoomSlider");
const themeSelect = document.getElementById("themeSelect");
const focusSelect = document.getElementById("focusSelect");
const speedValue = document.getElementById("speedValue");
const dayCounter = document.getElementById("dayCounter");
const statusText = document.getElementById("statusText");
const diameterValue = document.getElementById("diameterValue");
const distanceValue = document.getElementById("distanceValue");
const massValue = document.getElementById("massValue");
const speedOrbitValue = document.getElementById("speedOrbitValue");
const periodValue = document.getElementById("periodValue");
const gravityValue = document.getElementById("gravityValue");
const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

const SUN = {
  name: "ดวงอาทิตย์",
  radiusKm: 696340,
  colors: ["#ffd37a", "#ff9d3c", "#ff6d2d"],
};

const PLANETS = [
  {
    name: "ดาวพุธ",
    radiusKm: 2439.7,
    distanceKm: 57.9e6,
    massKg: 3.3011e23,
    orbitalPeriodDays: 88,
    orbitalSpeedKmS: 47.36,
    gravity: 3.7,
    colors: ["#b9b0a1", "#8a8376", "#67615a"],
  },
  {
    name: "ดาวศุกร์",
    radiusKm: 6051.8,
    distanceKm: 108.2e6,
    massKg: 4.8675e24,
    orbitalPeriodDays: 224.7,
    orbitalSpeedKmS: 35.02,
    gravity: 8.87,
    colors: ["#ffd0a5", "#ffb273", "#e68f58"],
  },
  {
    name: "โลก",
    radiusKm: 6371,
    distanceKm: 149.6e6,
    massKg: 5.972e24,
    orbitalPeriodDays: 365.256,
    orbitalSpeedKmS: 29.78,
    gravity: 9.81,
    colors: ["#7ed6ff", "#2f8fff", "#0f4c9a"],
  },
  {
    name: "ดาวอังคาร",
    radiusKm: 3389.5,
    distanceKm: 227.9e6,
    massKg: 6.4171e23,
    orbitalPeriodDays: 686.98,
    orbitalSpeedKmS: 24.07,
    gravity: 3.71,
    colors: ["#ffb29a", "#ff7b54", "#b74a2f"],
  },
  {
    name: "ดาวพฤหัสบดี",
    radiusKm: 69911,
    distanceKm: 778.5e6,
    massKg: 1.8982e27,
    orbitalPeriodDays: 4332.59,
    orbitalSpeedKmS: 13.07,
    gravity: 24.79,
    colors: ["#f6d8aa", "#cfa470", "#9c6b3e"],
  },
  {
    name: "ดาวเสาร์",
    radiusKm: 58232,
    distanceKm: 1.433e9,
    massKg: 5.6834e26,
    orbitalPeriodDays: 10759,
    orbitalSpeedKmS: 9.69,
    gravity: 10.44,
    colors: ["#f6e1a8", "#cbb074", "#8e7440"],
    ring: {
      inner: 1.35,
      outer: 2.1,
      color: "rgba(245, 223, 171, 0.45)",
    },
  },
  {
    name: "ดาวยูเรนัส",
    radiusKm: 25362,
    distanceKm: 2.872e9,
    massKg: 8.681e25,
    orbitalPeriodDays: 30688.5,
    orbitalSpeedKmS: 6.81,
    gravity: 8.69,
    colors: ["#b5f1ff", "#6fd0ff", "#2b9bbd"],
  },
  {
    name: "ดาวเนปจูน",
    radiusKm: 24622,
    distanceKm: 4.495e9,
    massKg: 1.02413e26,
    orbitalPeriodDays: 60182,
    orbitalSpeedKmS: 5.43,
    gravity: 11.15,
    colors: ["#89b5ff", "#4b79ff", "#2746a3"],
  },
].map((planet, index, array) => ({
  ...planet,
  phase: (index / array.length) * Math.PI * 2,
}));

const state = {
  running: true,
  lastTime: 0,
  elapsedDays: 0,
  daysPerSecond: Number(speedSlider.value),
  zoom: Number(zoomSlider.value),
  focus: PLANETS[2],
  stars: Array.from({ length: 120 }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.4 + 0.3,
    alpha: Math.random() * 0.5 + 0.2,
  })),
};

const formatNumber = (value, digits = 0) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const updateDataPanel = () => {
  const planet = state.focus;
  diameterValue.textContent = `${formatNumber(planet.radiusKm * 2)} กม.`;
  distanceValue.textContent = `${formatNumber(planet.distanceKm / 1e6, 1)} ล้านกม.`;
  massValue.textContent = `${planet.massKg.toExponential(2)} กก.`;
  speedOrbitValue.textContent = `${planet.orbitalSpeedKmS.toFixed(2)} กม./วินาที`;
  periodValue.textContent = `${formatNumber(planet.orbitalPeriodDays)} วัน`;
  gravityValue.textContent = `${planet.gravity.toFixed(2)} ม./วินาที²`;
};

const updateSpeed = () => {
  state.daysPerSecond = Number(speedSlider.value);
  speedValue.textContent = `${formatNumber(state.daysPerSecond)} วัน/วินาที`;
};

const updateZoom = () => {
  state.zoom = Number(zoomSlider.value);
};

const resizeCanvas = () => {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const drawGradientSphere = (x, y, radius, colors) => {
  const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.2, x, y, radius);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.6, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

const draw = () => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.clearRect(0, 0, width, height);

  const backdrop = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.6);
  backdrop.addColorStop(0, "rgba(40, 55, 120, 0.45)");
  backdrop.addColorStop(1, "rgba(6, 8, 26, 0.95)");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  state.stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const sizeScale = (Math.min(width, height) / 500) * 0.6;
  const sunRadius = Math.pow(SUN.radiusKm, 0.35) * sizeScale;
  drawGradientSphere(centerX, centerY, sunRadius, SUN.colors);

  const minDistance = PLANETS[0].distanceKm;
  const maxDistance = PLANETS[PLANETS.length - 1].distanceKm;
  const minLog = Math.log10(minDistance);
  const maxLog = Math.log10(maxDistance);
  const minOrbit = Math.min(width, height) * 0.15;
  const maxOrbit = Math.min(width, height) * 0.48;

  const scaleDistance = (distanceKm) => {
    const t = (Math.log10(distanceKm) - minLog) / (maxLog - minLog);
    return (minOrbit + t * (maxOrbit - minOrbit)) * state.zoom;
  };

  PLANETS.forEach((planet) => {
    const orbitRadius = scaleDistance(planet.distanceKm);
    ctx.strokeStyle = planet === state.focus ? "rgba(255, 203, 107, 0.8)" : "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = planet === state.focus ? 1.8 : 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    const angle = planet.phase + (state.elapsedDays / planet.orbitalPeriodDays) * Math.PI * 2;
    const planetX = centerX + Math.cos(angle) * orbitRadius;
    const planetY = centerY + Math.sin(angle) * orbitRadius;
    const planetRadius = Math.max(4, Math.pow(planet.radiusKm, 0.35) * sizeScale * 0.55);

    if (planet.ring) {
      const ringRadius = planetRadius * (planet.ring.inner + planet.ring.outer) * 0.5;
      const ringWidth = planetRadius * (planet.ring.outer - planet.ring.inner);
      ctx.save();
      ctx.translate(planetX, planetY);
      ctx.rotate(-0.5);
      ctx.scale(1.4, 0.45);
      ctx.strokeStyle = planet.ring.color;
      ctx.lineWidth = ringWidth;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawGradientSphere(planetX, planetY, planetRadius, planet.colors);

    if (planet === state.focus) {
      ctx.strokeStyle = "rgba(255, 203, 107, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};

const loop = (timestamp) => {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }
  const deltaSeconds = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;
  if (state.running) {
    state.elapsedDays += deltaSeconds * state.daysPerSecond;
    dayCounter.textContent = formatNumber(Math.floor(state.elapsedDays));
  }
  draw();
  requestAnimationFrame(loop);
};

const toggleSimulation = () => {
  state.running = !state.running;
  toggleBtn.textContent = state.running ? "หยุดชั่วคราว" : "เริ่มต่อ";
  statusText.textContent = state.running ? "กำลังจำลอง" : "หยุดชั่วคราว";
};

const resetSimulation = () => {
  state.elapsedDays = 0;
  dayCounter.textContent = "0";
  statusText.textContent = state.running ? "กำลังจำลอง" : "หยุดชั่วคราว";
};

const buildFocusOptions = () => {
  PLANETS.forEach((planet) => {
    const option = document.createElement("option");
    option.value = planet.name;
    option.textContent = planet.name;
    focusSelect.appendChild(option);
  });
  focusSelect.value = state.focus.name;
};

speedSlider.addEventListener("input", updateSpeed);
zoomSlider.addEventListener("input", updateZoom);
focusSelect.addEventListener("change", () => {
  state.focus = PLANETS.find((planet) => planet.name === focusSelect.value) || PLANETS[2];
  updateDataPanel();
});

resetBtn.addEventListener("click", resetSimulation);
toggleBtn.addEventListener("click", toggleSimulation);

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
});

buildFocusOptions();
updateDataPanel();
updateSpeed();
updateZoom();
resizeCanvas();
document.body.dataset.theme = themeSelect.value;
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(loop);
