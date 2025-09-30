import * as THREE from 'three';

export default class LoaderPool {
    /**
     * @type {THREE.LoadingManager}
     * @default {THREE.DefaultLoadingManager}
     */
    #manager;
    /**
     * @type {Map<(new (manager: THREE.LoadingManager) => THREE.Loader),THREE.Loader>}
     */
    #loaders = new Map();

    /**
     * @type {void|((loader:THREE.Loader,justcreate:boolean)=>void)}
     */
    #configure;

    get configure() {
        return this.#configure;
    };

    set configure(newconfig) {
        this.configure = newconfig;
        if (typeof newconfig != "function") {
            return;
        }
        for (const [key, value] of this.#loaders) {
            newconfig(value, false);
        }
    };

    get loaders() {
        return this.#loaders
    };

    get manager() {
        return this.#manager;
    };

    set manager(newmgr) {
        if (!(newmgr instanceof THREE.LoadingManager)) {
            throw new TypeError("invalid THREE.LoadingManager");
        }
        this.#manager = newmgr;
        for (const [key, value] of this.#loaders) {
            value.manager = newmgr;
        }
    };

    static get defaultLoadingManager() {
        return THREE.DefaultLoadingManager;
    };

    constructor(manager) {
        if (manager instanceof THREE.LoadingManager) {
            this.#manager = manager;
        } else if (typeof manager == "string") {
            switch (manager) {
                case "default":
                    this.#manager = THREE.DefaultLoadingManager;
                    break;
                case "new":
                    this.#manager = new THREE.LoadingManager();
                    break;
            }
        } else {
            this.#manager = THREE.DefaultLoadingManager;
        }

    };

    /**
     * @param {new (manager: THREE.LoadingManager) => THREE.Loader} loaderType 
     * @returns {THREE.Loader}
     */
    getLoader(loaderType) {
        if (this.#loaders.has(loaderType)) {
            return this.#loaders.get(loaderType);
        }
        const loader = new loaderType(this.#manager);
        if (typeof this.#configure == "function") {
            this.#configure(loader, true);
        }
        return this.#loaders.set(loaderType, loader);
    };

    abort() {
        this.#manager.abort();
    };



};
