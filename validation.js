const G = 6.6743e-11;

const SAMPLE_DATA = {
  epoch: "2024-01-01T00:00:00Z",
  dtHours: 1,
  steps: 24,
  bodies: [
    {
      name: "Sun",
      gm: 1.32712440018e20,
      radiusKm: 696340,
      state: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 },
    },
    {
      name: "Earth",
      gm: 3.986004354e14,
      radiusKm: 6371,
      state: { x: 1.496e11, y: 0, z: 0, vx: 0, vy: 29780, vz: 0 },
    },
    {
      name: "Mars",
      gm: 4.282837e13,
      radiusKm: 3389.5,
      state: { x: 2.279e11, y: 0, z: 0, vx: 0, vy: 24077, vz: 0 },
    },
  ],
  reference: {
    "Earth": { x: 1.496e11, y: 2.57e9, z: 0 },
    "Mars": { x: 2.279e11, y: 2.08e9, z: 0 },
  },
};

const loadSampleBtn = document.getElementById("loadSampleBtn");
const runValidationBtn = document.getElementById("runValidationBtn");
const validationInput = document.getElementById("validationInput");
const validationOutput = document.getElementById("validationOutput");

const parseInput = () => {
  if (!validationInput.value.trim()) {
    return null;
  }
  try {
    return JSON.parse(validationInput.value);
  } catch (error) {
    validationOutput.textContent = `อ่าน JSON ไม่สำเร็จ: ${error.message}`;
    return null;
  }
};

const vecAdd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const vecScale = (a, factor) => ({ x: a.x * factor, y: a.y * factor, z: a.z * factor });
const vecSub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const vecLength = (a) => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);

const computeAccelerations = (bodies) => {
  const accelerations = bodies.map(() => ({ x: 0, y: 0, z: 0 }));
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const delta = vecSub(bodies[j].pos, bodies[i].pos);
      const dist = Math.max(vecLength(delta), 1);
      const invDist3 = 1 / (dist * dist * dist);
      const accelI = vecScale(delta, bodies[j].gm * invDist3);
      const accelJ = vecScale(delta, bodies[i].gm * invDist3);
      accelerations[i] = vecAdd(accelerations[i], accelI);
      accelerations[j] = vecAdd(accelerations[j], vecScale(accelJ, -1));
    }
  }
  return accelerations;
};

const leapfrogStep = (bodies, dt) => {
  const halfDt = dt * 0.5;
  const accelStart = computeAccelerations(bodies);
  bodies.forEach((body, index) => {
    body.vel = vecAdd(body.vel, vecScale(accelStart[index], halfDt));
    body.pos = vecAdd(body.pos, vecScale(body.vel, dt));
  });
  const accelEnd = computeAccelerations(bodies);
  bodies.forEach((body, index) => {
    body.vel = vecAdd(body.vel, vecScale(accelEnd[index], halfDt));
  });
};

const runValidation = (data) => {
  const dt = (data.dtHours ?? 1) * 3600;
  const steps = data.steps ?? 24;
  const bodies = data.bodies.map((body) => ({
    name: body.name,
    gm: body.gm ?? body.massKg * G,
    pos: { x: body.state.x, y: body.state.y, z: body.state.z },
    vel: { x: body.state.vx, y: body.state.vy, z: body.state.vz },
  }));

  for (let step = 0; step < steps; step += 1) {
    leapfrogStep(bodies, dt);
  }

  const lines = [`Epoch: ${data.epoch}`, `Steps: ${steps} (dt=${data.dtHours}h)`];
  const errors = [];

  bodies.forEach((body) => {
    const reference = data.reference?.[body.name];
    if (!reference) {
      return;
    }
    const diff = vecSub(body.pos, reference);
    const err = vecLength(diff) / 1000;
    errors.push(err);
    lines.push(`${body.name}: error ≈ ${err.toFixed(2)} km`);
  });

  if (errors.length) {
    const avg = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    lines.push(`ค่าเฉลี่ย error: ${avg.toFixed(2)} km`);
  } else {
    lines.push("ไม่มี reference สำหรับเทียบ");
  }

  validationOutput.textContent = lines.join("\n");
};

loadSampleBtn.addEventListener("click", () => {
  validationInput.value = JSON.stringify(SAMPLE_DATA, null, 2);
  validationOutput.textContent = "โหลดตัวอย่างแล้ว";
});

runValidationBtn.addEventListener("click", () => {
  const data = parseInput();
  if (!data) {
    return;
  }
  runValidation(data);
});
