"""
N-body physics engine with symplectic integration
Includes J2 oblateness and GR 1PN corrections
"""

import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class Body:
    """Celestial body state"""
    name: str
    mass: float  # kg
    GM: float  # km^3/s^2
    radius: float  # km
    position: np.ndarray  # km (3D)
    velocity: np.ndarray  # km/s (3D)
    J2: float = 0.0  # Oblateness coefficient
    parent: str = None  # Parent body for moons
    tidal_active: bool = False  # Tidally active
    outgassing: bool = False  # Outgassing active
    activity_state: str = 'dormant'  # active/dormant
    
    def __post_init__(self):
        self.position = np.array(self.position, dtype=float)
        self.velocity = np.array(self.velocity, dtype=float)
        # Calculate mass from GM if not provided
        if self.mass == 0 and self.GM > 0:
            G = 6.67430e-20  # km^3/(kg*s^2)
            self.mass = self.GM / G


class SymplecticIntegrator:
    """
    Symplectic integrator for N-body dynamics
    Implements leapfrog/KDK (Kick-Drift-Kick) scheme
    """
    
    def __init__(self, bodies: List[Body], dt: float = 86400.0):
        """
        Initialize integrator
        
        Args:
            bodies: List of Body objects
            dt: Base timestep in seconds
        """
        self.bodies = bodies
        self.dt = dt
        self.time = 0.0
        self.G = 6.67430e-20  # Gravitational constant in km^3/(kg*s^2)
        self.c = 299792.458  # Speed of light in km/s
        
    def compute_acceleration(self, body_idx: int, positions: np.ndarray) -> np.ndarray:
        """
        Compute total acceleration on a body
        
        Args:
            body_idx: Index of body to compute acceleration for
            positions: Array of all body positions (N x 3)
        
        Returns:
            Acceleration vector (3D) in km/s^2
        """
        body = self.bodies[body_idx]
        acc = np.zeros(3)
        
        for j, other in enumerate(self.bodies):
            if j == body_idx:
                continue
            
            # Vector from body to other
            r_vec = positions[j] - positions[body_idx]
            r = np.linalg.norm(r_vec)
            
            if r < 1e-10:  # Avoid division by zero
                continue
            
            # Standard Newtonian gravity
            acc += other.GM * r_vec / r**3
            
            # J2 oblateness effect (for gas giants and planets)
            if other.J2 != 0 and r > other.radius:
                acc += self._compute_j2_perturbation(r_vec, r, other)
            
            # General Relativity 1PN correction (for Sun)
            if other.name == 'Sun' and body.name != 'Sun':
                acc += self._compute_gr_1pn(body_idx, j, r_vec, r, positions)
        
        return acc
    
    def _compute_j2_perturbation(self, r_vec: np.ndarray, r: float, other: Body) -> np.ndarray:
        """
        Compute J2 oblateness perturbation
        
        J2 effect models the equatorial bulge of rotating bodies
        Most significant for gas giants (Jupiter, Saturn)
        """
        x, y, z = r_vec
        r2 = r * r
        r5 = r**5
        
        # Simplified J2 acceleration (assuming rotation axis is z-axis)
        J2_factor = -1.5 * other.J2 * other.GM * other.radius**2 / r5
        
        acc_x = J2_factor * x * (1 - 5 * z**2 / r2)
        acc_y = J2_factor * y * (1 - 5 * z**2 / r2)
        acc_z = J2_factor * z * (3 - 5 * z**2 / r2)
        
        return np.array([acc_x, acc_y, acc_z])
    
    def _compute_gr_1pn(self, i: int, j: int, r_vec: np.ndarray, 
                        r: float, positions: np.ndarray) -> np.ndarray:
        """
        Compute General Relativity 1PN (Post-Newtonian) correction
        
        Important for Mercury's perihelion precession around the Sun
        """
        body = self.bodies[i]
        other = self.bodies[j]
        
        v = body.velocity
        v2 = np.dot(v, v)
        r_dot_v = np.dot(r_vec, v)
        
        # 1PN correction term
        c2 = self.c * self.c
        
        # Einstein-Infeld-Hoffmann equations (simplified)
        A = 4 * other.GM / r - v2
        B = 4 * r_dot_v
        
        acc_1pn = (other.GM / (r**3 * c2)) * (A * r_vec + B * v)
        
        return acc_1pn
    
    def step_kdk(self, dt: float = None):
        """
        Perform one KDK (Kick-Drift-Kick) integration step
        
        KDK is a symplectic integrator that preserves energy better than RK4
        
        Args:
            dt: Timestep in seconds (uses self.dt if None)
        """
        if dt is None:
            dt = self.dt
        
        N = len(self.bodies)
        positions = np.array([body.position for body in self.bodies])
        velocities = np.array([body.velocity for body in self.bodies])
        
        # Kick: Update velocities by half step
        accelerations = np.array([
            self.compute_acceleration(i, positions) 
            for i in range(N)
        ])
        velocities += 0.5 * dt * accelerations
        
        # Drift: Update positions by full step
        positions += dt * velocities
        
        # Update positions for second kick
        for i, body in enumerate(self.bodies):
            body.position = positions[i]
        
        # Kick: Update velocities by half step again
        accelerations = np.array([
            self.compute_acceleration(i, positions) 
            for i in range(N)
        ])
        velocities += 0.5 * dt * accelerations
        
        # Update body states
        for i, body in enumerate(self.bodies):
            body.position = positions[i]
            body.velocity = velocities[i]
        
        self.time += dt
    
    def adaptive_step(self, max_dt: float = None, min_dt: float = 3600.0):
        """
        Adaptive timestep based on close approaches
        
        Uses smaller timesteps when bodies are close together
        
        Args:
            max_dt: Maximum timestep (uses self.dt if None)
            min_dt: Minimum timestep (1 hour default)
        """
        if max_dt is None:
            max_dt = self.dt
        
        # Find minimum distance between any two bodies
        min_distance = float('inf')
        for i, body1 in enumerate(self.bodies):
            for j, body2 in enumerate(self.bodies):
                if i >= j:
                    continue
                dist = np.linalg.norm(body1.position - body2.position)
                # Consider Hill radius for adaptive stepping
                hill_radius = max(body1.radius, body2.radius) * 10
                if dist < min_distance and dist > hill_radius:
                    min_distance = dist
        
        # Adaptive timestep: smaller when bodies are closer
        # dt proportional to sqrt(distance)
        if min_distance < float('inf'):
            adaptive_dt = max_dt * min(1.0, np.sqrt(min_distance / 1e6))
            adaptive_dt = max(min_dt, adaptive_dt)
        else:
            adaptive_dt = max_dt
        
        self.step_kdk(adaptive_dt)
        return adaptive_dt
    
    def substep_close_approach(self, threshold_distance: float = 1e6):
        """
        Use substeps when bodies are in close approach
        
        Args:
            threshold_distance: Distance threshold for substeps (km)
        """
        # Check for close approaches
        close_approach = False
        for i, body1 in enumerate(self.bodies):
            for j, body2 in enumerate(self.bodies):
                if i >= j:
                    continue
                dist = np.linalg.norm(body1.position - body2.position)
                if dist < threshold_distance:
                    close_approach = True
                    break
            if close_approach:
                break
        
        if close_approach:
            # Use 10 substeps
            sub_dt = self.dt / 10.0
            for _ in range(10):
                self.step_kdk(sub_dt)
        else:
            self.step_kdk()
    
    def get_total_energy(self) -> float:
        """Calculate total energy of the system"""
        kinetic = 0.0
        potential = 0.0
        
        for i, body in enumerate(self.bodies):
            # Kinetic energy
            v2 = np.dot(body.velocity, body.velocity)
            kinetic += 0.5 * body.mass * v2
            
            # Potential energy
            for j, other in enumerate(self.bodies):
                if j <= i:
                    continue
                r = np.linalg.norm(body.position - other.position)
                if r > 1e-10:
                    potential -= self.G * body.mass * other.mass / r
        
        return kinetic + potential
    
    def get_total_momentum(self) -> np.ndarray:
        """Calculate total momentum of the system"""
        momentum = np.zeros(3)
        for body in self.bodies:
            momentum += body.mass * body.velocity
        return momentum
