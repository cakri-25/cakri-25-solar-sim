"""
2D rendering system for 3D simulation
Uses pygame for visualization
"""

import pygame
import numpy as np
from typing import List, Dict, Tuple
import sys


class Renderer2D:
    """
    2D renderer for 3D solar system simulation
    Projects 3D positions onto 2D screen
    """
    
    def __init__(self, width: int = 1280, height: int = 720, scale: float = 1e-9):
        """
        Initialize renderer
        
        Args:
            width: Screen width in pixels
            height: Screen height in pixels
            scale: Scale factor (km to pixels)
        """
        pygame.init()
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption("Solar System N-Body Simulation")
        
        self.scale = scale  # km to pixels
        self.offset = np.array([width / 2, height / 2])
        
        # Camera control
        self.camera_pos = np.array([0.0, 0.0, 0.0])
        self.zoom = 1.0
        
        # Colors
        self.colors = {
            'Sun': (255, 255, 0),
            'Mercury': (169, 169, 169),
            'Venus': (255, 198, 73),
            'Earth': (100, 149, 237),
            'Mars': (188, 39, 50),
            'Jupiter': (201, 152, 101),
            'Saturn': (250, 227, 171),
            'Uranus': (173, 216, 230),
            'Neptune': (62, 84, 232),
            'Moon': (192, 192, 192),
            'Pluto': (205, 192, 176),
            'default': (200, 200, 200),
        }
        
        # Font for labels
        self.font = pygame.font.Font(None, 20)
        self.info_font = pygame.font.Font(None, 24)
        
        # Display options
        self.show_labels = True
        self.show_orbits = True
        self.show_info = True
        
        # Orbit trails
        self.orbit_trails = {}
        self.max_trail_length = 500
        
        # Clock for FPS
        self.clock = pygame.time.Clock()
        self.fps = 60
    
    def world_to_screen(self, pos_3d: np.ndarray) -> Tuple[int, int]:
        """
        Convert 3D world coordinates to 2D screen coordinates
        
        Projects onto XY plane (top-down view)
        
        Args:
            pos_3d: 3D position in km
        
        Returns:
            (x, y) screen coordinates in pixels
        """
        # Project to XY plane
        x = pos_3d[0]
        y = pos_3d[1]
        
        # Apply camera offset and zoom
        x -= self.camera_pos[0]
        y -= self.camera_pos[1]
        
        # Scale to screen coordinates
        screen_x = int(self.offset[0] + x * self.scale * self.zoom)
        screen_y = int(self.offset[1] - y * self.scale * self.zoom)  # Flip Y
        
        return (screen_x, screen_y)
    
    def get_body_color(self, body_name: str) -> Tuple[int, int, int]:
        """Get color for a body"""
        return self.colors.get(body_name, self.colors['default'])
    
    def get_body_radius(self, body) -> int:
        """Get display radius for a body"""
        # Scale radius, with minimum size for visibility
        display_radius = max(2, int(body.radius * self.scale * self.zoom))
        
        # Cap maximum size
        display_radius = min(display_radius, 50)
        
        # Special case for Sun
        if body.name == 'Sun':
            display_radius = max(display_radius, 15)
        
        return display_radius
    
    def draw_body(self, body):
        """Draw a celestial body"""
        pos = self.world_to_screen(body.position)
        color = self.get_body_color(body.name)
        radius = self.get_body_radius(body)
        
        # Check if on screen
        if (0 <= pos[0] <= self.width and 0 <= pos[1] <= self.height):
            pygame.draw.circle(self.screen, color, pos, radius)
            
            # Highlight if active
            if hasattr(body, 'activity_state') and body.activity_state == 'active':
                pygame.draw.circle(self.screen, (255, 100, 100), pos, radius + 3, 2)
            
            # Draw label
            if self.show_labels:
                label = self.font.render(body.name, True, (200, 200, 200))
                self.screen.blit(label, (pos[0] + radius + 5, pos[1] - 10))
        
        # Update orbit trail
        if body.name not in self.orbit_trails:
            self.orbit_trails[body.name] = []
        
        self.orbit_trails[body.name].append(pos)
        
        # Limit trail length
        if len(self.orbit_trails[body.name]) > self.max_trail_length:
            self.orbit_trails[body.name].pop(0)
    
    def draw_orbit_trails(self):
        """Draw orbit trails for all bodies"""
        if not self.show_orbits:
            return
        
        for body_name, trail in self.orbit_trails.items():
            if len(trail) > 1:
                color = self.colors.get(body_name, self.colors['default'])
                # Draw trail with simple line segments
                for i in range(len(trail) - 1):
                    if (0 <= trail[i][0] <= self.width and 
                        0 <= trail[i][1] <= self.height and
                        0 <= trail[i+1][0] <= self.width and 
                        0 <= trail[i+1][1] <= self.height):
                        pygame.draw.line(self.screen, color, trail[i], trail[i+1], 1)
    
    def draw_info_panel(self, simulation_time: float, energy: float, 
                       active_bodies: List[str]):
        """Draw information panel"""
        if not self.show_info:
            return
        
        # Background panel
        panel_rect = pygame.Rect(10, 10, 350, 150)
        pygame.draw.rect(self.screen, (0, 0, 0, 128), panel_rect)
        pygame.draw.rect(self.screen, (100, 100, 100), panel_rect, 2)
        
        # Simulation time
        days = simulation_time / 86400
        years = days / 365.25
        time_text = self.info_font.render(f"Time: {years:.2f} years ({days:.0f} days)", 
                                         True, (255, 255, 255))
        self.screen.blit(time_text, (20, 20))
        
        # Energy
        energy_text = self.info_font.render(f"Energy: {energy:.2e} J", 
                                           True, (255, 255, 255))
        self.screen.blit(energy_text, (20, 45))
        
        # Active bodies
        active_text = self.info_font.render(f"Active bodies: {len(active_bodies)}", 
                                           True, (255, 255, 255))
        self.screen.blit(active_text, (20, 70))
        
        if active_bodies:
            active_list = ", ".join(active_bodies[:3])
            if len(active_bodies) > 3:
                active_list += "..."
            active_names = self.font.render(active_list, True, (200, 200, 200))
            self.screen.blit(active_names, (20, 95))
        
        # Controls
        controls = self.font.render("Controls: Arrow keys=pan, +/-=zoom, Space=pause, L=labels, O=orbits", 
                                   True, (200, 200, 200))
        self.screen.blit(controls, (20, 120))
    
    def render(self, bodies: List, simulation_time: float, energy: float = 0.0):
        """
        Render the simulation
        
        Args:
            bodies: List of Body objects
            simulation_time: Current simulation time (seconds)
            energy: Total system energy
        """
        # Clear screen
        self.screen.fill((0, 0, 10))  # Dark blue background
        
        # Draw orbit trails
        self.draw_orbit_trails()
        
        # Draw bodies
        for body in bodies:
            self.draw_body(body)
        
        # Find active bodies
        active_bodies = [b.name for b in bodies 
                        if hasattr(b, 'activity_state') and b.activity_state == 'active']
        
        # Draw info panel
        self.draw_info_panel(simulation_time, energy, active_bodies)
        
        # Update display
        pygame.display.flip()
        self.clock.tick(self.fps)
    
    def handle_events(self) -> Dict[str, bool]:
        """
        Handle pygame events
        
        Returns:
            Dictionary with event flags
        """
        events = {
            'quit': False,
            'pause': False,
            'step': False,
        }
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                events['quit'] = True
            
            elif event.type == pygame.KEYDOWN:
                # Quit
                if event.key == pygame.K_ESCAPE:
                    events['quit'] = True
                
                # Pause/unpause
                elif event.key == pygame.K_SPACE:
                    events['pause'] = True
                
                # Step
                elif event.key == pygame.K_RETURN:
                    events['step'] = True
                
                # Toggle labels
                elif event.key == pygame.K_l:
                    self.show_labels = not self.show_labels
                
                # Toggle orbits
                elif event.key == pygame.K_o:
                    self.show_orbits = not self.show_orbits
                
                # Toggle info
                elif event.key == pygame.K_i:
                    self.show_info = not self.show_info
                
                # Camera controls
                elif event.key == pygame.K_UP:
                    self.camera_pos[1] += 1e8 / self.zoom
                elif event.key == pygame.K_DOWN:
                    self.camera_pos[1] -= 1e8 / self.zoom
                elif event.key == pygame.K_LEFT:
                    self.camera_pos[0] -= 1e8 / self.zoom
                elif event.key == pygame.K_RIGHT:
                    self.camera_pos[0] += 1e8 / self.zoom
                
                # Zoom
                elif event.key == pygame.K_EQUALS or event.key == pygame.K_PLUS:
                    self.zoom *= 1.2
                elif event.key == pygame.K_MINUS:
                    self.zoom /= 1.2
        
        return events
    
    def cleanup(self):
        """Cleanup pygame resources"""
        pygame.quit()
