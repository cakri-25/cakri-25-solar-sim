"""
Error validation against JPL Horizons data
Periodically compares simulation positions with actual ephemeris
"""

import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import json
import os


class ErrorValidator:
    """
    Validates simulation accuracy against JPL Horizons
    """
    
    def __init__(self, horizons_client, output_dir: str = "validation"):
        """
        Initialize validator
        
        Args:
            horizons_client: HorizonsClient instance
            output_dir: Directory for validation reports
        """
        self.horizons = horizons_client
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        self.validation_history = []
        self.validation_interval = 86400 * 30  # 30 days in seconds
        self.last_validation_time = 0
    
    def validate_positions(self, bodies: List, simulation_time: float, 
                          epoch_start: str) -> Dict[str, float]:
        """
        Validate current positions against Horizons
        
        Args:
            bodies: List of Body objects
            simulation_time: Current simulation time (seconds)
            epoch_start: Starting epoch as date string
        
        Returns:
            Dictionary of body names to position errors (km)
        """
        errors = {}
        
        # Calculate current epoch
        start_date = datetime.strptime(epoch_start, "%Y-%m-%d")
        current_date = start_date + timedelta(seconds=simulation_time)
        epoch_str = current_date.strftime("%Y-%m-%d")
        
        for body in bodies:
            # Skip if no Horizons ID
            if not hasattr(body, 'horizons_id'):
                continue
            
            try:
                # Get reference position from Horizons
                horizons_data = self.horizons.get_state_vector(body.horizons_id, epoch_str)
                ref_position = np.array(horizons_data['position'])
                
                # Compare with simulation position
                sim_position = body.position
                error = np.linalg.norm(sim_position - ref_position)
                
                errors[body.name] = error
                
            except Exception as e:
                print(f"Warning: Could not validate {body.name}: {e}")
                errors[body.name] = None
        
        return errors
    
    def should_validate(self, simulation_time: float) -> bool:
        """Check if validation should be performed"""
        return (simulation_time - self.last_validation_time) >= self.validation_interval
    
    def perform_validation(self, bodies: List, simulation_time: float, 
                          epoch_start: str) -> Dict:
        """
        Perform full validation and log results
        
        Args:
            bodies: List of Body objects
            simulation_time: Current simulation time (seconds)
            epoch_start: Starting epoch
        
        Returns:
            Validation report dictionary
        """
        errors = self.validate_positions(bodies, simulation_time, epoch_start)
        
        # Calculate statistics
        valid_errors = [e for e in errors.values() if e is not None]
        
        report = {
            'simulation_time': simulation_time,
            'time_days': simulation_time / 86400,
            'errors': errors,
            'mean_error': np.mean(valid_errors) if valid_errors else None,
            'max_error': np.max(valid_errors) if valid_errors else None,
            'rms_error': np.sqrt(np.mean(np.array(valid_errors)**2)) if valid_errors else None,
        }
        
        # Log report
        self.validation_history.append(report)
        self.last_validation_time = simulation_time
        
        # Print summary
        if report['mean_error'] is not None:
            print(f"\n=== Validation at day {report['time_days']:.1f} ===")
            print(f"Mean error: {report['mean_error']:.2f} km")
            print(f"RMS error: {report['rms_error']:.2f} km")
            print(f"Max error: {report['max_error']:.2f} km")
            
            # Show top errors
            sorted_errors = sorted([(k, v) for k, v in errors.items() if v is not None],
                                 key=lambda x: x[1], reverse=True)
            print("\nTop errors:")
            for name, error in sorted_errors[:5]:
                print(f"  {name}: {error:.2f} km")
        
        return report
    
    def save_validation_history(self):
        """Save validation history to file"""
        output_file = os.path.join(self.output_dir, "validation_history.json")
        with open(output_file, 'w') as f:
            json.dump(self.validation_history, f, indent=2)
        print(f"\nValidation history saved to {output_file}")
    
    def get_error_statistics(self) -> Dict:
        """Get overall error statistics"""
        if not self.validation_history:
            return {}
        
        mean_errors = [r['mean_error'] for r in self.validation_history 
                      if r['mean_error'] is not None]
        rms_errors = [r['rms_error'] for r in self.validation_history 
                     if r['rms_error'] is not None]
        max_errors = [r['max_error'] for r in self.validation_history 
                     if r['max_error'] is not None]
        
        stats = {
            'overall_mean_error': np.mean(mean_errors) if mean_errors else None,
            'overall_rms_error': np.mean(rms_errors) if rms_errors else None,
            'worst_max_error': np.max(max_errors) if max_errors else None,
            'num_validations': len(self.validation_history),
        }
        
        return stats
