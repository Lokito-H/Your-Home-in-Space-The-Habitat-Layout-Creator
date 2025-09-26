/**
 * Habitat Module Definitions
 * Defines the properties and characteristics of each module type
 */

class HabitatModules {
    static moduleTypes = {
        'living-quarters': {
            name: 'Living Quarters',
            icon: '🏠',
            dimensions: { width: 120, height: 100 },
            powerConsumption: 15,
            oxygenProduction: 0,
            oxygenConsumption: 5,
            crewCapacity: 4,
            area: 12,
            description: 'Sleeping quarters and personal space for crew members',
            color: '#2ecc71',
            requirements: ['power', 'life-support']
        },
        'laboratory': {
            name: 'Laboratory',
            icon: '🔬',
            dimensions: { width: 140, height: 120 },
            powerConsumption: 25,
            oxygenProduction: 0,
            oxygenConsumption: 3,
            crewCapacity: 2,
            area: 16.8,
            description: 'Research and scientific experimentation facility',
            color: '#9b59b6',
            requirements: ['power', 'data-link']
        },
        'greenhouse': {
            name: 'Greenhouse',
            icon: '🌱',
            dimensions: { width: 160, height: 140 },
            powerConsumption: 30,
            oxygenProduction: 15,
            oxygenConsumption: 2,
            crewCapacity: 1,
            area: 22.4,
            description: 'Food production and oxygen generation facility',
            color: '#27ae60',
            requirements: ['power', 'water', 'co2']
        },
        'workshop': {
            name: 'Workshop',
            icon: '🔧',
            dimensions: { width: 130, height: 110 },
            powerConsumption: 20,
            oxygenProduction: 0,
            oxygenConsumption: 4,
            crewCapacity: 2,
            area: 14.3,
            description: 'Manufacturing and repair facility',
            color: '#e67e22',
            requirements: ['power', 'raw-materials']
        },
        'recreation': {
            name: 'Recreation',
            icon: '🎮',
            dimensions: { width: 150, height: 130 },
            powerConsumption: 18,
            oxygenProduction: 0,
            oxygenConsumption: 6,
            crewCapacity: 8,
            area: 19.5,
            description: 'Entertainment and social gathering space',
            color: '#3498db',
            requirements: ['power', 'climate-control']
        },
        'airlock': {
            name: 'Airlock',
            icon: '🚪',
            dimensions: { width: 80, height: 80 },
            powerConsumption: 10,
            oxygenProduction: 0,
            oxygenConsumption: 1,
            crewCapacity: 2,
            area: 6.4,
            description: 'Entry/exit point for EVA operations',
            color: '#95a5a6',
            requirements: ['power', 'pressure-control']
        },
        'power': {
            name: 'Power Module',
            icon: '⚡',
            dimensions: { width: 100, height: 100 },
            powerConsumption: 0,
            powerGeneration: 50,
            oxygenProduction: 0,
            oxygenConsumption: 0,
            crewCapacity: 0,
            area: 10,
            description: 'Solar panels and power generation system',
            color: '#f1c40f',
            requirements: []
        },
        'storage': {
            name: 'Storage',
            icon: '📦',
            dimensions: { width: 110, height: 90 },
            powerConsumption: 5,
            oxygenProduction: 0,
            oxygenConsumption: 0,
            crewCapacity: 0,
            area: 9.9,
            description: 'Equipment and supply storage facility',
            color: '#8e44ad',
            requirements: ['climate-control']
        }
    };

    static getModuleType(moduleId) {
        return this.moduleTypes[moduleId] || null;
    }

    static getAllModuleTypes() {
        return Object.keys(this.moduleTypes);
    }

    static getModuleInfo(moduleId) {
        return this.moduleTypes[moduleId] || null;
    }

    static calculateTotalResources(modules) {
        let totalPowerConsumption = 0;
        let totalPowerGeneration = 0;
        let totalOxygenProduction = 0;
        let totalOxygenConsumption = 0;
        let totalCrewCapacity = 0;
        let totalArea = 0;

        modules.forEach(module => {
            const moduleType = this.getModuleType(module.type);
            if (moduleType) {
                totalPowerConsumption += moduleType.powerConsumption || 0;
                totalPowerGeneration += moduleType.powerGeneration || 0;
                totalOxygenProduction += moduleType.oxygenProduction || 0;
                totalOxygenConsumption += moduleType.oxygenConsumption || 0;
                totalCrewCapacity += moduleType.crewCapacity || 0;
                totalArea += moduleType.area || 0;
            }
        });

        return {
            powerBalance: totalPowerGeneration - totalPowerConsumption,
            oxygenBalance: totalOxygenProduction - totalOxygenConsumption,
            crewCapacity: totalCrewCapacity,
            totalArea: totalArea,
            modules: modules.length,
            powerConsumption: totalPowerConsumption,
            powerGeneration: totalPowerGeneration,
            oxygenProduction: totalOxygenProduction,
            oxygenConsumption: totalOxygenConsumption
        };
    }

    static validateModulePlacement(moduleType, position, existingModules, canvasSize) {
        const module = this.getModuleType(moduleType);
        if (!module) return { valid: false, reason: 'Invalid module type' };

        // Check boundaries
        if (position.x < 0 || position.y < 0 || 
            position.x + module.dimensions.width > canvasSize.width ||
            position.y + module.dimensions.height > canvasSize.height) {
            return { valid: false, reason: 'Module extends beyond habitat boundary' };
        }

        // Check overlap with existing modules
        for (let existingModule of existingModules) {
            if (this.modulesOverlap(
                { x: position.x, y: position.y, ...module.dimensions },
                { x: existingModule.x, y: existingModule.y, ...this.getModuleType(existingModule.type).dimensions }
            )) {
                return { valid: false, reason: 'Module overlaps with existing module' };
            }
        }

        return { valid: true };
    }

    static modulesOverlap(module1, module2) {
        return !(module1.x + module1.width <= module2.x ||
                module2.x + module2.width <= module1.x ||
                module1.y + module1.height <= module2.y ||
                module2.y + module2.height <= module1.y);
    }

    static getSafetyAlerts(resources) {
        const alerts = [];

        if (resources.powerBalance < 0) {
            alerts.push({
                type: 'danger',
                message: `⚠️ Power deficit: ${Math.abs(resources.powerBalance)}kW. Add more power modules!`
            });
        } else if (resources.powerBalance < 10) {
            alerts.push({
                type: 'warning',
                message: `⚡ Low power reserve: ${resources.powerBalance}kW. Consider adding backup power.`
            });
        }

        if (resources.oxygenBalance < 0) {
            alerts.push({
                type: 'danger',
                message: `⚠️ Oxygen deficit: ${Math.abs(resources.oxygenBalance)} units. Add greenhouse modules!`
            });
        } else if (resources.oxygenBalance < 5) {
            alerts.push({
                type: 'warning',
                message: `🌱 Low oxygen reserve: ${resources.oxygenBalance} units. Consider adding more greenhouses.`
            });
        }

        if (resources.crewCapacity === 0) {
            alerts.push({
                type: 'warning',
                message: '🏠 No living quarters. Crew needs places to sleep!'
            });
        } else if (resources.crewCapacity < 4) {
            alerts.push({
                type: 'warning',
                message: `🏠 Limited crew capacity: ${resources.crewCapacity} people. Consider adding more living quarters.`
            });
        }

        // Check for essential modules
        const moduleTypes = resources.moduleTypes || [];
        if (!moduleTypes.includes('airlock')) {
            alerts.push({
                type: 'warning',
                message: '🚪 No airlock detected. EVA operations will not be possible!'
            });
        }

        if (!moduleTypes.includes('power')) {
            alerts.push({
                type: 'danger',
                message: '⚡ No power modules! The habitat needs power generation.'
            });
        }

        if (alerts.length === 0) {
            alerts.push({
                type: 'safe',
                message: '✅ All systems nominal'
            });
        }

        return alerts;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HabitatModules;
} else {
    window.HabitatModules = HabitatModules;
}