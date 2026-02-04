const canvas = document.getElementById("solarCanvas");
const ctx = canvas.getContext("2d");
const timeScaleInput = document.getElementById("timeScale");
const timeScaleValue = document.getElementById("timeScaleValue");
const togglePauseButton = document.getElementById("togglePause");
const toggleOrbitsInput = document.getElementById("toggleOrbits");

const planetName = document.getElementById("planetName");
const planetTag = document.getElementById("planetTag");
const planetStats = document.getElementById("planetStats");
const missionProgress = document.getElementById("missionProgress");
const missionFill = document.getElementById("missionFill");

const state = {
  isPaused: false,
  showOrbits: true,
  timeScale: 1,
  discovered: new Set(),
};

const baseCenter = { x: canvas.width / 2, y: canvas.height / 2 };

const planets = [
  {
    name: "พุธ",
    tag: "ดาวเคราะห์หินที่เล็กที่สุด",
    radius: 6,
    orbit: 60,
    period: 88,
    color: "#c1a58c",
    stats: ["อุณหภูมิ: -180 ถึง 430°C", "ระยะห่างจากดวงอาทิตย์: 57.9 ล้าน กม.", "บรรยากาศ: เบาบางมาก"],
  },
  {
    name: "ศุกร์",
    tag: "ดาวเคราะห์ฝาแฝดโลกที่ร้อนที่สุด",
    radius: 10,
    orbit: 90,
    period: 225,
    color: "#e4c28a",
    stats: ["อุณหภูมิพื้นผิว: 465°C", "ระยะห่างจากดวงอาทิตย์: 108.2 ล้าน กม.", "บรรยากาศ: คาร์บอนไดออกไซด์หนาแน่น"],
  },
  {
    name: "โลก",
    tag: "ดาวเคราะห์สีน้ำเงินและบ้านของเรา",
    radius: 11,
    orbit: 125,
    period: 365,
    color: "#4db6ff",
    stats: ["อุณหภูมิเฉลี่ย: 15°C", "ระยะห่างจากดวงอาทิตย์: 149.6 ล้าน กม.", "มีมหาสมุทร: 71%"],
  },
  {
    name: "อังคาร",
    tag: "ดาวเคราะห์แดงแห่งพายุฝุ่น",
    radius: 8,
    orbit: 165,
    period: 687,
    color: "#d86b4b",
    stats: ["อุณหภูมิ: -87 ถึง -5°C", "ระยะห่างจากดวงอาทิตย์: 227.9 ล้าน กม.", "มีภูเขาโอลิมปัสมอนส์"],
  },
  {
    name: "พฤหัสบดี",
    tag: "ยักษ์แก๊สที่ใหญ่ที่สุด",
    radius: 22,
    orbit: 225,
    period: 4331,
    color: "#e0a15f",
    stats: ["เส้นผ่านศูนย์กลาง: 139,820 กม.", "ระยะห่างจากดวงอาทิตย์: 778.5 ล้าน กม.", "มีจุดแดงใหญ่"],
  },
  {
    name: "เสาร์",
    tag: "ราชาแห่งวงแหวน",
    radius: 18,
    orbit: 290,
    period: 10747,
    color: "#e6c57f",
    stats: ["เส้นผ่านศูนย์กลาง: 116,460 กม.", "ระยะห่างจากดวงอาทิตย์: 1.43 พันล้าน กม.", "วงแหวน: น้ำแข็งและหิน"],
    ring: true,
  },
  {
    name: "ยูเรนัส",
    tag: "ยักษ์น้ำแข็งที่หมุนตะแคง",
    radius: 14,
    orbit: 345,
    period: 30589,
    color: "#74d0d6",
    stats: ["เส้นผ่านศูนย์กลาง: 50,724 กม.", "ระยะห่างจากดวงอาทิตย์: 2.87 พันล้าน กม.", "แกนเอียง: 98°"],
  },
  {
    name: "เนปจูน",
    tag: "ยักษ์น้ำแข็งที่ลมแรงที่สุด",
    radius: 14,
    orbit: 405,
    period: 59800,
    color: "#4777ff",
    stats: ["เส้นผ่านศูนย์กลาง: 49,244 กม.", "ระยะห่างจากดวงอาทิตย์: 4.5 พันล้าน กม.", "ลมเร็วถึง 2,100 กม./ชม."],
  },
];

const stars = Array.from({ length: 200 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 1.4 + 0.4,
  alpha: Math.random() * 0.6 + 0.2,
}));

const sun = {
  x: baseCenter.x,
  y: baseCenter.y,
  radius: 32,
  color: "#ffcc4d",
};

let lastTime = performance.now();
let simulationDays = 0;

function updateTimeScale() {
  state.timeScale = Number.parseFloat(timeScaleInput.value);
  timeScaleValue.textContent = `${state.timeScale.toFixed(1)}x`;
}

function togglePause() {
  state.isPaused = !state.isPaused;
  togglePauseButton.textContent = state.isPaused ? "เล่นต่อ" : "หยุดชั่วคราว";
}

function updateOrbits() {
  state.showOrbits = toggleOrbitsInput.checked;
}

function setInfoPanel(target) {
  planetName.textContent = target.name;
  planetTag.textContent = target.tag;
  planetStats.innerHTML = "";
  target.stats.forEach((stat) => {
    const li = document.createElement("li");
    li.textContent = stat;
    planetStats.appendChild(li);
  });
}

function updateMission() {
  const discoveredCount = state.discovered.size;
  missionProgress.textContent = `${discoveredCount}/8`;
  missionFill.style.width = `${(discoveredCount / 8) * 100}%`;
}

function drawStars() {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSun() {
  const gradient = ctx.createRadialGradient(sun.x, sun.y, 4, sun.x, sun.y, 60);
  gradient.addColorStop(0, "rgba(255, 204, 77, 0.9)");
  gradient.addColorStop(1, "rgba(255, 204, 77, 0.1)");
  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.arc(sun.x, sun.y, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = sun.color;
  ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrbit(planet) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(sun.x, sun.y, planet.orbit, planet.orbit * 0.9, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlanet(planet, index) {
  const angle = (simulationDays / planet.period) * Math.PI * 2 + index;
  const orbitY = planet.orbit * 0.9;
  const x = sun.x + Math.cos(angle) * planet.orbit;
  const y = sun.y + Math.sin(angle) * orbitY;

  if (planet.ring) {
    ctx.save();
    ctx.strokeStyle = "rgba(230, 197, 127, 0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x, y, planet.radius + 8, planet.radius + 3, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.fillStyle = planet.color;
  ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
  ctx.fill();

  planet.position = { x, y };
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawSun();

  planets.forEach((planet) => {
    if (state.showOrbits) {
      drawOrbit(planet);
    }
    drawPlanet(planet, planets.indexOf(planet));
  });
}

function update(deltaMs) {
  if (!state.isPaused) {
    const daysPerSecond = 8;
    simulationDays += (deltaMs / 1000) * daysPerSecond * state.timeScale;
  }
}

function animate(timestamp) {
  const deltaMs = timestamp - lastTime;
  lastTime = timestamp;
  update(deltaMs);
  render();
  requestAnimationFrame(animate);
}

function getPlanetFromClick(x, y) {
  return planets.find((planet) => {
    if (!planet.position) return false;
    const distance = Math.hypot(x - planet.position.x, y - planet.position.y);
    return distance <= planet.radius + 6;
  });
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const planet = getPlanetFromClick(x, y);
  if (planet) {
    state.discovered.add(planet.name);
    updateMission();
    setInfoPanel(planet);
  } else {
    setInfoPanel({
      name: "สุริยะ",
      tag: "ศูนย์กลางของระบบสุริยะและแหล่งพลังงานหลัก",
      stats: ["อุณหภูมิพื้นผิว: 5,500°C", "เส้นผ่านศูนย์กลาง: 1.39 ล้าน กม.", "อายุ: 4.6 พันล้านปี"],
    });
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    togglePause();
  }
  if (event.key.toLowerCase() === "o") {
    toggleOrbitsInput.checked = !toggleOrbitsInput.checked;
    updateOrbits();
  }
  if (event.key === "+" || event.key === "=") {
    timeScaleInput.value = Math.min(Number(timeScaleInput.max), Number(timeScaleInput.value) + 0.1).toFixed(1);
    updateTimeScale();
  }
  if (event.key === "-" || event.key === "_") {
    timeScaleInput.value = Math.max(Number(timeScaleInput.min), Number(timeScaleInput.value) - 0.1).toFixed(1);
    updateTimeScale();
  }
});

timeScaleInput.addEventListener("input", updateTimeScale);

togglePauseButton.addEventListener("click", togglePause);

toggleOrbitsInput.addEventListener("change", updateOrbits);

setInfoPanel({
  name: "สุริยะ",
  tag: "ศูนย์กลางของระบบสุริยะและแหล่งพลังงานหลัก",
  stats: ["อุณหภูมิพื้นผิว: 5,500°C", "เส้นผ่านศูนย์กลาง: 1.39 ล้าน กม.", "อายุ: 4.6 พันล้านปี"],
});
updateMission();
updateTimeScale();
requestAnimationFrame(animate);
