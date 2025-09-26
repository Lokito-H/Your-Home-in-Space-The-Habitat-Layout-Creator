/**
 * Main Application Entry Point
 * Initializes and coordinates all components of the Habitat Layout Creator
 */

class HabitatApp {
    constructor() {
        this.designer = null;
        this.resourceCalculator = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        try {
            // Initialize resource calculator first
            this.resourceCalculator = new ResourceCalculator();
            window.resourceCalculator = this.resourceCalculator;

            // Initialize habitat designer
            this.designer = new HabitatDesigner();
            window.habitatDesigner = this.designer;

            // Setup additional event listeners
            this.setupAdditionalEventListeners();

            // Setup periodic updates
            this.setupPeriodicUpdates();

            // Show welcome message
            this.showWelcomeMessage();

            this.isInitialized = true;
            console.log('🚀 Habitat Layout Creator initialized successfully!');

        } catch (error) {
            console.error('Failed to initialize Habitat Layout Creator:', error);
            this.showErrorMessage('Failed to initialize application. Please refresh the page.');
        }
    }

    setupAdditionalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.designer) {
                this.designer.updateCanvasRect();
            }
        });

        // Handle visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppPause();
            } else {
                this.onAppResume();
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });

        // Handle errors
        window.addEventListener('error', (e) => {
            console.error('Application error:', e.error);
            this.showErrorMessage('An unexpected error occurred.');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            e.preventDefault();
        });
    }

    setupPeriodicUpdates() {
        // Update resources every 5 seconds (in case of any drift)
        setInterval(() => {
            if (this.designer && this.resourceCalculator) {
                this.resourceCalculator.updateResources(this.designer.modules);
            }
        }, 5000);

        // Auto-save every 30 seconds if there are modules
        setInterval(() => {
            if (this.designer && this.designer.modules.length > 0) {
                this.autoSave();
            }
        }, 30000);
    }

    handleGlobalKeyboard(e) {
        // Handle global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    if (this.designer) {
                        this.designer.saveHabitat();
                    }
                    break;
                case 'l':
                    e.preventDefault();
                    if (this.designer) {
                        this.designer.loadHabitat();
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    if (this.designer) {
                        this.designer.exportHabitat();
                    }
                    break;
                case 'g':
                    e.preventDefault();
                    if (this.designer) {
                        this.designer.toggleGrid();
                    }
                    break;
                case 'z':
                    e.preventDefault();
                    // Could implement undo functionality here
                    break;
            }
        }

        // Help dialog
        if (e.key === 'F1' || (e.key === '?' && e.shiftKey)) {
            e.preventDefault();
            this.showHelpDialog();
        }
    }

    onAppPause() {
        // Save current state when app loses focus
        if (this.designer && this.designer.modules.length > 0) {
            this.autoSave();
        }
    }

    onAppResume() {
        // Refresh resource calculations when app regains focus
        if (this.designer && this.resourceCalculator) {
            this.resourceCalculator.updateResources(this.designer.modules);
        }
    }

    autoSave() {
        try {
            if (this.designer) {
                const habitatData = {
                    modules: this.designer.modules,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    autoSaved: true
                };

                localStorage.setItem('habitat-design-autosave', JSON.stringify(habitatData));
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    loadAutoSave() {
        try {
            const autoSavedData = localStorage.getItem('habitat-design-autosave');
            if (autoSavedData && this.designer) {
                const habitatData = JSON.parse(autoSavedData);
                
                if (confirm('An auto-saved design was found. Would you like to restore it?')) {
                    // Clear existing modules
                    this.designer.clearHabitat();
                    
                    // Load modules
                    habitatData.modules.forEach(moduleData => {
                        this.designer.modules.push(moduleData);
                        this.designer.createModuleElement(moduleData);
                    });

                    // Update next ID
                    if (this.designer.modules.length > 0) {
                        this.designer.nextModuleId = Math.max(...this.designer.modules.map(m => m.id)) + 1;
                    }

                    this.designer.updateResources();
                    this.designer.hideDropMessage();
                    this.showSuccessMessage('Auto-saved design restored!');
                }
            }
        } catch (error) {
            console.warn('Failed to load auto-save:', error);
        }
    }

    showWelcomeMessage() {
        // Check if this is the user's first visit
        const hasVisited = localStorage.getItem('habitat-creator-visited');
        
        if (!hasVisited) {
            setTimeout(() => {
                this.showInfoMessage(
                    '🚀 Welcome to the Habitat Layout Creator!\n\n' +
                    '• Drag modules from the left panel to design your space habitat\n' +
                    '• Monitor resources (power, oxygen, space) in real-time\n' +
                    '• Use keyboard shortcuts: Ctrl+S (save), Ctrl+L (load), Ctrl+G (grid)\n' +
                    '• Click on modules to select them, press Delete to remove\n\n' +
                    'Start by adding a Power Module and Living Quarters!'
                );
                localStorage.setItem('habitat-creator-visited', 'true');
            }, 1000);
        } else {
            // Check for auto-save
            setTimeout(() => {
                this.loadAutoSave();
            }, 500);
        }
    }

    showHelpDialog() {
        const helpContent = `
🚀 Habitat Layout Creator - Help

BASIC CONTROLS:
• Drag modules from the left panel to the canvas
• Click modules to select them
• Drag selected modules to move them
• Press Delete to remove selected modules

KEYBOARD SHORTCUTS:
• Ctrl+S: Save design
• Ctrl+L: Load design
• Ctrl+E: Export design
• Ctrl+G: Toggle grid
• F1 or Shift+?: Show help
• Escape: Deselect module

MODULE TYPES:
🏠 Living Quarters - Crew accommodation (4 people)
🔬 Laboratory - Research facility (2 people)
🌱 Greenhouse - Food production + oxygen generation
🔧 Workshop - Manufacturing and repairs
🎮 Recreation - Entertainment and social space
🚪 Airlock - EVA access point
⚡ Power Module - Energy generation
📦 Storage - Equipment and supplies

RESOURCE MANAGEMENT:
• Monitor power balance (generation vs consumption)
• Ensure positive oxygen production
• Watch space utilization efficiency
• Check safety alerts for critical issues

TIPS:
• Start with power modules and living quarters
• Add greenhouses for oxygen production
• Don't forget airlocks for EVA operations
• Balance crew capacity with life support
• Auto-save occurs every 30 seconds
        `;

        alert(helpContent);
    }

    // Utility methods for user feedback
    showSuccessMessage(message) {
        if (this.designer) {
            this.designer.showNotification(message, 'success');
        }
    }

    showErrorMessage(message) {
        if (this.designer) {
            this.designer.showNotification(message, 'error');
        }
    }

    showWarningMessage(message) {
        if (this.designer) {
            this.designer.showNotification(message, 'warning');
        }
    }

    showInfoMessage(message) {
        if (this.designer) {
            this.designer.showNotification(message, 'info');
        }
    }

    // API for external integrations
    getApplicationState() {
        if (!this.isInitialized) return null;

        return {
            modules: this.designer ? this.designer.modules : [],
            resources: this.resourceCalculator ? 
                this.resourceCalculator.generateEfficiencyReport(this.designer.modules) : null,
            isInitialized: this.isInitialized,
            version: '1.0'
        };
    }

    // Performance monitoring
    getPerformanceMetrics() {
        return {
            moduleCount: this.designer ? this.designer.modules.length : 0,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize the application when the script loads
const habitatApp = new HabitatApp();

// Make app available globally for debugging
window.habitatApp = habitatApp;

// Add some useful global utilities
window.exportHabitatImage = function() {
    // This could be extended to export the canvas as an image
    console.log('Image export not yet implemented');
};

window.showPerformanceStats = function() {
    console.log('Performance Stats:', habitatApp.getPerformanceMetrics());
    console.log('Application State:', habitatApp.getApplicationState());
};

// Add development helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Development mode detected');
    console.log('Available global functions:');
    console.log('- window.showPerformanceStats() - Show performance metrics');
    console.log('- window.habitatApp - Main application instance');
    console.log('- window.habitatDesigner - Designer instance');
    console.log('- window.resourceCalculator - Resource calculator instance');
}

// Service worker registration (for future PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Could register a service worker here for offline functionality
        console.log('Service worker support detected (not implemented yet)');
    });
}