#!/usr/bin/env python3
"""
Solar System N-Body Simulation
Main simulation script

Features:
- 3D physics with 2D rendering
- N-body gravity with symplectic integration (leapfrog/KDK)
- Adaptive timesteps and substeps for close approaches
- J2 oblateness for gas giants
- General Relativity 1PN correction for Sun
- Radiogenic and tidal heating
- Geological activity and outgassing with reaction forces
- Error validation against JPL Horizons
- 50+ objects: planets, moons, dwarf planets, comets, NEAs
"""

import sys
import os
import numpy as np
from typing import List, Dict

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.physics.nbody import Body, SymplecticIntegrator
from src.geology.heating import GeologicalModel, GeologicalState
from src.data.horizons import BodyDatabase, HorizonsClient
from src.data.catalog import create_object_catalog
from src.data.validator import ErrorValidator
from src.rendering.display import Renderer2D


class SolarSystemSimulation:
    """Main simulation controller"""
    
    def __init__(self, 
                 use_rendering: bool = True,
                 validation_enabled: bool = True,
                 timestep_days: float = 1.0):
        """
        Initialize simulation
        
        Args:
            use_rendering: Enable 2D visualization
            validation_enabled: Enable error validation against Horizons
            timestep_days: Base timestep in days
        """
        print("Initializing Solar System Simulation...")
        
        # Initialize data sources
        self.body_db = BodyDatabase()
        self.horizons = HorizonsClient()
        
        # Create object catalog
        print("\nCreating object catalog...")
        self.bodies = create_object_catalog(self.body_db)
        
        # Initialize physics engine
        timestep_seconds = timestep_days * 86400
        print(f"\nInitializing physics engine (timestep: {timestep_days} days)...")
        self.integrator = SymplecticIntegrator(self.bodies, dt=timestep_seconds)
        
        # Initialize geological model
        print("Initializing geological model...")
        self.geo_model = GeologicalModel()
        self.geo_states = {body.name: GeologicalState() for body in self.bodies}
        
        # Initialize validator
        self.validation_enabled = validation_enabled
        if validation_enabled:
            print("Initializing error validator...")
            self.validator = ErrorValidator(self.horizons)
        else:
            self.validator = None
        
        # Initialize renderer
        self.use_rendering = use_rendering
        if use_rendering:
            print("Initializing 2D renderer...")
            self.renderer = Renderer2D()
        else:
            self.renderer = None
        
        # Simulation state
        self.paused = False
        self.running = True
        self.epoch_start = "2024-01-01"
        
        print("\nSimulation initialized successfully!")
        print(f"Total bodies: {len(self.bodies)}")
        print(f"Rendering: {'Enabled' if use_rendering else 'Disabled'}")
        print(f"Validation: {'Enabled' if validation_enabled else 'Disabled'}")
    
    def update_geology(self, dt: float):
        """Update geological states for all bodies"""
        # Find parent bodies
        parent_map = {}
        for body in self.bodies:
            parent_map[body.name] = body
        
        for body in self.bodies:
            # Get parent body if exists
            parent_body = None
            if hasattr(body, 'parent') and body.parent:
                parent_body = parent_map.get(body.parent)
            
            # Update geological state
            geo_state = self.geo_states[body.name]
            self.geo_model.update_geological_state(
                body, parent_body, self.integrator, geo_state
            )
            
            # Update body activity state
            body.activity_state = geo_state.activity_state
            
            # Apply outgassing forces
            if geo_state.outgassing_rate > 0:
                self.geo_model.apply_outgassing_force(body, geo_state, dt)
    
    def step(self):
        """Perform one simulation step"""
        # Use adaptive timestep
        dt = self.integrator.adaptive_step()
        
        # Update geology every step
        self.update_geology(dt)
        
        # Periodic validation
        if self.validation_enabled and self.validator.should_validate(self.integrator.time):
            self.validator.perform_validation(
                self.bodies, 
                self.integrator.time, 
                self.epoch_start
            )
    
    def run(self, duration_days: float = None, max_steps: int = None):
        """
        Run simulation
        
        Args:
            duration_days: Simulation duration in days (None = indefinite)
            max_steps: Maximum number of steps (None = indefinite)
        """
        print(f"\nStarting simulation...")
        if duration_days:
            print(f"Duration: {duration_days} days ({duration_days/365.25:.2f} years)")
        if max_steps:
            print(f"Max steps: {max_steps}")
        
        print("\nControls:")
        print("  Space: Pause/Resume")
        print("  Arrow keys: Pan camera")
        print("  +/-: Zoom in/out")
        print("  L: Toggle labels")
        print("  O: Toggle orbit trails")
        print("  I: Toggle info panel")
        print("  ESC: Quit")
        print("\nRunning...\n")
        
        step_count = 0
        
        while self.running:
            # Handle events
            if self.use_rendering:
                events = self.renderer.handle_events()
                
                if events['quit']:
                    self.running = False
                    break
                
                if events['pause']:
                    self.paused = not self.paused
                    print(f"Simulation {'paused' if self.paused else 'resumed'}")
                
                if events['step'] and self.paused:
                    self.step()
                    step_count += 1
            
            # Simulation step
            if not self.paused:
                self.step()
                step_count += 1
                
                # Print progress
                if step_count % 100 == 0:
                    years = self.integrator.time / (86400 * 365.25)
                    energy = self.integrator.get_total_energy()
                    print(f"Step {step_count}: {years:.3f} years, Energy: {energy:.3e} J")
            
            # Render
            if self.use_rendering:
                energy = self.integrator.get_total_energy()
                self.renderer.render(self.bodies, self.integrator.time, energy)
            
            # Check termination conditions
            if duration_days and self.integrator.time >= duration_days * 86400:
                print(f"\nReached target duration: {duration_days} days")
                break
            
            if max_steps and step_count >= max_steps:
                print(f"\nReached maximum steps: {max_steps}")
                break
        
        # Cleanup
        self.cleanup()
    
    def cleanup(self):
        """Cleanup and save results"""
        print("\n" + "="*60)
        print("Simulation Complete")
        print("="*60)
        
        # Print final statistics
        years = self.integrator.time / (86400 * 365.25)
        print(f"\nSimulation time: {years:.3f} years")
        
        energy = self.integrator.get_total_energy()
        momentum = self.integrator.get_total_momentum()
        print(f"Final energy: {energy:.3e} J")
        print(f"Final momentum: {np.linalg.norm(momentum):.3e} kg·km/s")
        
        # Active bodies
        active_bodies = [b.name for b in self.bodies 
                        if hasattr(b, 'activity_state') and b.activity_state == 'active']
        print(f"\nActive bodies: {len(active_bodies)}")
        if active_bodies:
            print("  " + ", ".join(active_bodies))
        
        # Outgassing summary
        total_mass_loss = sum(
            self.geo_states[b.name].mass_loss_total 
            for b in self.bodies
        )
        print(f"\nTotal mass loss from outgassing: {total_mass_loss:.3e} kg")
        
        # Validation statistics
        if self.validation_enabled:
            stats = self.validator.get_error_statistics()
            if stats:
                print(f"\nValidation Statistics:")
                print(f"  Number of validations: {stats['num_validations']}")
                if stats['overall_mean_error']:
                    print(f"  Overall mean error: {stats['overall_mean_error']:.2f} km")
                if stats['overall_rms_error']:
                    print(f"  Overall RMS error: {stats['overall_rms_error']:.2f} km")
                if stats['worst_max_error']:
                    print(f"  Worst max error: {stats['worst_max_error']:.2f} km")
            
            # Save validation history
            self.validator.save_validation_history()
        
        # Cleanup renderer
        if self.use_rendering:
            self.renderer.cleanup()
        
        print("\nThank you for using Solar System Simulation!")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Solar System N-Body Simulation with 3D physics and 2D rendering'
    )
    parser.add_argument('--no-render', action='store_true',
                       help='Disable 2D rendering (headless mode)')
    parser.add_argument('--no-validate', action='store_true',
                       help='Disable error validation against JPL Horizons')
    parser.add_argument('--timestep', type=float, default=1.0,
                       help='Base timestep in days (default: 1.0)')
    parser.add_argument('--duration', type=float, default=None,
                       help='Simulation duration in days')
    parser.add_argument('--steps', type=int, default=None,
                       help='Maximum number of simulation steps')
    
    args = parser.parse_args()
    
    # Create and run simulation
    sim = SolarSystemSimulation(
        use_rendering=not args.no_render,
        validation_enabled=not args.no_validate,
        timestep_days=args.timestep
    )
    
    sim.run(duration_days=args.duration, max_steps=args.steps)


if __name__ == '__main__':
    main()
