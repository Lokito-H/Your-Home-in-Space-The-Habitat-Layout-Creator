/**
 * Habitat Designer Core Functionality
 * Handles the main design canvas, drag-and-drop, and module management
 */

class HabitatDesigner {
    constructor() {
        this.modules = [];
        this.selectedModule = null;
        this.canvas = null;
        this.canvasRect = null;
        this.dragState = {
            isDragging: false,
            dragElement: null,
            offset: { x: 0, y: 0 },
            isNewModule: false
        };
        this.gridVisible = false;
        this.nextModuleId = 1;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('canvas-area');
        this.setupEventListeners();
        this.updateCanvasRect();
        
        // Setup resize observer to update canvas dimensions
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.updateCanvasRect();
            });
            resizeObserver.observe(this.canvas);
        }
    }

    updateCanvasRect() {
        this.canvasRect = this.canvas.getBoundingClientRect();
    }

    setupEventListeners() {
        // Module palette drag events
        const moduleItems = document.querySelectorAll('.module-item');
        moduleItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleModuleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleModuleDragEnd(e));
            // Make items draggable
            item.draggable = true;
        });

        // Canvas drop events
        this.canvas.addEventListener('dragover', (e) => this.handleCanvasDragOver(e));
        this.canvas.addEventListener('drop', (e) => this.handleCanvasDrop(e));
        this.canvas.addEventListener('dragleave', (e) => this.handleCanvasDragLeave(e));

        // Canvas click events for module selection
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Control buttons
        document.getElementById('grid-toggle').addEventListener('click', () => this.toggleGrid());
        document.getElementById('clear-habitat').addEventListener('click', () => this.clearHabitat());
        document.getElementById('save-habitat').addEventListener('click', () => this.saveHabitat());
        document.getElementById('load-habitat').addEventListener('click', () => this.loadHabitat());
        document.getElementById('export-habitat').addEventListener('click', () => this.exportHabitat());

        // Global mouse events for module dragging
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleModuleDragStart(e) {
        const moduleType = e.target.closest('.module-item').dataset.module;
        e.dataTransfer.setData('text/plain', moduleType);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Create drag image
        const dragImage = e.target.closest('.module-item').cloneNode(true);
        dragImage.style.transform = 'scale(0.8)';
        dragImage.style.opacity = '0.8';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 50, 50);
        
        // Clean up drag image after a short delay
        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 100);
    }

    handleModuleDragEnd(e) {
        // Clean up any drag state
        this.canvas.classList.remove('drag-over');
    }

    handleCanvasDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.canvas.classList.add('drag-over');
    }

    handleCanvasDragLeave(e) {
        // Only remove drag-over if we're leaving the canvas area entirely
        if (!this.canvas.contains(e.relatedTarget)) {
            this.canvas.classList.remove('drag-over');
        }
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        this.canvas.classList.remove('drag-over');
        
        const moduleType = e.dataTransfer.getData('text/plain');
        if (!moduleType) return;

        // Calculate drop position relative to canvas
        this.updateCanvasRect();
        const dropX = e.clientX - this.canvasRect.left;
        const dropY = e.clientY - this.canvasRect.top;

        this.addModule(moduleType, dropX, dropY);
    }

    addModule(moduleType, x, y) {
        const moduleInfo = HabitatModules.getModuleType(moduleType);
        if (!moduleInfo) return;

        // Adjust position to center the module on the drop point
        const adjustedX = Math.max(0, x - moduleInfo.dimensions.width / 2);
        const adjustedY = Math.max(0, y - moduleInfo.dimensions.height / 2);

        // Validate placement
        const validation = HabitatModules.validateModulePlacement(
            moduleType,
            { x: adjustedX, y: adjustedY },
            this.modules,
            { width: this.canvasRect.width, height: this.canvasRect.height }
        );

        if (!validation.valid) {
            this.showNotification(validation.reason, 'warning');
            return;
        }

        // Create module object
        const module = {
            id: this.nextModuleId++,
            type: moduleType,
            x: adjustedX,
            y: adjustedY,
            ...moduleInfo
        };

        // Add to modules array
        this.modules.push(module);

        // Create visual element
        this.createModuleElement(module);

        // Update resources and UI
        this.updateResources();
        this.hideDropMessage();

        this.showNotification(`${moduleInfo.name} added successfully!`, 'success');
    }

    createModuleElement(module) {
        const element = document.createElement('div');
        element.className = 'habitat-module';
        element.dataset.moduleId = module.id;
        element.dataset.module = module.type;
        element.style.left = `${module.x}px`;
        element.style.top = `${module.y}px`;
        element.style.width = `${module.dimensions.width}px`;
        element.style.height = `${module.dimensions.height}px`;

        element.innerHTML = `
            <div class="module-icon">${module.icon}</div>
            <div class="module-name">${module.name}</div>
        `;

        // Add event listeners for dragging existing modules
        element.addEventListener('mousedown', (e) => this.handleModuleMouseDown(e, module));
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectModule(module);
        });

        this.canvas.appendChild(element);
    }

    handleModuleMouseDown(e, module) {
        if (e.button !== 0) return; // Only left mouse button

        e.preventDefault();
        e.stopPropagation();

        this.selectModule(module);

        this.dragState = {
            isDragging: true,
            dragElement: e.currentTarget,
            module: module,
            offset: {
                x: e.clientX - module.x,
                y: e.clientY - module.y
            },
            isNewModule: false
        };

        e.currentTarget.classList.add('dragging');
        this.updateCanvasRect();
    }

    handleMouseMove(e) {
        if (!this.dragState.isDragging) return;

        e.preventDefault();

        const newX = e.clientX - this.dragState.offset.x;
        const newY = e.clientY - this.dragState.offset.y;

        // Update visual position
        this.dragState.dragElement.style.left = `${newX}px`;
        this.dragState.dragElement.style.top = `${newY}px`;

        // Update module position
        this.dragState.module.x = newX;
        this.dragState.module.y = newY;
    }

    handleMouseUp(e) {
        if (!this.dragState.isDragging) return;

        this.dragState.dragElement.classList.remove('dragging');

        // Validate final position
        const validation = HabitatModules.validateModulePlacement(
            this.dragState.module.type,
            { x: this.dragState.module.x, y: this.dragState.module.y },
            this.modules.filter(m => m.id !== this.dragState.module.id),
            { width: this.canvasRect.width, height: this.canvasRect.height }
        );

        if (!validation.valid) {
            // Revert to original position if invalid
            this.showNotification(validation.reason, 'warning');
            // You would need to store original position to revert here
        }

        this.dragState = {
            isDragging: false,
            dragElement: null,
            module: null,
            offset: { x: 0, y: 0 },
            isNewModule: false
        };

        this.updateResources();
    }

    handleCanvasClick(e) {
        // Deselect module if clicking on empty canvas
        if (e.target === this.canvas || e.target.classList.contains('grid-overlay')) {
            this.deselectModule();
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedModule) {
            this.removeModule(this.selectedModule.id);
        } else if (e.key === 'Escape') {
            this.deselectModule();
        }
    }

    selectModule(module) {
        this.deselectModule();
        this.selectedModule = module;
        
        const element = document.querySelector(`.habitat-module[data-module-id="${module.id}"]`);
        if (element) {
            element.classList.add('selected');
        }

        this.showModuleInfo(module);
    }

    deselectModule() {
        if (this.selectedModule) {
            const element = document.querySelector(`.habitat-module[data-module-id="${this.selectedModule.id}"]`);
            if (element) {
                element.classList.remove('selected');
            }
            this.selectedModule = null;
        }
        this.hideModuleInfo();
    }

    removeModule(moduleId) {
        const moduleIndex = this.modules.findIndex(m => m.id === moduleId);
        if (moduleIndex === -1) return;

        const module = this.modules[moduleIndex];
        
        // Remove from DOM
        const element = document.querySelector(`.habitat-module[data-module-id="${moduleId}"]`);
        if (element) {
            element.remove();
        }

        // Remove from array
        this.modules.splice(moduleIndex, 1);

        // Clear selection if this was the selected module
        if (this.selectedModule && this.selectedModule.id === moduleId) {
            this.selectedModule = null;
        }

        this.updateResources();
        this.showDropMessageIfEmpty();
        this.showNotification(`${module.name} removed`, 'info');
    }

    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        const gridOverlay = document.getElementById('grid-overlay');
        gridOverlay.classList.toggle('visible', this.gridVisible);
        
        const button = document.getElementById('grid-toggle');
        button.textContent = this.gridVisible ? 'Hide Grid' : 'Show Grid';
    }

    clearHabitat() {
        if (this.modules.length === 0) return;

        if (confirm('Are you sure you want to clear all modules? This action cannot be undone.')) {
            // Remove all module elements
            document.querySelectorAll('.habitat-module').forEach(el => el.remove());
            
            // Clear modules array
            this.modules = [];
            this.selectedModule = null;
            
            this.updateResources();
            this.showDropMessage();
            this.showNotification('Habitat cleared', 'info');
        }
    }

    saveHabitat() {
        const habitatData = {
            modules: this.modules,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        localStorage.setItem('habitat-design', JSON.stringify(habitatData));
        this.showNotification('Habitat design saved!', 'success');
    }

    loadHabitat() {
        const savedData = localStorage.getItem('habitat-design');
        if (!savedData) {
            this.showNotification('No saved habitat found', 'warning');
            return;
        }

        try {
            const habitatData = JSON.parse(savedData);
            
            // Clear existing modules
            this.clearHabitat();
            
            // Load modules
            habitatData.modules.forEach(moduleData => {
                // Restore module
                this.modules.push(moduleData);
                this.createModuleElement(moduleData);
            });

            // Update next ID
            if (this.modules.length > 0) {
                this.nextModuleId = Math.max(...this.modules.map(m => m.id)) + 1;
            }

            this.updateResources();
            this.hideDropMessage();
            this.showNotification('Habitat design loaded!', 'success');
            
        } catch (error) {
            this.showNotification('Error loading habitat design', 'error');
            console.error('Load error:', error);
        }
    }

    exportHabitat() {
        const habitatData = {
            modules: this.modules,
            resources: this.calculateResources(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(habitatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `habitat-design-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('Habitat design exported!', 'success');
    }

    calculateResources() {
        return HabitatModules.calculateTotalResources(this.modules);
    }

    updateResources() {
        // Trigger resource update
        if (window.resourceCalculator) {
            window.resourceCalculator.updateResources(this.modules);
        }
    }

    showDropMessage() {
        const dropMessage = document.querySelector('.drop-message');
        if (dropMessage) {
            dropMessage.style.display = 'block';
        }
    }

    hideDropMessage() {
        const dropMessage = document.querySelector('.drop-message');
        if (dropMessage && this.modules.length > 0) {
            dropMessage.style.display = 'none';
        }
    }

    showDropMessageIfEmpty() {
        if (this.modules.length === 0) {
            this.showDropMessage();
        }
    }

    showModuleInfo(module) {
        // This could be extended to show detailed module info in a sidebar
        console.log('Selected module:', module);
    }

    hideModuleInfo() {
        // Hide module info panel
    }

    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

        switch (type) {
            case 'success': notification.style.background = '#27ae60'; break;
            case 'warning': notification.style.background = '#f39c12'; break;
            case 'error': notification.style.background = '#e74c3c'; break;
            default: notification.style.background = '#3498db'; break;
        }

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    // Get current habitat state
    getHabitatState() {
        return {
            modules: this.modules,
            resources: this.calculateResources(),
            selectedModule: this.selectedModule
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.HabitatDesigner = HabitatDesigner;
}