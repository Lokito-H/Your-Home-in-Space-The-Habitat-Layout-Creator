/**
 * Resource Calculator
 * Manages resource calculations and UI updates
 */

class ResourceCalculator {
    constructor() {
        this.maxPower = 100;
        this.maxOxygen = 100;
        this.maxSpace = 1000;
        
        this.elements = {
            powerFill: document.getElementById('power-fill'),
            powerValue: document.getElementById('power-value'),
            oxygenFill: document.getElementById('oxygen-fill'),
            oxygenValue: document.getElementById('oxygen-value'),
            spaceFill: document.getElementById('space-fill'),
            spaceValue: document.getElementById('space-value'),
            safetyAlerts: document.getElementById('safety-alerts'),
            totalModules: document.getElementById('total-modules'),
            crewCapacity: document.getElementById('crew-capacity'),
            totalArea: document.getElementById('total-area'),
            powerConsumption: document.getElementById('power-consumption')
        };

        this.init();
    }

    init() {
        this.updateResources([]);
    }

    updateResources(modules) {
        const resources = HabitatModules.calculateTotalResources(modules);
        
        // Add module types for safety checking
        resources.moduleTypes = modules.map(m => m.type);
        
        this.updatePowerDisplay(resources);
        this.updateOxygenDisplay(resources);
        this.updateSpaceDisplay(resources);
        this.updateStatistics(resources);
        this.updateSafetyAlerts(resources);
    }

    updatePowerDisplay(resources) {
        const powerBalance = resources.powerBalance;
        const totalPowerGeneration = resources.powerGeneration;
        const powerConsumption = resources.powerConsumption;
        
        // Calculate power level as percentage of generation vs consumption
        let powerLevel = 0;
        if (totalPowerGeneration > 0) {
            powerLevel = Math.min(100, (powerBalance / totalPowerGeneration) * 100 + 50);
        } else if (powerConsumption > 0) {
            powerLevel = 0; // No power generation but has consumption
        } else {
            powerLevel = 100; // No modules yet
        }

        // Update power bar
        this.elements.powerFill.style.width = `${Math.max(0, powerLevel)}%`;
        
        // Color coding based on power status
        if (powerBalance < 0) {
            this.elements.powerFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (powerBalance < 10) {
            this.elements.powerFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            this.elements.powerFill.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
        }

        // Update power value text
        this.elements.powerValue.textContent = `${powerBalance}/${totalPowerGeneration} kW`;
    }

    updateOxygenDisplay(resources) {
        const oxygenBalance = resources.oxygenBalance;
        const totalOxygenProduction = resources.oxygenProduction;
        const oxygenConsumption = resources.oxygenConsumption;
        
        // Calculate oxygen level as percentage
        let oxygenLevel = 0;
        if (totalOxygenProduction > 0) {
            oxygenLevel = Math.min(100, ((oxygenBalance + oxygenConsumption) / totalOxygenProduction) * 100);
        } else if (oxygenConsumption > 0) {
            oxygenLevel = 0; // No oxygen production but has consumption
        } else {
            oxygenLevel = 100; // No modules yet
        }

        // Update oxygen bar
        this.elements.oxygenFill.style.width = `${Math.max(0, oxygenLevel)}%`;
        
        // Color coding based on oxygen status
        if (oxygenBalance < 0) {
            this.elements.oxygenFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (oxygenBalance < 5) {
            this.elements.oxygenFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            this.elements.oxygenFill.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
        }

        // Update oxygen value text
        const oxygenPercentage = Math.max(0, Math.min(100, oxygenLevel));
        this.elements.oxygenValue.textContent = `${oxygenPercentage.toFixed(0)}% (${oxygenBalance > 0 ? '+' : ''}${oxygenBalance})`;
    }

    updateSpaceDisplay(resources) {
        const usedSpace = resources.totalArea;
        const spaceUsagePercent = (usedSpace / this.maxSpace) * 100;
        
        // Update space bar
        this.elements.spaceFill.style.width = `${Math.min(100, spaceUsagePercent)}%`;
        
        // Color coding based on space usage
        if (spaceUsagePercent > 90) {
            this.elements.spaceFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (spaceUsagePercent > 75) {
            this.elements.spaceFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            this.elements.spaceFill.style.background = 'linear-gradient(90deg, #3498db, #5dade2)';
        }

        // Update space value text
        this.elements.spaceValue.textContent = `${usedSpace.toFixed(1)}/${this.maxSpace} m²`;
    }

    updateStatistics(resources) {
        this.elements.totalModules.textContent = resources.modules;
        this.elements.crewCapacity.textContent = resources.crewCapacity;
        this.elements.totalArea.textContent = `${resources.totalArea.toFixed(1)} m²`;
        this.elements.powerConsumption.textContent = `${resources.powerConsumption} kW`;
    }

    updateSafetyAlerts(resources) {
        const alerts = HabitatModules.getSafetyAlerts(resources);
        
        // Clear existing alerts
        this.elements.safetyAlerts.innerHTML = '';
        
        // Add new alerts
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-item ${alert.type}`;
            alertElement.textContent = alert.message;
            this.elements.safetyAlerts.appendChild(alertElement);
        });

        // Add scrolling animation if there are many alerts
        if (alerts.length > 3) {
            this.elements.safetyAlerts.style.animation = 'scroll 10s linear infinite';
        } else {
            this.elements.safetyAlerts.style.animation = 'none';
        }
    }

    // Get resource efficiency scores
    getEfficiencyScores(modules) {
        const resources = HabitatModules.calculateTotalResources(modules);
        
        const scores = {
            power: this.calculatePowerEfficiency(resources),
            oxygen: this.calculateOxygenEfficiency(resources),
            space: this.calculateSpaceEfficiency(resources),
            crew: this.calculateCrewEfficiency(resources)
        };

        scores.overall = (scores.power + scores.oxygen + scores.space + scores.crew) / 4;
        
        return scores;
    }

    calculatePowerEfficiency(resources) {
        if (resources.powerConsumption === 0) return 100;
        
        const efficiency = (resources.powerBalance / resources.powerConsumption) * 100;
        return Math.max(0, Math.min(100, efficiency + 50)); // Normalize to 0-100 scale
    }

    calculateOxygenEfficiency(resources) {
        if (resources.oxygenConsumption === 0) return 100;
        
        const efficiency = (resources.oxygenBalance / resources.oxygenConsumption) * 100;
        return Math.max(0, Math.min(100, efficiency + 50)); // Normalize to 0-100 scale
    }

    calculateSpaceEfficiency(resources) {
        const spaceUsage = (resources.totalArea / this.maxSpace) * 100;
        
        // Optimal space usage is around 60-80%
        if (spaceUsage < 20) return spaceUsage * 2; // Penalize very low usage
        if (spaceUsage <= 80) return 100; // Optimal range
        return Math.max(0, 100 - (spaceUsage - 80) * 2); // Penalize over-usage
    }

    calculateCrewEfficiency(resources) {
        if (resources.modules === 0) return 100;
        
        // Calculate crew per module ratio
        const crewPerModule = resources.crewCapacity / resources.modules;
        
        // Optimal ratio is around 1-2 crew per module
        if (crewPerModule >= 1 && crewPerModule <= 2) return 100;
        if (crewPerModule < 1) return crewPerModule * 100;
        return Math.max(0, 100 - (crewPerModule - 2) * 20);
    }

    // Generate efficiency report
    generateEfficiencyReport(modules) {
        const scores = this.getEfficiencyScores(modules);
        const resources = HabitatModules.calculateTotalResources(modules);
        
        const report = {
            timestamp: new Date().toISOString(),
            scores: scores,
            resources: resources,
            recommendations: this.generateRecommendations(resources, scores)
        };

        return report;
    }

    generateRecommendations(resources, scores) {
        const recommendations = [];

        if (scores.power < 70) {
            if (resources.powerBalance < 0) {
                recommendations.push({
                    type: 'critical',
                    category: 'power',
                    message: 'Add more power modules to meet energy demands',
                    priority: 1
                });
            } else {
                recommendations.push({
                    type: 'suggestion',
                    category: 'power',
                    message: 'Consider adding backup power for redundancy',
                    priority: 3
                });
            }
        }

        if (scores.oxygen < 70) {
            if (resources.oxygenBalance < 0) {
                recommendations.push({
                    type: 'critical',
                    category: 'oxygen',
                    message: 'Add greenhouse modules to increase oxygen production',
                    priority: 1
                });
            } else {
                recommendations.push({
                    type: 'suggestion',
                    category: 'oxygen',
                    message: 'Consider adding more greenhouses for better air quality',
                    priority: 3
                });
            }
        }

        if (scores.space < 50) {
            if (resources.totalArea / this.maxSpace > 0.9) {
                recommendations.push({
                    type: 'warning',
                    category: 'space',
                    message: 'Habitat is nearly at capacity. Consider removing non-essential modules',
                    priority: 2
                });
            } else {
                recommendations.push({
                    type: 'suggestion',
                    category: 'space',
                    message: 'Add more modules to better utilize available space',
                    priority: 3
                });
            }
        }

        if (scores.crew < 70) {
            if (resources.crewCapacity === 0) {
                recommendations.push({
                    type: 'critical',
                    category: 'crew',
                    message: 'Add living quarters for crew accommodation',
                    priority: 1
                });
            } else if (resources.crewCapacity < 4) {
                recommendations.push({
                    type: 'suggestion',
                    category: 'crew',
                    message: 'Consider adding more living quarters for larger crew',
                    priority: 3
                });
            }
        }

        // Sort by priority
        recommendations.sort((a, b) => a.priority - b.priority);

        return recommendations;
    }

    // Export resource data
    exportResourceData(modules) {
        const report = this.generateEfficiencyReport(modules);
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `habitat-resources-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ResourceCalculator = ResourceCalculator;
}