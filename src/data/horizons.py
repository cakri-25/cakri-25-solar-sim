"""
JPL Horizons and SBDB data fetcher
Retrieves state vectors, GM values, and radii for celestial objects
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import numpy as np


class HorizonsClient:
    """Client for JPL Horizons API"""
    
    BASE_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
    
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
    
    def get_state_vector(self, body_id: str, epoch: str = None) -> Dict:
        """
        Get state vector (position and velocity) for a body
        
        Args:
            body_id: JPL body ID (e.g., '199' for Mercury, '10' for Sun)
            epoch: Epoch time (default: current time)
        
        Returns:
            Dictionary with position (km), velocity (km/s), and metadata
        """
        if epoch is None:
            epoch = datetime.now().strftime("%Y-%m-%d")
        
        # Check cache
        cache_file = os.path.join(self.cache_dir, f"horizons_{body_id}_{epoch}.json")
        if os.path.exists(cache_file):
            with open(cache_file, 'r') as f:
                return json.load(f)
        
        params = {
            'format': 'json',
            'COMMAND': f"'{body_id}'",
            'EPHEM_TYPE': 'VECTORS',
            'CENTER': "'@0'",  # Solar System Barycenter
            'START_TIME': f"'{epoch}'",
            'STOP_TIME': f"'{epoch}'",
            'STEP_SIZE': "'1d'",
            'VEC_TABLE': "'2'",  # State vectors
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Parse the result
            result = self._parse_horizons_response(data)
            
            # Cache the result
            with open(cache_file, 'w') as f:
                json.dump(result, f)
            
            return result
        except Exception as e:
            print(f"Warning: Could not fetch from Horizons for {body_id}: {e}")
            return self._get_fallback_data(body_id)
    
    def _parse_horizons_response(self, data: Dict) -> Dict:
        """Parse Horizons API response"""
        result_text = data.get('result', '')
        
        # Extract state vectors from result
        # This is a simplified parser - real implementation would be more robust
        lines = result_text.split('\n')
        
        state = {
            'position': [0.0, 0.0, 0.0],  # km
            'velocity': [0.0, 0.0, 0.0],  # km/s
            'epoch': None
        }
        
        # Look for vector data in the response
        for i, line in enumerate(lines):
            if 'X =' in line or 'X=' in line:
                # Extract position
                try:
                    parts = line.split()
                    x_idx = next(j for j, p in enumerate(parts) if 'X' in p)
                    state['position'][0] = float(parts[x_idx + 1])
                    
                    if i + 1 < len(lines):
                        y_line = lines[i + 1]
                        y_parts = y_line.split()
                        y_idx = next(j for j, p in enumerate(y_parts) if 'Y' in p)
                        state['position'][1] = float(y_parts[y_idx + 1])
                    
                    if i + 2 < len(lines):
                        z_line = lines[i + 2]
                        z_parts = z_line.split()
                        z_idx = next(j for j, p in enumerate(z_parts) if 'Z' in p)
                        state['position'][2] = float(z_parts[z_idx + 1])
                except Exception:
                    pass
            
            if 'VX=' in line or 'VX =' in line:
                # Extract velocity
                try:
                    parts = line.split()
                    vx_idx = next(j for j, p in enumerate(parts) if 'VX' in p)
                    state['velocity'][0] = float(parts[vx_idx + 1])
                    
                    if i + 1 < len(lines):
                        vy_line = lines[i + 1]
                        vy_parts = vy_line.split()
                        vy_idx = next(j for j, p in enumerate(vy_parts) if 'VY' in p)
                        state['velocity'][1] = float(vy_parts[vy_idx + 1])
                    
                    if i + 2 < len(lines):
                        vz_line = lines[i + 2]
                        vz_parts = vz_line.split()
                        vz_idx = next(j for j, p in enumerate(vz_parts) if 'VZ' in p)
                        state['velocity'][2] = float(vz_parts[vz_idx + 1])
                except Exception:
                    pass
        
        return state
    
    def _get_fallback_data(self, body_id: str) -> Dict:
        """Get fallback orbital data when API is unavailable"""
        # Simplified orbital elements for major bodies (approximate)
        fallback = {
            '10': {'position': [0, 0, 0], 'velocity': [0, 0, 0]},  # Sun at origin
            '199': {'position': [5.79e7, 0, 0], 'velocity': [0, 47.87, 0]},  # Mercury
            '299': {'position': [1.082e8, 0, 0], 'velocity': [0, 35.02, 0]},  # Venus
            '399': {'position': [1.496e8, 0, 0], 'velocity': [0, 29.78, 0]},  # Earth
            '499': {'position': [2.279e8, 0, 0], 'velocity': [0, 24.07, 0]},  # Mars
            '599': {'position': [7.786e8, 0, 0], 'velocity': [0, 13.07, 0]},  # Jupiter
            '699': {'position': [1.434e9, 0, 0], 'velocity': [0, 9.69, 0]},  # Saturn
            '799': {'position': [2.871e9, 0, 0], 'velocity': [0, 6.81, 0]},  # Uranus
            '899': {'position': [4.495e9, 0, 0], 'velocity': [0, 5.43, 0]},  # Neptune
        }
        
        return fallback.get(body_id, {'position': [0, 0, 0], 'velocity': [0, 0, 0]})


class SBDBClient:
    """Client for JPL Small-Body Database API"""
    
    BASE_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"
    
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
    
    def get_body_params(self, designation: str) -> Dict:
        """
        Get physical parameters for a small body
        
        Args:
            designation: Small body designation (e.g., 'Ceres', '433')
        
        Returns:
            Dictionary with GM, radius, and other parameters
        """
        cache_file = os.path.join(self.cache_dir, f"sbdb_{designation}.json")
        if os.path.exists(cache_file):
            with open(cache_file, 'r') as f:
                return json.load(f)
        
        params = {
            'sstr': designation,
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            result = self._parse_sbdb_response(data)
            
            # Cache the result
            with open(cache_file, 'w') as f:
                json.dump(result, f)
            
            return result
        except Exception as e:
            print(f"Warning: Could not fetch from SBDB for {designation}: {e}")
            return self._get_fallback_params(designation)
    
    def _parse_sbdb_response(self, data: Dict) -> Dict:
        """Parse SBDB API response"""
        phys_par = data.get('phys_par', {})
        
        result = {
            'GM': None,  # km^3/s^2
            'radius': None,  # km
            'density': None,  # g/cm^3
            'mass': None,  # kg
        }
        
        # Extract available parameters
        if phys_par:
            for param in phys_par:
                name = param.get('name', '')
                value = param.get('value')
                
                if 'GM' in name and value:
                    result['GM'] = float(value)
                elif 'diameter' in name.lower() and value:
                    result['radius'] = float(value) / 2  # Convert diameter to radius
                elif 'density' in name.lower() and value:
                    result['density'] = float(value)
        
        return result
    
    def _get_fallback_params(self, designation: str) -> Dict:
        """Get fallback parameters when API is unavailable"""
        # Approximate values for common objects
        fallback = {
            'Ceres': {'GM': 62.6284, 'radius': 473, 'density': 2.16},
            'Pluto': {'GM': 869.6, 'radius': 1188.3, 'density': 1.854},
            'Eris': {'GM': 1108, 'radius': 1163, 'density': 2.52},
        }
        
        return fallback.get(designation, {'GM': 0.001, 'radius': 10, 'density': 2.0})


class BodyDatabase:
    """Database of celestial bodies with their properties"""
    
    def __init__(self):
        self.horizons = HorizonsClient()
        self.sbdb = SBDBClient()
        self.bodies = {}
        self._init_standard_bodies()
    
    def _init_standard_bodies(self):
        """Initialize database with standard celestial bodies"""
        
        # Physical parameters (GM in km^3/s^2, radius in km, J2 dimensionless)
        self.bodies = {
            # Sun
            'Sun': {
                'id': '10',
                'GM': 1.32712440018e11,
                'radius': 696000,
                'J2': 0.0,
                'type': 'star'
            },
            # Planets
            'Mercury': {
                'id': '199',
                'GM': 22032.09,
                'radius': 2439.7,
                'J2': 0.00006,
                'type': 'planet'
            },
            'Venus': {
                'id': '299',
                'GM': 324858.592,
                'radius': 6051.8,
                'J2': 0.000027,
                'type': 'planet'
            },
            'Earth': {
                'id': '399',
                'GM': 398600.435436,
                'radius': 6371.0,
                'J2': 0.00108263,
                'type': 'planet'
            },
            'Mars': {
                'id': '499',
                'GM': 42828.375214,
                'radius': 3389.5,
                'J2': 0.001964,
                'type': 'planet'
            },
            'Jupiter': {
                'id': '599',
                'GM': 126686534.92,
                'radius': 69911,
                'J2': 0.01475,  # Significant J2 for gas giant
                'type': 'planet'
            },
            'Saturn': {
                'id': '699',
                'GM': 37931187.0,
                'radius': 58232,
                'J2': 0.01645,  # Significant J2 for gas giant
                'type': 'planet'
            },
            'Uranus': {
                'id': '799',
                'GM': 5793939.0,
                'radius': 25362,
                'J2': 0.012,  # Significant J2 for ice giant
                'type': 'planet'
            },
            'Neptune': {
                'id': '899',
                'GM': 6836529.0,
                'radius': 24622,
                'J2': 0.004,  # J2 for ice giant
                'type': 'planet'
            },
            # Major moons
            'Moon': {
                'id': '301',
                'GM': 4902.801,
                'radius': 1737.4,
                'J2': 0.0002027,
                'type': 'moon',
                'parent': 'Earth'
            },
            'Io': {
                'id': '501',
                'GM': 5959.916,
                'radius': 1821.6,
                'J2': 0.0,
                'type': 'moon',
                'parent': 'Jupiter',
                'tidal_active': True
            },
            'Europa': {
                'id': '502',
                'GM': 3202.739,
                'radius': 1560.8,
                'J2': 0.0,
                'type': 'moon',
                'parent': 'Jupiter',
                'tidal_active': True
            },
            'Ganymede': {
                'id': '503',
                'GM': 9887.834,
                'radius': 2634.1,
                'J2': 0.0,
                'type': 'moon',
                'parent': 'Jupiter'
            },
            'Callisto': {
                'id': '504',
                'GM': 7179.289,
                'radius': 2410.3,
                'J2': 0.0,
                'type': 'moon',
                'parent': 'Jupiter'
            },
            'Titan': {
                'id': '606',
                'GM': 8978.14,
                'radius': 2574.73,
                'J2': 0.0,
                'type': 'moon',
                'parent': 'Saturn'
            },
            'Enceladus': {
                'id': '602',
                'GM': 7.211,
                'radius': 252.1,
                'J2': 0.0,
                'type': 'moon',
                'parent': 'Saturn',
                'tidal_active': True,
                'outgassing': True
            },
            # Dwarf planets
            'Pluto': {
                'id': '999',
                'GM': 869.6,
                'radius': 1188.3,
                'J2': 0.0,
                'type': 'dwarf_planet'
            },
            'Ceres': {
                'id': '2000001',
                'GM': 62.6284,
                'radius': 473,
                'J2': 0.0,
                'type': 'dwarf_planet'
            },
            'Eris': {
                'id': '2136199',
                'GM': 1108,
                'radius': 1163,
                'J2': 0.0,
                'type': 'dwarf_planet'
            },
        }
    
    def get_body(self, name: str) -> Dict:
        """Get body parameters by name"""
        return self.bodies.get(name, {})
    
    def get_all_bodies(self) -> Dict:
        """Get all bodies in database"""
        return self.bodies
