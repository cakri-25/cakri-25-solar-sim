const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const speedSlider = document.getElementById("speedSlider");
const zoomSlider = document.getElementById("zoomSlider");
const themeSelect = document.getElementById("themeSelect");
const speedValue = document.getElementById("speedValue");
const dayCounter = document.getElementById("dayCounter");
const statusText = document.getElementById("statusText");
const orbits = Array.from(document.querySelectorAll(".orbit"));
const universe = document.querySelector(".universe");

let running = false;
let elapsed = 0;
let lastTime = 0;
let speedMultiplier = Number(speedSlider.value);

const applySpeed = () => {
  speedMultiplier = Number(speedSlider.value);
  speedValue.textContent = `${speedMultiplier.toFixed(1)}x`;
  orbits.forEach((orbit) => {
    const baseSpeed = Number(orbit.querySelector(".planet").dataset.speed);
    orbit.style.animationDuration = `${18 / (baseSpeed * speedMultiplier)}s`;
  });
};

const setOrbitState = (state) => {
  orbits.forEach((orbit) => {
    orbit.style.animationPlayState = state;
  });
};

const setStatus = (text) => {
  statusText.textContent = text;
};

const tick = (timestamp) => {
  if (!running) {
    return;
  }

  if (lastTime) {
    elapsed += (timestamp - lastTime) * speedMultiplier;
    dayCounter.textContent = Math.floor(elapsed / 800).toString();
  }

  lastTime = timestamp;
  requestAnimationFrame(tick);
};

const startSim = () => {
  if (running) {
    return;
  }
  running = true;
  lastTime = 0;
  setOrbitState("running");
  setStatus("กำลังจำลอง");
  pauseBtn.disabled = false;
  startBtn.disabled = true;
  requestAnimationFrame(tick);
};

const pauseSim = () => {
  if (!running) {
    return;
  }
  running = false;
  setOrbitState("paused");
  setStatus("หยุดชั่วคราว");
  pauseBtn.disabled = true;
  startBtn.disabled = false;
};

const resetSim = () => {
  running = false;
  elapsed = 0;
  lastTime = 0;
  dayCounter.textContent = "0";
  setOrbitState("paused");
  setStatus("พร้อมเล่น");
  pauseBtn.disabled = true;
  startBtn.disabled = false;
};

speedSlider.addEventListener("input", applySpeed);
zoomSlider.addEventListener("input", () => {
  const zoom = Number(zoomSlider.value);
  universe.style.transform = `scale(${zoom})`;
});

startBtn.addEventListener("click", startSim);
pauseBtn.addEventListener("click", pauseSim);
resetBtn.addEventListener("click", resetSim);

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
});

applySpeed();
document.body.dataset.theme = themeSelect.value;
