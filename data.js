(() => {
const AU_KM = 149_597_870;
const DATA_QUALITY_ESTIMATED = "ประมาณค่า";
const G = 6.6743e-11;

// สร้างค่าแบบสุ่มที่คงที่จากชื่อเพื่อให้ค่าที่ประมาณยังสม่ำเสมอ
const hashToUnit = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
  }
  return hash / 1000003;
};

const scaleBetween = (min, max, unit) => min + (max - min) * unit;

const calcMass = (radiusKm, density) => {
  const radiusM = radiusKm * 1000;
  const volume = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  const densityKgM3 = density * 1000;
  return volume * densityKgM3;
};

const calcGravity = (massKg, radiusKm) => (G * massKg) / Math.pow(radiusKm * 1000, 2);

const calcOrbit = (distanceKm, parentMassKg) => {
  const distanceM = distanceKm * 1000;
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(distanceM, 3) / (G * parentMassKg));
  const speed = Math.sqrt((G * parentMassKg) / distanceM) / 1000;
  return {
    orbitalPeriodDays: periodSeconds / 86400,
    orbitalSpeedKmS: speed,
  };
};

const buildObject = (object, parentMassKg) => {
  const distanceKm = object.distanceKm ?? (object.distanceAU ? object.distanceAU * AU_KM : 0);
  const massKg = object.massKg ?? calcMass(object.radiusKm, object.density ?? 2.2);
  const gravity = object.gravity ?? calcGravity(massKg, object.radiusKm);
  const orbit = object.orbitalPeriodDays && object.orbitalSpeedKmS
    ? { orbitalPeriodDays: object.orbitalPeriodDays, orbitalSpeedKmS: object.orbitalSpeedKmS }
    : distanceKm && parentMassKg
      ? calcOrbit(distanceKm, parentMassKg)
      : { orbitalPeriodDays: 0, orbitalSpeedKmS: 0 };
  const hillRadiusKm = distanceKm && parentMassKg
    ? distanceKm * Math.cbrt(massKg / (3 * parentMassKg))
    : 0;
  // ใช้ Hill radius เป็นค่าประมาณตำแหน่ง L1 จากวัตถุเล็ก
  const lagrangeKm = hillRadiusKm;
  return {
    ...object,
    distanceKm,
    massKg,
    gravity,
    orbitalPeriodDays: orbit.orbitalPeriodDays,
    orbitalSpeedKmS: orbit.orbitalSpeedKmS,
    hillRadiusKm,
    lagrangeKm,
  };
};

const SUN = {
  id: "sun",
  name: "ดวงอาทิตย์",
  type: "star",
  radiusKm: 696340,
  massKg: 1.989e30,
  distanceKm: 0,
  temperatureK: 5772,
  composition: "ไฮโดรเจน/ฮีเลียม",
  texture: "star",
  magneticField: "สนามแม่เหล็กสุริยะ",
  heatFlux: "พลังงานสูง",
  render: "star",
};

const PLANETS = [
  {
    id: "mercury",
    name: "ดาวพุธ",
    type: "planet",
    radiusKm: 2439.7,
    massKg: 3.301e23,
    distanceAU: 0.387,
    temperatureK: 440,
    atmosphere: "บางมาก",
    pressureAtm: 0,
    composition: "หินและโลหะ",
    texture: "rocky",
    magneticField: "อ่อนมาก",
    surfaceDynamics: "รอยแตกร้าว",
  },
  {
    id: "venus",
    name: "ดาวศุกร์",
    type: "planet",
    radiusKm: 6051.8,
    massKg: 4.867e24,
    distanceAU: 0.723,
    temperatureK: 737,
    atmosphere: "หนาแน่น",
    pressureAtm: 92,
    composition: "หิน/ภูเขาไฟ",
    texture: "cloud",
    magneticField: "ไม่มี",
    surfaceDynamics: "ภูเขาไฟ",
  },
  {
    id: "earth",
    name: "โลก",
    type: "planet",
    radiusKm: 6371,
    massKg: 5.972e24,
    distanceAU: 1,
    temperatureK: 288,
    atmosphere: "ไนโตรเจน/ออกซิเจน",
    pressureAtm: 1,
    composition: "หิน/มหาสมุทร",
    texture: "ocean",
    magneticField: "แข็งแรง",
    surfaceDynamics: "แผ่นเปลือกดาว",
    weather: "ฝน/เมฆ",
    life: "ชีวภาพ",
  },
  {
    id: "mars",
    name: "ดาวอังคาร",
    type: "planet",
    radiusKm: 3389.5,
    massKg: 6.417e23,
    distanceAU: 1.524,
    temperatureK: 210,
    atmosphere: "คาร์บอนไดออกไซด์บาง",
    pressureAtm: 0.006,
    composition: "หิน/ฝุ่นแดง",
    texture: "rocky",
    magneticField: "ไม่มี",
    surfaceDynamics: "ร่องรอยน้ำแข็ง",
  },
  {
    id: "jupiter",
    name: "ดาวพฤหัสบดี",
    type: "planet",
    radiusKm: 69911,
    massKg: 1.898e27,
    distanceAU: 5.203,
    temperatureK: 165,
    atmosphere: "ไฮโดรเจน/ฮีเลียม",
    pressureAtm: 100,
    composition: "แก๊สยักษ์",
    texture: "gas",
    magneticField: "รุนแรง",
    ring: "มีวงแหวนจาง",
  },
  {
    id: "saturn",
    name: "ดาวเสาร์",
    type: "planet",
    radiusKm: 58232,
    massKg: 5.683e26,
    distanceAU: 9.58,
    temperatureK: 134,
    atmosphere: "ไฮโดรเจน/ฮีเลียม",
    pressureAtm: 100,
    composition: "แก๊สยักษ์",
    texture: "gas",
    magneticField: "ปานกลาง",
    ring: "วงแหวนเด่น",
    ringStability: "คงตัวแต่มีการสลายตัว",
  },
  {
    id: "uranus",
    name: "ดาวยูเรนัส",
    type: "planet",
    radiusKm: 25362,
    massKg: 8.681e25,
    distanceAU: 19.2,
    temperatureK: 76,
    atmosphere: "ไฮโดรเจน/มีเทน",
    pressureAtm: 50,
    composition: "น้ำแข็งยักษ์",
    texture: "ice",
    magneticField: "เอียง",
    ring: "วงแหวนบาง",
  },
  {
    id: "neptune",
    name: "ดาวเนปจูน",
    type: "planet",
    radiusKm: 24622,
    massKg: 1.024e26,
    distanceAU: 30.05,
    temperatureK: 72,
    atmosphere: "ไฮโดรเจน/มีเทน",
    pressureAtm: 50,
    composition: "น้ำแข็งยักษ์",
    texture: "ice",
    magneticField: "เอียง",
    ring: "วงแหวนบาง",
  },
];

const DWARF_PLANETS = [
  {
    id: "ceres",
    name: "เซเรส",
    type: "dwarf",
    radiusKm: 473,
    massKg: 9.39e20,
    distanceAU: 2.77,
    temperatureK: 167,
    atmosphere: "แทบไม่มี",
    pressureAtm: 0,
    composition: "หิน/น้ำแข็ง",
    texture: "rocky",
    surfaceDynamics: "น้ำแข็งใต้ผิว",
  },
  {
    id: "pluto",
    name: "พลูโต",
    type: "dwarf",
    radiusKm: 1188,
    massKg: 1.309e22,
    distanceAU: 39.48,
    temperatureK: 44,
    atmosphere: "ไนโตรเจนบาง",
    pressureAtm: 0.00001,
    composition: "น้ำแข็ง/ไนโตรเจน",
    texture: "ice",
    surfaceDynamics: "ธารน้ำแข็ง",
  },
  {
    id: "haumea",
    name: "เฮาเมอา",
    type: "dwarf",
    radiusKm: 816,
    massKg: 4.006e21,
    distanceAU: 43.1,
    temperatureK: 50,
    atmosphere: "ไม่มี",
    pressureAtm: 0,
    composition: "น้ำแข็ง",
    texture: "ice",
    ring: "มีวงแหวนบาง",
  },
  {
    id: "makemake",
    name: "มาคีมาคี",
    type: "dwarf",
    radiusKm: 715,
    massKg: 3.1e21,
    distanceAU: 45.8,
    temperatureK: 40,
    atmosphere: "บางมาก",
    pressureAtm: 0,
    composition: "น้ำแข็ง/มีเทน",
    texture: "ice",
  },
  {
    id: "eris",
    name: "เอริส",
    type: "dwarf",
    radiusKm: 1163,
    massKg: 1.66e22,
    distanceAU: 67.8,
    temperatureK: 30,
    atmosphere: "ไม่มี",
    pressureAtm: 0,
    composition: "น้ำแข็ง",
    texture: "ice",
  },
];

const PARENT_NAME_BY_ID = {
  earth: "โลก",
  mars: "ดาวอังคาร",
  jupiter: "ดาวพฤหัสบดี",
  saturn: "ดาวเสาร์",
  uranus: "ดาวยูเรนัส",
  neptune: "ดาวเนปจูน",
};

const MOON_RANGES = {
  earth: { radius: [200, 2000], distance: [300000, 450000], density: [2.7, 3.4] },
  mars: { radius: [5, 15], distance: [9000, 24000], density: [1.8, 2.5] },
  jupiter: { radius: [10, 2700], distance: [120000, 2000000], density: [1.2, 3.5] },
  saturn: { radius: [100, 2600], distance: [180000, 3600000], density: [1.0, 1.9] },
  uranus: { radius: [200, 900], distance: [130000, 600000], density: [1.2, 1.8] },
  neptune: { radius: [150, 1400], distance: [350000, 1200000], density: [1.2, 2.0] },
};

const generateMoon = (name, parentId, overrides = {}) => {
  const unit = hashToUnit(name + parentId);
  const range = MOON_RANGES[parentId];
  const parent = PARENT_NAME_BY_ID[parentId] ?? parentId;
  const radiusKm = overrides.radiusKm ?? scaleBetween(range.radius[0], range.radius[1], unit);
  const distanceKm = overrides.distanceKm ?? scaleBetween(range.distance[0], range.distance[1], unit);
  const density = overrides.density ?? scaleBetween(range.density[0], range.density[1], unit);
  return {
    id: `${parentId}-${name}`,
    name,
    type: "moon",
    parent,
    radiusKm,
    density,
    distanceKm,
    texture: overrides.texture ?? "rocky",
    composition: overrides.composition ?? "น้ำแข็ง/หิน",
    atmosphere: overrides.atmosphere ?? "ไม่มี",
    pressureAtm: overrides.pressureAtm ?? 0,
    surfaceDynamics: overrides.surfaceDynamics ?? "หลุมอุกกาบาต",
  };
};

const MOONS = [
  generateMoon("ดวงจันทร์", "earth", { radiusKm: 1737.4, distanceKm: 384400, density: 3.34, texture: "rocky", composition: "หิน" }),
  generateMoon("โฟบอส", "mars", { radiusKm: 11.1, distanceKm: 9376, density: 1.9 }),
  generateMoon("ดีมอส", "mars", { radiusKm: 6.2, distanceKm: 23463, density: 1.5 }),
  generateMoon("ไอโอ", "jupiter", { radiusKm: 1821.6, distanceKm: 421700, density: 3.53, texture: "lava", composition: "หิน/ภูเขาไฟ" }),
  generateMoon("ยูโรปา", "jupiter", { radiusKm: 1560.8, distanceKm: 671034, density: 3.01, texture: "ice", composition: "น้ำแข็ง" }),
  generateMoon("แกนีมีด", "jupiter", { radiusKm: 2634.1, distanceKm: 1070412, density: 1.94, texture: "ice", composition: "น้ำแข็ง/หิน" }),
  generateMoon("คัลลิสโต", "jupiter", { radiusKm: 2410.3, distanceKm: 1882709, density: 1.83, texture: "ice", composition: "น้ำแข็ง" }),
  generateMoon("ไททัน", "saturn", { radiusKm: 2574.7, distanceKm: 1221870, density: 1.88, texture: "haze", atmosphere: "หนาแน่น", pressureAtm: 1.5, composition: "น้ำแข็ง/มีเทน" }),
  generateMoon("เรีย", "saturn", { radiusKm: 764.3, distanceKm: 527108, density: 1.23, texture: "ice" }),
  generateMoon("ไออาพิตัส", "saturn", { radiusKm: 734.5, distanceKm: 3560820, density: 1.09, texture: "ice" }),
  generateMoon("ไดโอนี", "saturn", { radiusKm: 561.4, distanceKm: 377396, density: 1.48, texture: "ice" }),
  generateMoon("เทธิส", "saturn", { radiusKm: 531.1, distanceKm: 294672, density: 0.99, texture: "ice" }),
  generateMoon("เอนเซลาดัส", "saturn", { radiusKm: 252.1, distanceKm: 238037, density: 1.61, texture: "ice", surfaceDynamics: "ไกเซอร์น้ำแข็ง" }),
  generateMoon("ไมมัส", "saturn", { radiusKm: 198.2, distanceKm: 185539, density: 1.15, texture: "ice" }),
  generateMoon("ไททาเนีย", "uranus", { radiusKm: 788.9, distanceKm: 435910, density: 1.71, texture: "ice" }),
  generateMoon("โอเบรอน", "uranus", { radiusKm: 761.4, distanceKm: 583520, density: 1.56, texture: "ice" }),
  generateMoon("อัมเบรียล", "uranus", { radiusKm: 584.7, distanceKm: 266000, density: 1.39, texture: "ice" }),
  generateMoon("อาริเอล", "uranus", { radiusKm: 578.9, distanceKm: 190900, density: 1.59, texture: "ice" }),
  generateMoon("มิแรนดา", "uranus", { radiusKm: 235.8, distanceKm: 129900, density: 1.2, texture: "ice" }),
  generateMoon("ไทรทัน", "neptune", { radiusKm: 1353.4, distanceKm: 354759, density: 2.06, texture: "ice", atmosphere: "บาง", pressureAtm: 0.000014 }),
  generateMoon("โปรทีอุส", "neptune", { radiusKm: 210, distanceKm: 117647, density: 1.3, texture: "ice" }),
  generateMoon("เนรีอิด", "neptune", { radiusKm: 170, distanceKm: 5513818, density: 1.5, texture: "ice" }),
  generateMoon("ไฮเพอเรียน", "saturn"),
  generateMoon("ฟีบี", "saturn"),
  generateMoon("แจนัส", "saturn"),
  generateMoon("เอพิเมเธีย", "saturn"),
  generateMoon("แพน", "saturn"),
  generateMoon("คาร์เม", "jupiter"),
  generateMoon("ซิโนเป", "jupiter"),
  generateMoon("อะมัลเธีย", "jupiter"),
  generateMoon("ฮิมาเลีย", "jupiter"),
  generateMoon("เอลารา", "jupiter"),
  generateMoon("ปาซิฟี", "jupiter"),
  generateMoon("อานานเก", "jupiter"),
];

const ASTEROID_NAMES = [
  "เวสตา",
  "พัลลัส",
  "ฮีเจีย",
  "อีรอส",
  "ไอดา",
  "ไซคี",
  "เบนนู",
  "ริวกู",
  "อิโตคาวะ",
  "อะพอฟิส",
  "ไดดิมอส",
  "ดักทิล",
  "ยุโรปา-ดาวเคราะห์น้อย",
  "จูโน",
  "ลูเทเทีย",
  "ดาบิดา",
  "อินเตอร์แมนเนีย",
  "ไอริส",
  "ฟลอรา",
  "ยูโนเมีย",
  "คลีโอพัตรา",
  "แมทิลเด",
  "แกสปรา",
  "ยูโฟรซีน",
  "เฮคเตอร์",
  "พาทรอคลัส",
  "แอนติโอเป",
  "ซิลเวีย",
  "คามิลลา",
  "ธีมิส",
];

const COMET_NAMES = [
  "ฮัลเลย์",
  "เอนเคอ",
  "เฮลล์-บอปป์",
  "67P/ชูริยูมอฟ-เกราซีเมนโก",
  "บอร์เรลลี",
  "เทมเพล-1",
  "เทมเพล-2",
  "ไวลด์-2",
  "ฮิอาคุทาเกะ",
  "ชูเมกเกอร์-เลวี 9",
  "ไอซอน",
  "เลิฟจอย",
  "แม็คโนต์",
  "2P/เอนเคอ",
  "9P/เทมเพล",
  "19P/บอร์เรลลี",
  "45P/ฮอนดา",
  "96P/มาชโฮลซ์",
  "109P/สวิฟต์-ทัตเทิล",
  "1I/โอมูอามูอา",
  "2I/บอริซอฟ",
];

const TNO_NAMES = [
  "ออร์คัส",
  "ควาวาร์",
  "เซดนา",
  "กงกง",
  "ซาลาเซีย",
  "วารูนา",
  "อิกซิออน",
  "2002 MS4",
];

const generateSmallBody = (name, type, range, options = {}) => {
  const unit = hashToUnit(name);
  const radiusKm = scaleBetween(range.radius[0], range.radius[1], unit);
  const density = scaleBetween(range.density[0], range.density[1], unit);
  const distanceAU = scaleBetween(range.distanceAU[0], range.distanceAU[1], unit);
  return {
    id: `${type}-${name}`,
    name,
    type,
    radiusKm,
    density,
    distanceAU,
    composition: options.composition ?? (type === "comet" ? "น้ำแข็ง/ฝุ่น" : "หิน"),
    texture: options.texture ?? (type === "comet" ? "ice" : "rocky"),
    atmosphere: "ไม่มี",
    pressureAtm: 0,
    surfaceDynamics: options.surfaceDynamics ?? "หลุมอุกกาบาต",
    dataQuality: DATA_QUALITY_ESTIMATED,
    render: options.render ?? "point",
  };
};

const ASTEROIDS = ASTEROID_NAMES.map((name) =>
  generateSmallBody(name, "asteroid", {
    radius: [2, 450],
    density: [1.6, 3.5],
    distanceAU: [2.1, 3.3],
  }, { render: "belt" })
);

const COMETS = COMET_NAMES.map((name) =>
  generateSmallBody(name, "comet", {
    radius: [1, 60],
    density: [0.4, 1.0],
    distanceAU: [4, 35],
  }, { texture: "ice", render: "comet" })
);

const TNOS = TNO_NAMES.map((name) =>
  generateSmallBody(name, "tno", {
    radius: [150, 1200],
    density: [1.2, 2.5],
    distanceAU: [30, 80],
  }, { texture: "ice", render: "belt", composition: "น้ำแข็ง/หิน" })
);

const RAW_OBJECTS = [SUN, ...PLANETS, ...DWARF_PLANETS, ...MOONS, ...ASTEROIDS, ...COMETS, ...TNOS];

const parentMasses = RAW_OBJECTS.reduce((map, obj) => {
  map[obj.name] = obj.massKg ?? calcMass(obj.radiusKm, obj.density ?? 2.2);
  return map;
}, {});

const CELESTIAL_OBJECTS = RAW_OBJECTS.map((obj) => {
  if (obj.type === "star") {
    return obj;
  }
  const parentName = obj.parent ?? "ดวงอาทิตย์";
  const parentMass = parentMasses[parentName] ?? SUN.massKg;
  return buildObject({ ...obj, parent: parentName }, parentMass);
});

window.CELESTIAL_OBJECTS = CELESTIAL_OBJECTS;
})();
