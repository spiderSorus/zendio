import Phaser from 'phaser';

export class CameraManager {
    constructor(scene) {
        this.scene = scene;
        this.layers = new Map();
        this.cameras = new Map();
        this.cameraTypes = new Map(); // Store type for each camera
    }

    /**
     * Create layers and dedicated cameras for each.
     * @param {string[]} layerNames 
     */
    setupLayers(layerNames) {
        const { width, height } = this.scene.scale;

        layerNames.forEach((name) => {
            this.getLayer(name); // Use getLayer to ensure creation and isolation
        });

        this.sortCameras();
    }

    /**
     * Ensure each camera only renders its designated layer.
     */
    refreshIsolation() {
        const allLayers = Array.from(this.layers.values());
        const mainCam = this.scene.cameras.main;

        const layersWithCameras = Array.from(this.layers.values());
        mainCam.ignore(layersWithCameras);

        this.cameras.forEach((cam, layerName) => {
            const designatedLayer = this.layers.get(layerName);
            const otherLayers = allLayers.filter(l => l !== designatedLayer);
            
            cam.setBackgroundColor('rgba(0,0,0,0)');
            cam.ignore(otherLayers);
        });
    }

    getLayer(name) {
        if (!this.layers.has(name)) {
            const container = this.scene.add.container(0, 0);
            container.setName(name);
            this.layers.set(name, container);
            
            const { width, height } = this.scene.scale;
            const cam = this.scene.cameras.add(0, 0, width, height).setName(name + 'Camera');
            cam.setBackgroundColor('rgba(0,0,0,0)');
            cam.centerOn(0, 0); // Center on (0,0)
            this.cameras.set(name, cam);
            
            // Assign type based on name
            let type = 'MIDGROUND';
            if (name.includes('bg') || name.includes('background')) type = 'BACKGROUND';
            if (name.includes('ui')) type = 'UI';
            if (name.includes('text')) type = 'TEXT';
            if (name.includes('foreground')) type = 'FOREGROUND';
            
            this.cameraTypes.set(name, type);
            
            this.refreshIsolation();
            this.sortCameras();
        }
        return this.layers.get(name);
    }

    sortCameras() {
        const TYPE_ORDER = {
            'BACKGROUND': 0,
            'MIDGROUND': 1,
            'FOREGROUND': 2,
            'TEXT': 3,
            'UI': 4
        };

        // We need to sort the internal cameras array of Phaser
        this.scene.cameras.cameras.sort((a, b) => {
            if (a === this.scene.cameras.main) return -1;
            if (b === this.scene.cameras.main) return 1;

            const nameA = a.name.replace('Camera', '');
            const nameB = b.name.replace('Camera', '');

            const typeA = this.cameraTypes.get(nameA) || 'MIDGROUND';
            const typeB = this.cameraTypes.get(nameB) || 'MIDGROUND';

            return TYPE_ORDER[typeA] - TYPE_ORDER[typeB];
        });
    }

    getCamera(name) {
        return this.cameras.get(name);
    }
}
