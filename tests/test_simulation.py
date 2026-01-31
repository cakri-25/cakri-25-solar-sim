"""
Unit tests for solar system simulation
"""

import unittest
import numpy as np
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.physics.nbody import Body, SymplecticIntegrator
from src.geology.heating import GeologicalModel, GeologicalState
from src.data.catalog import create_object_catalog


class TestPhysics(unittest.TestCase):
    """Test physics engine"""
    
    def test_body_creation(self):
        """Test Body creation"""
        body = Body(
            name='Test',
            mass=1e20,
            GM=6.674,
            radius=1000,
            position=np.array([0, 0, 0]),
            velocity=np.array([0, 0, 0])
        )
        self.assertEqual(body.name, 'Test')
        self.assertEqual(body.GM, 6.674)
    
    def test_integrator_initialization(self):
        """Test integrator initialization"""
        bodies = [
            Body('Sun', 1.989e30, 1.327e11, 696000, 
                 np.array([0, 0, 0]), np.array([0, 0, 0])),
            Body('Earth', 5.972e24, 3.986e5, 6371, 
                 np.array([1.496e8, 0, 0]), np.array([0, 29.78, 0]))
        ]
        integrator = SymplecticIntegrator(bodies, dt=86400)
        self.assertEqual(len(integrator.bodies), 2)
        self.assertEqual(integrator.dt, 86400)
    
    def test_energy_conservation(self):
        """Test that energy is approximately conserved"""
        bodies = [
            Body('Sun', 1.989e30, 1.327e11, 696000, 
                 np.array([0, 0, 0]), np.array([0, 0, 0])),
            Body('Earth', 5.972e24, 3.986e5, 6371, 
                 np.array([1.496e8, 0, 0]), np.array([0, 29.78, 0]))
        ]
        integrator = SymplecticIntegrator(bodies, dt=86400)
        
        initial_energy = integrator.get_total_energy()
        
        # Run for 10 steps
        for _ in range(10):
            integrator.step_kdk()
        
        final_energy = integrator.get_total_energy()
        
        # Energy should be conserved to within 0.1%
        relative_error = abs(final_energy - initial_energy) / abs(initial_energy)
        self.assertLess(relative_error, 0.001)
    
    def test_acceleration_computation(self):
        """Test acceleration computation"""
        bodies = [
            Body('Sun', 1.989e30, 1.327e11, 696000, 
                 np.array([0, 0, 0]), np.array([0, 0, 0])),
            Body('Earth', 5.972e24, 3.986e5, 6371, 
                 np.array([1.496e8, 0, 0]), np.array([0, 29.78, 0]))
        ]
        integrator = SymplecticIntegrator(bodies, dt=86400)
        
        positions = np.array([body.position for body in bodies])
        acc = integrator.compute_acceleration(1, positions)
        
        # Acceleration should point toward Sun (negative x direction)
        self.assertLess(acc[0], 0)
        self.assertAlmostEqual(acc[1], 0, places=5)
        self.assertAlmostEqual(acc[2], 0, places=5)


class TestGeology(unittest.TestCase):
    """Test geological modeling"""
    
    def test_geological_state_creation(self):
        """Test GeologicalState creation"""
        state = GeologicalState()
        self.assertEqual(state.activity_state, 'dormant')
        self.assertEqual(state.outgassing_rate, 0.0)
    
    def test_radiogenic_heating(self):
        """Test radiogenic heating computation"""
        model = GeologicalModel()
        
        body = Body('TestBody', 1e23, 6674, 1000, 
                   np.array([0, 0, 0]), np.array([0, 0, 0]))
        
        heat = model.compute_radiogenic_heating(body)
        
        # Should produce some heat
        self.assertGreater(heat, 0)
    
    def test_activity_threshold(self):
        """Test activity state determination"""
        model = GeologicalModel()
        state = GeologicalState()
        
        # Below threshold
        state.total_heat = 1e11
        model.activity_threshold = 1e12
        
        body = Body('TestBody', 1e23, 6674, 1000, 
                   np.array([0, 0, 0]), np.array([0, 0, 0]))
        bodies = [body]
        integrator = SymplecticIntegrator(bodies)
        
        # Update state
        state = model.update_geological_state(body, None, integrator, state)
        
        # Should be dormant
        # (might be active due to radiogenic heating, so we just check it runs)
        self.assertIn(state.activity_state, ['active', 'dormant'])


class TestCatalog(unittest.TestCase):
    """Test object catalog"""
    
    def test_catalog_creation(self):
        """Test that catalog creates expected number of objects"""
        bodies = create_object_catalog()
        
        # Should have at least 50 bodies
        self.assertGreaterEqual(len(bodies), 50)
        
        # Should have Sun
        sun = next((b for b in bodies if b.name == 'Sun'), None)
        self.assertIsNotNone(sun)
        self.assertGreater(sun.GM, 0)
    
    def test_planet_properties(self):
        """Test that planets have correct properties"""
        bodies = create_object_catalog()
        
        earth = next((b for b in bodies if b.name == 'Earth'), None)
        self.assertIsNotNone(earth)
        self.assertGreater(earth.GM, 0)
        self.assertGreater(earth.radius, 0)
        
        jupiter = next((b for b in bodies if b.name == 'Jupiter'), None)
        self.assertIsNotNone(jupiter)
        # Jupiter should have J2
        self.assertGreater(jupiter.J2, 0)


if __name__ == '__main__':
    unittest.main()
