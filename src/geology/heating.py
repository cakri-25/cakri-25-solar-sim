"""
Geological modeling: radiogenic and tidal heating
Affects activity state and outgassing
"""

import numpy as np
from typing import Dict
from dataclasses import dataclass


@dataclass
class GeologicalState:
    """Geological state of a body"""
    radiogenic_heat: float = 0.0  # W
    tidal_heat: float = 0.0  # W
    total_heat: float = 0.0  # W
    activity_state: str = 'dormant'  # active/dormant
    outgassing_rate: float = 0.0  # kg/s
    mass_loss_total: float = 0.0  # kg


class GeologicalModel:
    """
    Model geological activity based on heating sources
    """
    
    def __init__(self):
        # Activity threshold (W)
        self.activity_threshold = 1e12  # 1 TW
        
        # Radiogenic isotopes (approximate current abundances)
        self.isotopes = {
            'U238': {'half_life': 4.468e9, 'heat_production': 9.46e-5},  # W/kg
            'U235': {'half_life': 7.04e8, 'heat_production': 5.69e-4},
            'Th232': {'half_life': 1.405e10, 'heat_production': 2.64e-5},
            'K40': {'half_life': 1.25e9, 'heat_production': 2.92e-5},
        }
    
    def compute_radiogenic_heating(self, body, time_years: float = 4.5e9) -> float:
        """
        Compute radiogenic heating from radioactive decay
        
        Args:
            body: Body object with mass and composition
            time_years: Age of the solar system (years)
        
        Returns:
            Radiogenic heating power (W)
        """
        if not hasattr(body, 'mass') or body.mass <= 0:
            return 0.0
        
        # Assume rocky composition with typical isotope ratios
        # Simplified: use 10 ppb uranium, 40 ppb thorium, 0.01% potassium
        rock_mass = body.mass * 0.5  # Assume 50% rocky material
        
        total_heat = 0.0
        
        # Uranium-238
        u238_mass = rock_mass * 10e-9  # 10 ppb
        u238_heat = u238_mass * self.isotopes['U238']['heat_production']
        u238_heat *= np.exp(-time_years / self.isotopes['U238']['half_life'] * np.log(2))
        total_heat += u238_heat
        
        # Uranium-235
        u235_mass = rock_mass * 0.7e-9  # 0.7 ppb
        u235_heat = u235_mass * self.isotopes['U235']['heat_production']
        u235_heat *= np.exp(-time_years / self.isotopes['U235']['half_life'] * np.log(2))
        total_heat += u235_heat
        
        # Thorium-232
        th232_mass = rock_mass * 40e-9  # 40 ppb
        th232_heat = th232_mass * self.isotopes['Th232']['heat_production']
        th232_heat *= np.exp(-time_years / self.isotopes['Th232']['half_life'] * np.log(2))
        total_heat += th232_heat
        
        # Potassium-40
        k40_mass = rock_mass * 0.0001 * 0.000117  # 0.01% K, 0.0117% K-40
        k40_heat = k40_mass * self.isotopes['K40']['heat_production']
        k40_heat *= np.exp(-time_years / self.isotopes['K40']['half_life'] * np.log(2))
        total_heat += k40_heat
        
        return total_heat
    
    def compute_tidal_heating(self, body, parent_body, integrator) -> float:
        """
        Compute tidal heating from orbital eccentricity and proximity to parent
        
        Tidal heating is significant for:
        - Io (Jupiter's moon)
        - Europa (Jupiter's moon)
        - Enceladus (Saturn's moon)
        
        Args:
            body: Moon/satellite object
            parent_body: Parent planet
            integrator: Physics integrator for orbital parameters
        
        Returns:
            Tidal heating power (W)
        """
        if parent_body is None:
            return 0.0
        
        # Distance to parent
        r_vec = body.position - parent_body.position
        r = np.linalg.norm(r_vec)
        
        if r < 1e-10:
            return 0.0
        
        # Orbital velocity
        v = body.velocity - parent_body.velocity
        
        # Simplified tidal heating formula
        # Q ~ (k2/Q) * (GM_parent)^2 * R_body^5 * e^2 / (G * a^6)
        # where k2 is Love number, Q is quality factor, e is eccentricity
        
        G = 6.67430e-20  # km^3/(kg*s^2)
        
        # Approximate eccentricity from current state
        # (Simplified - real calculation would need full orbital elements)
        h_vec = np.cross(r_vec, v)  # Angular momentum vector
        h = np.linalg.norm(h_vec)
        
        # Energy
        v_mag = np.linalg.norm(v)
        E = 0.5 * v_mag**2 - parent_body.GM / r
        
        # Semi-major axis
        a = -parent_body.GM / (2 * E) if E < 0 else r
        
        # Eccentricity (approximate)
        e_vec_mag = np.sqrt(1 + 2 * E * h**2 / parent_body.GM**2) if E < 0 else 0.1
        e = min(e_vec_mag, 0.9)  # Cap eccentricity
        
        # Tidal heating (simplified formula)
        k2 = 0.3  # Love number (typical for rocky bodies)
        Q = 100  # Quality factor (dissipation)
        
        if a > body.radius:
            # Tidal heating rate
            tidal_heat = (21/2) * k2/Q * parent_body.GM**2 * body.radius**5 * e**2
            tidal_heat /= (G * a**6)
            
            # Scale by rigidity (less heating for rigid bodies)
            rigidity_factor = min(1.0, body.radius / 1000.0)
            tidal_heat *= rigidity_factor
        else:
            tidal_heat = 0.0
        
        return tidal_heat
    
    def update_geological_state(self, body, parent_body, integrator, 
                                geo_state: GeologicalState) -> GeologicalState:
        """
        Update geological state based on heating sources
        
        Args:
            body: Body object
            parent_body: Parent body (for tidal heating)
            integrator: Physics integrator
            geo_state: Current geological state
        
        Returns:
            Updated geological state
        """
        # Compute heating sources
        geo_state.radiogenic_heat = self.compute_radiogenic_heating(body)
        
        if hasattr(body, 'tidal_active') and body.tidal_active and parent_body:
            geo_state.tidal_heat = self.compute_tidal_heating(body, parent_body, integrator)
        else:
            geo_state.tidal_heat = 0.0
        
        geo_state.total_heat = geo_state.radiogenic_heat + geo_state.tidal_heat
        
        # Determine activity state
        if geo_state.total_heat > self.activity_threshold:
            geo_state.activity_state = 'active'
        else:
            geo_state.activity_state = 'dormant'
        
        # Compute outgassing rate if active
        if geo_state.activity_state == 'active' and hasattr(body, 'outgassing') and body.outgassing:
            # Outgassing rate proportional to heat flux
            # Simplified: 1 kg/s per TW of heating
            geo_state.outgassing_rate = geo_state.total_heat / 1e12
        else:
            geo_state.outgassing_rate = 0.0
        
        return geo_state
    
    def apply_outgassing_force(self, body, geo_state: GeologicalState, dt: float):
        """
        Apply reaction force from outgassing
        
        Args:
            body: Body object
            geo_state: Geological state
            dt: Timestep (seconds)
        """
        if geo_state.outgassing_rate <= 0:
            return
        
        # Mass loss
        mass_loss = geo_state.outgassing_rate * dt
        geo_state.mass_loss_total += mass_loss
        
        # Update body mass
        if hasattr(body, 'mass'):
            body.mass = max(body.mass - mass_loss, body.mass * 0.99)
            # Update GM accordingly
            G = 6.67430e-20
            body.GM = G * body.mass
        
        # Reaction force (simplified: random direction with some retrograde bias)
        # Outgassing typically opposes orbital motion
        v_dir = body.velocity / (np.linalg.norm(body.velocity) + 1e-10)
        
        # Random component
        random_dir = np.random.randn(3)
        random_dir /= (np.linalg.norm(random_dir) + 1e-10)
        
        # Combine: 70% retrograde, 30% random
        thrust_dir = -0.7 * v_dir + 0.3 * random_dir
        thrust_dir /= (np.linalg.norm(thrust_dir) + 1e-10)
        
        # Thrust magnitude (simplified rocket equation)
        # F = dm/dt * v_exhaust
        v_exhaust = 0.5  # km/s (typical for volatile outgassing)
        thrust = geo_state.outgassing_rate * v_exhaust
        
        # Apply impulse
        if body.mass > 0:
            delta_v = (thrust / body.mass) * dt * thrust_dir
            body.velocity += delta_v
