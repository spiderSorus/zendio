import Phaser from 'phaser';

export class CameraManager {
    constructor(scene) {
        this.scene = scene;
        this.layers = new Map();
        this.cameras = new Map();
    }

    /**
     * Create layers and dedicated cameras for each.
     * @param {string[]} layerNames 
     */
    setupLayers(layerNames) {
        const { width, height } = this.scene.scale;
        const mainCam = this.scene.cameras.main;

        layerNames.forEach((name, index) => {
            // 1. Create a Container for each layer
            const container = this.scene.add.container(0, 0);
            container.setName(name);
            this.layers.set(name, container);

            // 2. Create a dedicated Camera for each layer
            // The first few layers might use the main camera or we can create new ones for all
            let cam;
            if (name === 'ui') {
                cam = this.scene.cameras.add(0, 0, width, height).setName('UICamera');
            } else {
                cam = this.scene.cameras.add(0, 0, width, height).setName(name + 'Camera');
            }
            
            this.cameras.set(name, cam);
        });

        // 3. Configure Camera/Layer isolation
        this.refreshIsolation();
    }

    /**
     * Ensure each camera only renders its designated layer.
     */
    refreshIsolation() {
        const allLayers = Array.from(this.layers.values());
        const mainCam = this.scene.cameras.main;

        // Main camera ignores everything that has a dedicated camera
        const layersWithCameras = Array.from(this.layers.keys())
            .map(name => this.layers.get(name));
        
        mainCam.ignore(layersWithCameras);

        this.cameras.forEach((cam, layerName) => {
            const designatedLayer = this.layers.get(layerName);
            const otherLayers = allLayers.filter(l => l !== designatedLayer);
            
            cam.setBackgroundColor('rgba(0,0,0,0)');
            cam.ignore(otherLayers);
            
            // If it's the UI camera, it should also ignore the default world (non-layered objects)
            // But usually we want the main camera to handle non-layered objects.
        });
    }

    getLayer(name) {
        // If layer doesn't exist, create it on the fly (useful for dynamic LetGo layers)
        if (!this.layers.has(name)) {
            const container = this.scene.add.container(0, 0);
            container.setName(name);
            this.layers.set(name, container);
            
            const { width, height } = this.scene.scale;
            const cam = this.scene.cameras.add(0, 0, width, height).setName(name + 'Camera');
            cam.setBackgroundColor('rgba(0,0,0,0)');
            this.cameras.set(name, cam);
            
            this.refreshIsolation();
        }
        return this.layers.get(name);
    }

    getCamera(name) {
        return this.cameras.get(name);
    }
}
