# Solar System N-Body Simulation

A comprehensive 3D N-body physics simulation with 2D rendering for the solar system.

## Features

### Physics Engine
- **3D N-body gravity** with symplectic integration (leapfrog/KDK)
- **Adaptive timesteps** that automatically adjust based on proximity
- **Substeps** for close approaches to maintain accuracy
- **J2 oblateness corrections** for gas giants (Jupiter, Saturn) and ice giants
- **General Relativity 1PN corrections** for the Sun (explains Mercury's perihelion precession)

### Data Sources
- **JPL Horizons API** integration for accurate state vectors
- **SBDB (Small-Body Database)** for physical parameters
- **Error validation** - periodic comparison with JPL Horizons to measure accuracy

### Geological Modeling
- **Radiogenic heating** from radioactive decay (U-238, U-235, Th-232, K-40)
- **Tidal heating** for moons in eccentric orbits
- **Activity states** (active/dormant) based on total heat flux
- **Mass loss and outgassing** with reaction forces for active bodies

### Object Catalog (50+ Objects)
- **8 planets**: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- **20+ major moons**: Moon, Io, Europa, Ganymede, Callisto, Titan, Enceladus, etc.
- **10 dwarf planets**: Pluto, Ceres, Eris, Makemake, Haumea, etc.
- **5 comets**: Halley, Encke, Swift-Tuttle, Hale-Bopp, Tempel 1
- **7 NEAs**: Eros, Apophis, Bennu, Ryugu, Itokawa, Vesta, Pallas

### 2D Visualization
- Real-time 2D rendering with pygame
- Orbit trails
- Activity indicators for geologically active bodies
- Interactive camera controls (pan, zoom)
- Info panel with simulation time, energy, and active bodies

## Installation

```bash
# Clone the repository
git clone https://github.com/cakri-25/cakri-25-solar-sim.git
cd cakri-25-solar-sim

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Basic Simulation
```bash
python simulate.py
```

### Command-line Options
```bash
# Headless mode (no rendering)
python simulate.py --no-render

# Disable validation against JPL Horizons
python simulate.py --no-validate

# Custom timestep (in days)
python simulate.py --timestep 0.5

# Run for specific duration (in days)
python simulate.py --duration 365.25

# Run for specific number of steps
python simulate.py --steps 1000
```

### Interactive Controls
- **Space**: Pause/Resume simulation
- **Arrow keys**: Pan camera
- **+/-**: Zoom in/out
- **L**: Toggle labels
- **O**: Toggle orbit trails
- **I**: Toggle info panel
- **ESC**: Quit

## Project Structure

```
cakri-25-solar-sim/
├── simulate.py              # Main simulation script
├── requirements.txt         # Python dependencies
├── src/
│   ├── physics/
│   │   └── nbody.py        # N-body physics engine
│   ├── data/
│   │   ├── horizons.py     # JPL Horizons/SBDB client
│   │   ├── catalog.py      # Object catalog
│   │   └── validator.py    # Error validation
│   ├── geology/
│   │   └── heating.py      # Geological modeling
│   └── rendering/
│       └── display.py      # 2D renderer
└── tests/                   # Unit tests
```

## Scientific Accuracy

### Integrator
The simulation uses a symplectic (KDK) integrator which:
- Preserves energy and momentum over long timescales
- Is superior to Runge-Kutta methods for orbital mechanics
- Uses adaptive timesteps for efficiency and accuracy

### Perturbations
- **J2 effect**: Models the equatorial bulge of rotating bodies, important for gas giants
- **GR 1PN**: Includes first-order post-Newtonian corrections, explaining Mercury's 43 arcsec/century perihelion precession

### Validation
The simulation periodically compares positions with JPL Horizons data and logs:
- Mean position error
- RMS error
- Maximum error per body

## Example Output

```
Initializing Solar System Simulation...
Creating object catalog...
Created catalog with 50 objects

Initializing physics engine (timestep: 1.0 days)...
Initializing geological model...
Initializing error validator...
Initializing 2D renderer...

Simulation initialized successfully!
Total bodies: 50
Rendering: Enabled
Validation: Enabled

Running...

Step 100: 0.274 years, Energy: 1.234e+36 J
Step 200: 0.548 years, Energy: 1.234e+36 J

=== Validation at day 30.0 ===
Mean error: 142.35 km
RMS error: 289.47 km
Max error: 1245.78 km

Active bodies: 3
  Io, Europa, Enceladus
```

## Performance

- **Typical timestep**: 1 day
- **Adaptive timesteps**: Down to 1 hour during close approaches
- **50 bodies**: ~100-200 steps/second (with rendering)
- **Memory usage**: ~50-100 MB

## Future Enhancements

- [ ] Non-gravitational forces (radiation pressure, Yarkovsky effect)
- [ ] Collision detection and merging
- [ ] Export to various formats (video, data files)
- [ ] 3D rendering option
- [ ] GPU acceleration
- [ ] Relativistic effects for black holes/neutron stars

## References

- JPL Horizons: https://ssd.jpl.nasa.gov/horizons/
- SBDB: https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html
- Symplectic integrators: Wisdom & Holman (1991)
- Post-Newtonian gravity: Einstein-Infeld-Hoffmann equations

## License

MIT License

## Author

cakri-25