const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const speedSlider = document.getElementById("speedSlider");
const zoomSlider = document.getElementById("zoomSlider");
const themeSelect = document.getElementById("themeSelect");
const focusSelect = document.getElementById("focusSelect");
const speedValue = document.getElementById("speedValue");
const dayCounter = document.getElementById("dayCounter");
const statusText = document.getElementById("statusText");
const objectCount = document.getElementById("objectCount");
const objectBreakdown = document.getElementById("objectBreakdown");
const typeValue = document.getElementById("typeValue");
const parentValue = document.getElementById("parentValue");
const diameterValue = document.getElementById("diameterValue");
const distanceValue = document.getElementById("distanceValue");
const massValue = document.getElementById("massValue");
const gravityValue = document.getElementById("gravityValue");
const hillValue = document.getElementById("hillValue");
const lagrangeValue = document.getElementById("lagrangeValue");
const speedOrbitValue = document.getElementById("speedOrbitValue");
const periodValue = document.getElementById("periodValue");
const temperatureValue = document.getElementById("temperatureValue");
const atmosphereValue = document.getElementById("atmosphereValue");
const pressureValue = document.getElementById("pressureValue");
const compositionValue = document.getElementById("compositionValue");
const textureValue = document.getElementById("textureValue");
const magneticValue = document.getElementById("magneticValue");
const ringValue = document.getElementById("ringValue");
const ringStabilityValue = document.getElementById("ringStabilityValue");
const surfaceValue = document.getElementById("surfaceValue");
const tectonicValue = document.getElementById("tectonicValue");
const erosionValue = document.getElementById("erosionValue");
const iceFlowValue = document.getElementById("iceFlowValue");
const weatherValue = document.getElementById("weatherValue");
const forestValue = document.getElementById("forestValue");
const heatValue = document.getElementById("heatValue");
const coolingValue = document.getElementById("coolingValue");
const radioactiveValue = document.getElementById("radioactiveValue");
const shadowValue = document.getElementById("shadowValue");
const eclipseValue = document.getElementById("eclipseValue");
const qualityValue = document.getElementById("qualityValue");
const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

const OBJECTS = window.CELESTIAL_OBJECTS ?? [];
const SUN = OBJECTS.find((item) => item.type === "star") ?? OBJECTS[0];

const capitalizeWords = (text) => text.replace(/(^.|\s.)/g, (value) => value.toUpperCase());

const typeLabels = {
  star: "ดาวฤกษ์",
  planet: "ดาวเคราะห์",
  dwarf: "ดาวเคราะห์แคระ",
  satellite: "ดาวบริวาร",
  asteroid: "ดาวเคราะห์น้อย",
  comet: "ดาวหาง",
  tno: "วัตถุแถบไคเปอร์",
};

const textureGradients = {
  rocky: ["#e0d7c8", "#a7886d", "#5f4a38"],
  ice: ["#f0fbff", "#b3d7ef", "#6a8fb3"],
  ocean: ["#9ff0ff", "#2f8fd6", "#0d3e70"],
  gas: ["#f5dfb8", "#c99e6b", "#8b5b3a"],
  cloud: ["#fff0d5", "#f1c089", "#c98349"],
  lava: ["#ffc07f", "#e06d36", "#7f250b"],
  haze: ["#f8ead0", "#d2b07f", "#7f5d3c"],
  star: ["#ffd37a", "#ff9d3c", "#ff6d2d"],
  point: ["#ffffff", "#c8d4ff", "#6a7dff"],
  belt: ["#ded1b4", "#a28f78", "#5b4b3f"],
  comet: ["#f2fbff", "#c5d7e6", "#6d8196"],
};

const MIN_RENDER_RADIUS_SMALL_BODY = 2.2;
const MIN_RENDER_RADIUS_MAJOR_BODY = 4;
const PRESSURE_EXPONENTIAL_THRESHOLD = 0.01;

const state = {
  running: true,
  lastTime: 0,
  elapsedDays: 0,
  daysPerSecond: Number(speedSlider.value),
  zoom: Number(zoomSlider.value),
  focus: OBJECTS.find((object) => object.id === "earth") ?? OBJECTS[0],
  stars: Array.from({ length: 160 }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.5 + 0.2,
    alpha: Math.random() * 0.5 + 0.2,
  })),
};

const formatNumber = (value, digits = 0) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatValue = (value, suffix = "") =>
  value ? `${formatNumber(value)}${suffix}` : "-";

const formatTemp = (value) => (value ? `${formatNumber(value)} K` : "-");

const formatPressure = (value) => {
  if (!value) {
    return "-";
  }
  const formatted = value < PRESSURE_EXPONENTIAL_THRESHOLD
    ? value.toExponential(2)
    : formatNumber(value);
  return `${formatted} atm`;
};

const updateStats = () => {
  const counts = OBJECTS.reduce((acc, obj) => {
    acc[obj.type] = (acc[obj.type] || 0) + 1;
    return acc;
  }, {});
  objectCount.textContent = OBJECTS.length.toString();
  objectBreakdown.textContent = Object.entries(counts)
    .map(([type, count]) => `${typeLabels[type] || type}: ${count}`)
    .join(" • ");
};

const updateDataPanel = () => {
  const object = state.focus;
  typeValue.textContent = typeLabels[object.type] || capitalizeWords(object.type);
  parentValue.textContent = object.parent ?? "-";
  diameterValue.textContent = object.radiusKm ? `${formatNumber(object.radiusKm * 2)} กม.` : "-";
  const displayDistance = object.orbitDistanceKm ?? object.distanceKm;
  distanceValue.textContent = displayDistance
    ? `${formatNumber(displayDistance / 1e6, 2)} ล้านกม.`
    : "-";
  massValue.textContent = object.massKg ? `${object.massKg.toExponential(2)} กก.` : "-";
  gravityValue.textContent = object.gravity ? `${object.gravity.toFixed(2)} ม./วินาที²` : "-";
  hillValue.textContent = object.hillRadiusKm
    ? `${formatNumber(object.hillRadiusKm / 1000, 1)} พันกม.`
    : "-";
  lagrangeValue.textContent = object.lagrangeKm
    ? `${formatNumber(object.lagrangeKm / 1000, 1)} พันกม.`
    : "-";
  const displaySpeed = object.renderOrbitSpeedKmS ?? object.orbitalSpeedKmS;
  const displayPeriod = object.renderOrbitPeriodDays ?? object.orbitalPeriodDays;
  speedOrbitValue.textContent = displaySpeed
    ? `${displaySpeed.toFixed(2)} กม./วินาที`
    : "-";
  periodValue.textContent = displayPeriod
    ? `${formatNumber(displayPeriod, 1)} วัน`
    : "-";
  temperatureValue.textContent = formatTemp(object.temperatureK);
  atmosphereValue.textContent = object.atmosphere ?? "-";
  pressureValue.textContent = formatPressure(object.pressureAtm);
  compositionValue.textContent = object.composition ?? "-";
  textureValue.textContent = object.texture ? `พื้นผิว ${object.texture}` : "-";
  magneticValue.textContent = object.magneticField ?? "-";
  ringValue.textContent = object.ring ?? "ไม่มี";
  ringStabilityValue.textContent = object.ringStability ?? "-";
  surfaceValue.textContent = object.surfaceDynamics ?? "-";
  tectonicValue.textContent = object.tectonics ?? "-";
  erosionValue.textContent = object.erosion ?? "-";
  iceFlowValue.textContent = object.iceFlow ?? "-";
  weatherValue.textContent = object.weather ?? "-";
  forestValue.textContent = object.life ?? "-";
  heatValue.textContent = object.heatFlux ?? "-";
  coolingValue.textContent = object.cooling ?? "-";
  radioactiveValue.textContent = object.radioactivity ?? "-";
  shadowValue.textContent = object.shadow ?? "มีเงา";
  eclipseValue.textContent = object.eclipse ?? "ขึ้นกับการจัดเรียง";
  qualityValue.textContent = object.dataQuality ?? "ข้อมูลจริง";
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

const drawShadow = (x, y, radius, angle) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(radius * 0.2, 0, radius * 0.95, radius * 0.75, 0, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.fill();
  ctx.restore();
};

const getDistanceScale = () => {
  const distances = OBJECTS
    .map((obj) => obj.orbitDistanceKm ?? obj.distanceKm)
    .filter((distance) => distance && distance > 0);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minLog = Math.log10(minDistance);
  const maxLog = Math.log10(maxDistance);
  return { minDistance, maxDistance, minLog, maxLog };
};

const distanceScale = getDistanceScale();

const scaleDistance = (distanceKm, width, height) => {
  const baseDistance = distanceKm || 0;
  if (!baseDistance) return 0;
  const t = (Math.log10(baseDistance) - distanceScale.minLog) / (distanceScale.maxLog - distanceScale.minLog);
  const minOrbit = Math.min(width, height) * 0.12;
  const maxOrbit = Math.min(width, height) * 0.48;
  return (minOrbit + t * (maxOrbit - minOrbit)) * state.zoom;
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

  if (SUN) {
  const sunRadius = Math.pow(SUN.radiusKm, 0.35) * (Math.min(width, height) / 520) * 0.75;
  const sunGradient = textureGradients.star;
  const sunHalo = ctx.createRadialGradient(centerX, centerY, sunRadius * 0.4, centerX, centerY, sunRadius * 1.8);
  sunHalo.addColorStop(0, "rgba(255, 210, 140, 0.45)");
  sunHalo.addColorStop(1, "rgba(255, 120, 40, 0)");
  ctx.fillStyle = sunHalo;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sunRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();
  drawGradientSphere(centerX, centerY, sunRadius, sunGradient);
  }

  OBJECTS.filter((obj) => obj.type !== "star" && (obj.orbitDistanceKm || obj.distanceKm)).forEach((object, index) => {
    const orbitRadius = scaleDistance(object.orbitDistanceKm ?? object.distanceKm, width, height);
    const isFocus = object === state.focus;
    ctx.strokeStyle = isFocus ? "rgba(255, 203, 107, 0.8)" : "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = isFocus ? 1.6 : 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    const period = object.renderOrbitPeriodDays || object.orbitalPeriodDays || 10000;
    // กระจายตำแหน่งเริ่มต้นเพื่อการมองเห็น สามารถใส่ค่าตำแหน่งจริงในอนาคตได้
    const basePhase = (index / OBJECTS.length) * Math.PI * 2;
    const angle = basePhase + (state.elapsedDays / period) * Math.PI * 2;
    const objectX = centerX + Math.cos(angle) * orbitRadius;
    const objectY = centerY + Math.sin(angle) * orbitRadius;
    const sizeBase =
      object.type === "asteroid" || object.type === "comet" || object.type === "tno"
        ? MIN_RENDER_RADIUS_SMALL_BODY
        : MIN_RENDER_RADIUS_MAJOR_BODY;
    // ใช้ exponent/scale ที่ปรับให้เห็นความต่างของขนาดโดยไม่หายไปเมื่อเทียบสเกลจริง
    const radius = Math.max(sizeBase, Math.pow(object.radiusKm || 2, 0.32) * 0.12);

    if (object.ring) {
      const ringRadius = radius * 2.1;
      ctx.save();
      ctx.translate(objectX, objectY);
      ctx.rotate(-0.5);
      ctx.scale(1.4, 0.45);
      ctx.strokeStyle = "rgba(245, 223, 171, 0.45)";
      ctx.lineWidth = Math.max(1, radius * 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

  const gradient = textureGradients[object.texture] || textureGradients.rocky;
  drawGradientSphere(objectX, objectY, radius, gradient);
  if (object.texture === "ocean") {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = Math.max(0.8, radius * 0.08);
    ctx.beginPath();
    ctx.arc(objectX, objectY, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
    drawShadow(objectX, objectY, radius, angle);

    if (isFocus) {
      ctx.strokeStyle = "rgba(255, 203, 107, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(objectX, objectY, radius + 5, 0, Math.PI * 2);
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
  OBJECTS.forEach((object) => {
    const option = document.createElement("option");
    option.value = object.id;
    option.textContent = `${object.name} (${typeLabels[object.type] || object.type})`;
    focusSelect.appendChild(option);
  });
  focusSelect.value = state.focus?.id ?? OBJECTS[0]?.id ?? "";
};

speedSlider.addEventListener("input", updateSpeed);
zoomSlider.addEventListener("input", updateZoom);
focusSelect.addEventListener("change", () => {
  state.focus = OBJECTS.find((object) => object.id === focusSelect.value) ?? OBJECTS[0];
  updateDataPanel();
});

resetBtn.addEventListener("click", resetSimulation);
toggleBtn.addEventListener("click", toggleSimulation);

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
});

updateStats();
buildFocusOptions();
if (state.focus) {
  updateDataPanel();
}
updateSpeed();
updateZoom();
resizeCanvas();
document.body.dataset.theme = themeSelect.value;
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(loop);
