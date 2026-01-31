#!/usr/bin/env python3
"""
Example usage of the solar system simulation
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.physics.nbody import Body, SymplecticIntegrator
import numpy as np


def example_two_body():
    """Example: Simple two-body problem (Sun-Earth)"""
    print("=" * 60)
    print("Example 1: Sun-Earth Two-Body Problem")
    print("=" * 60)
    
    # Create Sun and Earth
    sun = Body(
        name='Sun',
        mass=1.989e30,
        GM=1.32712440018e11,
        radius=696000,
        position=np.array([0.0, 0.0, 0.0]),
        velocity=np.array([0.0, 0.0, 0.0])
    )
    
    earth = Body(
        name='Earth',
        mass=5.972e24,
        GM=398600.435436,
        radius=6371.0,
        position=np.array([1.496e8, 0.0, 0.0]),  # 1 AU
        velocity=np.array([0.0, 29.78, 0.0])  # Orbital velocity
    )
    
    # Create integrator
    bodies = [sun, earth]
    integrator = SymplecticIntegrator(bodies, dt=86400)  # 1 day timestep
    
    # Run for 1 year
    initial_energy = integrator.get_total_energy()
    print(f"\nInitial energy: {initial_energy:.6e} J")
    
    for step in range(365):
        integrator.step_kdk()
        if step % 73 == 0:  # Print every ~2.4 months
            r = np.linalg.norm(earth.position)
            v = np.linalg.norm(earth.velocity)
            print(f"Day {step:3d}: r = {r/1e8:.4f} AU, v = {v:.2f} km/s")
    
    final_energy = integrator.get_total_energy()
    print(f"\nFinal energy: {final_energy:.6e} J")
    print(f"Energy drift: {abs(final_energy - initial_energy)/abs(initial_energy)*100:.6f}%")


if __name__ == '__main__':
    example_two_body()
    print("\nTo run full simulation: python simulate.py --no-render --steps 100")
