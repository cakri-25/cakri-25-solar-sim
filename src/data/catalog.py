"""
Object catalog with 50+ celestial bodies
Includes planets, moons, dwarf planets, comets, and NEAs
"""

from typing import List, Dict
import numpy as np
from ..physics.nbody import Body
from ..data.horizons import BodyDatabase


def create_object_catalog(body_db: BodyDatabase = None) -> List[Body]:
    """
    Create catalog of 50+ celestial objects
    
    Returns:
        List of Body objects
    """
    if body_db is None:
        body_db = BodyDatabase()
    
    bodies = []
    
    # Sun
    sun_data = body_db.get_body('Sun')
    bodies.append(Body(
        name='Sun',
        mass=1.989e30,
        GM=sun_data['GM'],
        radius=sun_data['radius'],
        position=np.array([0.0, 0.0, 0.0]),
        velocity=np.array([0.0, 0.0, 0.0]),
        J2=sun_data['J2']
    ))
    
    # Planets (8)
    planet_names = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
    
    for planet_name in planet_names:
        data = body_db.get_body(planet_name)
        # Use simplified circular orbits for initial conditions
        # In real implementation, fetch from Horizons
        bodies.append(Body(
            name=planet_name,
            mass=0.0,  # Will be calculated from GM
            GM=data['GM'],
            radius=data['radius'],
            position=get_initial_position(planet_name),
            velocity=get_initial_velocity(planet_name),
            J2=data.get('J2', 0.0)
        ))
    
    # Major moons (20)
    moon_data = [
        ('Moon', 'Earth'),
        ('Io', 'Jupiter'),
        ('Europa', 'Jupiter'),
        ('Ganymede', 'Jupiter'),
        ('Callisto', 'Jupiter'),
        ('Titan', 'Saturn'),
        ('Enceladus', 'Saturn'),
        ('Mimas', 'Saturn'),
        ('Rhea', 'Saturn'),
        ('Iapetus', 'Saturn'),
        ('Dione', 'Saturn'),
        ('Tethys', 'Saturn'),
        ('Miranda', 'Uranus'),
        ('Ariel', 'Uranus'),
        ('Umbriel', 'Uranus'),
        ('Titania', 'Uranus'),
        ('Oberon', 'Uranus'),
        ('Triton', 'Neptune'),
        ('Phobos', 'Mars'),
        ('Deimos', 'Mars'),
    ]
    
    for moon_name, parent in moon_data:
        data = body_db.get_body(moon_name)
        if not data:
            # Use default values for moons not in database
            data = {'GM': 10.0, 'radius': 100.0, 'J2': 0.0}
        
        bodies.append(Body(
            name=moon_name,
            mass=0.0,
            GM=data['GM'],
            radius=data['radius'],
            position=get_initial_position(moon_name, parent),
            velocity=get_initial_velocity(moon_name, parent),
            J2=data.get('J2', 0.0),
            parent=parent,
            tidal_active=data.get('tidal_active', False),
            outgassing=data.get('outgassing', False)
        ))
    
    # Dwarf planets (10)
    dwarf_planets = [
        ('Pluto', 5.9e9, 5.4),
        ('Ceres', 4.14e8, 17.9),
        ('Eris', 1.01e10, 0.8),
        ('Makemake', 6.85e9, 1.4),
        ('Haumea', 6.45e9, 1.2),
        ('Quaoar', 6.5e9, 0.7),
        ('Sedna', 1.4e10, 0.3),
        ('Orcus', 5.9e9, 0.6),
        ('Gonggong', 1e10, 0.5),
        ('Salacia', 5.6e9, 0.4),
    ]
    
    for name, semi_major_axis, velocity_km_s in dwarf_planets:
        data = body_db.get_body(name)
        if not data:
            data = {'GM': 100, 'radius': 500, 'J2': 0.0}
        
        bodies.append(Body(
            name=name,
            mass=0.0,
            GM=data['GM'],
            radius=data['radius'],
            position=np.array([semi_major_axis, 0.0, 0.0]),
            velocity=np.array([0.0, velocity_km_s, 0.0]),
            J2=data.get('J2', 0.0)
        ))
    
    # Comets (5)
    comets = [
        ('Halley', 2.7e9, 10.0),
        ('Encke', 3.3e8, 30.0),
        ('Swift-Tuttle', 7.9e9, 5.0),
        ('Hale-Bopp', 3.7e10, 2.0),
        ('Tempel 1', 3.1e8, 31.0),
    ]
    
    for name, semi_major_axis, velocity_km_s in comets:
        bodies.append(Body(
            name=name,
            mass=1e13,  # ~10^13 kg
            GM=0.667,  # Small GM
            radius=5.0,  # Small radius
            position=np.array([semi_major_axis, 0.0, 0.0]),
            velocity=np.array([0.0, velocity_km_s, 0.0]),
            J2=0.0,
            outgassing=True
        ))
    
    # Near-Earth Asteroids (7)
    neas = [
        ('Eros', 2.18e8, 24.4),
        ('Apophis', 1.38e8, 30.7),
        ('Bennu', 1.68e8, 28.0),
        ('Ryugu', 1.8e8, 27.0),
        ('Itokawa', 1.9e8, 26.5),
        ('Vesta', 3.53e8, 19.3),
        ('Pallas', 4.14e8, 17.9),
    ]
    
    for name, semi_major_axis, velocity_km_s in neas:
        bodies.append(Body(
            name=name,
            mass=1e15,  # ~10^15 kg
            GM=6.67,  # Small GM
            radius=10.0,
            position=np.array([semi_major_axis, 0.0, 0.0]),
            velocity=np.array([0.0, velocity_km_s, 0.0]),
            J2=0.0
        ))
    
    print(f"Created catalog with {len(bodies)} objects")
    return bodies


def get_initial_position(name: str, parent: str = None) -> np.ndarray:
    """Get initial position for a body (simplified)"""
    # Approximate orbital radii in km
    positions = {
        'Mercury': [5.79e7, 0, 0],
        'Venus': [1.082e8, 0, 0],
        'Earth': [1.496e8, 0, 0],
        'Mars': [2.279e8, 0, 0],
        'Jupiter': [7.786e8, 0, 0],
        'Saturn': [1.434e9, 0, 0],
        'Uranus': [2.871e9, 0, 0],
        'Neptune': [4.495e9, 0, 0],
        'Moon': [1.496e8 + 3.844e5, 0, 0],
        'Io': [7.786e8 + 4.217e5, 0, 0],
        'Europa': [7.786e8 + 6.711e5, 0, 0],
        'Ganymede': [7.786e8 + 1.070e6, 0, 0],
        'Callisto': [7.786e8 + 1.883e6, 0, 0],
        'Titan': [1.434e9 + 1.222e6, 0, 0],
        'Enceladus': [1.434e9 + 2.38e5, 0, 0],
    }
    
    return np.array(positions.get(name, [1e8, 0, 0]))


def get_initial_velocity(name: str, parent: str = None) -> np.ndarray:
    """Get initial velocity for a body (simplified circular orbit)"""
    # Approximate orbital velocities in km/s
    velocities = {
        'Mercury': [0, 47.87, 0],
        'Venus': [0, 35.02, 0],
        'Earth': [0, 29.78, 0],
        'Mars': [0, 24.07, 0],
        'Jupiter': [0, 13.07, 0],
        'Saturn': [0, 9.69, 0],
        'Uranus': [0, 6.81, 0],
        'Neptune': [0, 5.43, 0],
        'Moon': [0, 29.78 + 1.022, 0],
        'Io': [0, 13.07 + 17.3, 0],
        'Europa': [0, 13.07 + 13.7, 0],
        'Ganymede': [0, 13.07 + 10.9, 0],
        'Callisto': [0, 13.07 + 8.2, 0],
        'Titan': [0, 9.69 + 5.6, 0],
        'Enceladus': [0, 9.69 + 12.6, 0],
    }
    
    return np.array(velocities.get(name, [0, 10, 0]))
