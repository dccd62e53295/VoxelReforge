
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';

import RtVars from './util/RtVars.js';
import * as Util from "./util/Util.js";
import LoaderPool from './assets/LoaderPool.js';

export class MainDesktopGeneric {

    get EngineLibrary() {
        return THREE;
    };

    get GLTextureSideMaxPixel() {
        const gl = this.renderer.getContext();
        return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    };

    calcScreenRelativePosition(event) {// get screen input pixel pos
        const rect = this.renderer_domElement.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
    };

    onWindowResize(entries) {
        this.camera_updateProjectionMatrix = true;
        this.renderer_handleResize = true;
        this.controls_handleResize = true;

        this.rtVar.v("renderer.resize").emit({});
    };

    animate(timestamp) {
        if (this.#animateManual) {
            this.#animateSaveTime += timestamp - this.#animateLastTime;
            this.#animateLastTime = timestamp;
            if (this.#animateSaveTime < this.#animatePeriod) {
                return;
            }
            this.#animateSaveTime %= this.#animatePeriod;
        }
        this.rtVar.animate(timestamp);
        if (this.renderer_handleResize) {
            const size = this.constructor.calcDomElementSize(this.container);
            this.renderer.setPixelRatio(size.ratio);
            if (this.anaglyph instanceof AnaglyphEffect) {
                this.anaglyph.setSize(size.width, size.height);
            } else {
                this.renderer.setSize(size.width, size.height);
            }
            this.renderer_handleResize = false;
        }
        if (this.camera_updateProjectionMatrix) {
            this.camera.updateProjectionMatrix();
            this.camera_updateProjectionMatrix = false;
        }
        if (this.controls_handleResize) {
            this.controls.handleResize();
            // TODO clear all previous this.controls input
            this.controls_handleResize = false;
        }

        {
            this.controls.update(this.clock.getDelta());
            if (this.anaglyph instanceof AnaglyphEffect) {
                this.anaglyph.render(this.scene, this.camera);
            } else {
                this.renderer.render(this.scene, this.camera);
            }
            this.stats.update();
        }
    };

    static calcDomElementSize(p1) {
        let size = p1.getBoundingClientRect();
        let height = Math.floor(size.height);
        let width = Math.floor(size.width);
        return {
            raw: size,
            height: height,
            width: width,
            ratio: window.devicePixelRatio,
            aspect: (width / height)
        }
    };

    /**
     * @type {void|XRSession}
     */
    webxrSession = undefined;
    /**
     * @type {RtVars}
     */
    rtVar = undefined;
    /**
     * @type {LoaderPool}
     */
    assetsLoaders = undefined;

    /** */
    #animateManual = false;
    #animatePeriod = 1000;
    #animateLastTime = 0;
    #animateSaveTime = 0;

    clock = undefined;
    container = undefined;
    containerResizeListener = undefined;
    stats = undefined;

    // UI Drawer
    camera = undefined;
    camera_updateProjectionMatrix = false;
    controls = undefined;
    controls_handleResize = false;
    scene = undefined;
    renderer = undefined;// actual window drawer
    renderer_handleResize = false;
    renderer_domElement = undefined;
    anaglyph = undefined;

    fini() {

        if ((typeof XRSession != "undefined") && (this.webxrSession instanceof XRSession)) {
            this.tryFiniWebXR();
        }
        this.assetsLoaders.abort();
        if (this.anaglyph != undefined) {
            this.anaglyph.dispose();
            this.anaglyph = undefined;
        }
        this.stats = undefined;
        this.controls.dispose();
        this.controls = undefined;
        this.renderer.dispose();
        this.renderer = undefined;
        this.renderer_domElement = undefined;

        this.scene = undefined;
        this.camera = undefined;
        this.containerResizeListener.unobserve(this.container);
        this.containerResizeListener = undefined;
        this.clock = undefined;
        this.data = undefined;
        this.assetsLoaders = undefined;
        this.container.removeEventListener("fullscreenchange", this.onFullScreenChange);
        this.container.innerHTML = '';
        this.container = undefined;
        this.rtVar.dispose();
        this.rtVar = undefined;
    };

    tryFiniWebXR() {
        if (this.webxrSession instanceof XRSession) {
            this.webxrSession.end();
        }
    };

    onFiniWebXR() {
        this.renderer.xr.setSession(null);
        this.renderer.xr.enabled = false;
        this.webxrSession.removeEventListener('end', this.onFiniWebXR);
        this.webxrSession = undefined;
    };

    async tryInitWebXR(opts = {}) {
        const support = await Util.envHasWebXR();
        if (!support) {
            return false;
        }
        const sessionOptions = {
            ...opts,
            optionalFeatures: [
                'local-floor',
                'bounded-floor',
                'layers',
                ...(opts.optionalFeatures || [])
            ],
        };
        let session = undefined;
        try {
            session = await window.navigator.xr.requestSession('immersive-vr', sessionOptions);
        } catch (e) {
            console.error(e);
            console.warn("unable to enter VR mode");
            return false;
        }
        this.renderer.xr.enabled = true;
        this.webxrSession = session;
        session.addEventListener('end', this.onFiniWebXR());
        await this.renderer.xr.setSession(session);
        return true;
    };

    onAnimateFpsChange(ev) {
        const fps = ev?.new ?? this.rtVar.v("renderer.fps").value;
        if (fps < 1 || fps > 1000) {
            this.#animateManual = false;
            this.#animatePeriod = 1000;// disabled
        } else {
            this.#animateManual = true;
            this.#animatePeriod = 1000 / fps;
        }
    };

    constructor() {
        this.onWindowResize = this.onWindowResize.bind(this);
        this.animate = this.animate.bind(this);
        this.onAnimateFpsChange = this.onAnimateFpsChange.bind(this);
        this.tryInitWebXR = this.tryInitWebXR.bind(this);
        this.tryFiniWebXR = this.tryFiniWebXR.bind(this);
        this.onFiniWebXR = this.onFiniWebXR.bind(this);
        this.onFullScreenChange = this.onFullScreenChange.bind(this);
    };

    /**
     * @return {{
     * container: void|HTMLDivElement,
     * renderer: THREE.WebGLRendererParameters
     * }} args 
     */
    static makeDefaultArgs() {
        return {
            container: undefined,
            renderer: {
                alpha: false,
                antialias: true,
            },
        };
    };

    async tryFullScreenEnter() {
        if (this.isFullScreenActive()) {
            return;
        }
        await this.container.requestFullscreen({ navigationUI: "hide" });
    };

    isFullScreenActive() {
        return document.fullscreenElement === this.container;
    };

    onFullScreenChange() {
        this.rtVar.v("renderer.fullscreen").value=this.isFullScreenActive();
    };

    async tryFullScreenExit() {
        if (!this.isFullScreenActive()) {
            return;
        }
        await document.exitFullscreen();
    };

    /**
     * @param {{
     * container: HTMLDivElement,
     * renderer: THREE.WebGLRendererParameters
     * }} args 
     */
    init(args) {
        if (!(args.container instanceof HTMLDivElement)) {
            throw new TypeError("args.container not Div");
        }
        this.rtVar = new RtVars();

        this.rtVar.reg("renderer.resize","ev");
        this.rtVar.reg("camera.fov","tran", 90);
        this.rtVar.reg("renderer.fps","var", 60);
        this.rtVar.reg("renderer.fullscreen","var", 60);
        this.rtVar.reg("renderer.xr","var", false);
        this.rtVar.reg("camera.frustum.near","var", 1/16);
        this.rtVar.reg("camera.frustum.far","var", 1024);// 16*64
        this.rtVar.reg("renderer.anaglyph","var", false);
        this.rtVar.reg("debug.render.material.wireframe","var", false);

        this.rtVar.v("renderer.fps").on("change", this.onAnimateFpsChange);

        this.container = args.container;
        this.container.addEventListener("fullscreenchange", this.onFullScreenChange);
        this.assetsLoaders = new LoaderPool("new");
        this.data = this.generateHeight(this.worldWidth, this.worldDepth);
        this.clock = new THREE.Clock();
        this.containerResizeListener = new ResizeObserver(this.onWindowResize);
        this.containerResizeListener.observe(this.container);
        const containerSize = this.constructor.calcDomElementSize(this.container);
        this.camera = new THREE.PerspectiveCamera(
            this.rtVar.v("camera.fov").value,
            containerSize.aspect,
            this.rtVar.v("camera.frustum.near").value,
            this.rtVar.v("camera.frustum.far").value
        );
        this.rtVar.v("camera.fov").on("change", ((ev) => {
            this.camera.fov = ev.new;
            this.camera_updateProjectionMatrix = true;
        }).bind(this));
        this.rtVar.v("camera.frustum.near").on("change", ((ev) => {
            this.camera.near = ev.new;
            this.camera_updateProjectionMatrix = true;
        }).bind(this));
        this.rtVar.v("camera.frustum.far").on("change", ((ev) => {
            this.camera.far = ev.new;
            this.camera_updateProjectionMatrix = true;
        }).bind(this));




        this.camera.position.y = this.getY(this.worldHalfWidth, this.worldHalfDepth) + 1;

        this.initSubScene();

        this.renderer = new THREE.WebGLRenderer(args.renderer);
        this.renderer.setPixelRatio(containerSize.ratio);// window
        this.renderer.setSize(containerSize.width, containerSize.height);
        this.renderer.setAnimationLoop(this.animate);
        this.renderer_domElement = this.renderer.domElement;
        this.container.appendChild(this.renderer_domElement);

        this.onAnimateFpsChange();

        this.renderer.xr.addEventListener('sessionstart', (() => {
            this.rtVar.v("renderer.xr").value=true;
        }).bind(this));
        this.renderer.xr.addEventListener('sessionend', (() => {
            this.rtVar.v("renderer.xr").value=false;
        }).bind(this));

        this.controls = new FirstPersonControls(this.camera, this.renderer_domElement);

        this.controls.movementSpeed = 10;
        this.controls.lookSpeed = 0.125;
        this.controls.lookVertical = true;

        this.rtVar.v("renderer.anaglyph").on("change", ((ev) => {
            if (ev.new && (!(this.anaglyph instanceof AnaglyphEffect))) {
                // enable anaglyph
                const size = this.constructor.calcDomElementSize(this.container);
                this.anaglyph = new AnaglyphEffect(this.renderer, size.width, size.height);
            } else if (this.anaglyph instanceof AnaglyphEffect) {
                // disable anaglyph
                this.anaglyph.dispose();
                this.anaglyph = undefined;
            }
        }).bind(this));

        this.stats = new Stats();
        this.container.appendChild(this.stats.dom);
    };

/** exmaple terrain */
    worldWidth = 128;
    worldDepth = 128;
    worldHalfWidth = this.worldWidth / 2;
    worldHalfDepth = this.worldDepth / 2;
    data = [];

    getY(x, z) {

        return (this.data[x + z * this.worldWidth] * 0.15) | 0;

    };

    initSubScene() {
        this.scene = new THREE.Scene();// @return
        this.scene.background = new THREE.Color(0xbfd1e5);// @mapping(world_background) @inject

        const pxGeometry = new THREE.PlaneGeometry(1, 1);
        pxGeometry.attributes.uv.array[1] = 0.5;
        pxGeometry.attributes.uv.array[3] = 0.5;
        pxGeometry.rotateY(Math.PI / 2);
        pxGeometry.translate(0.5, 0, 0);

        const nxGeometry = new THREE.PlaneGeometry(1, 1);
        nxGeometry.attributes.uv.array[1] = 0.5;
        nxGeometry.attributes.uv.array[3] = 0.5;
        nxGeometry.rotateY(- Math.PI / 2);
        nxGeometry.translate(- 0.5, 0, 0);

        const pyGeometry = new THREE.PlaneGeometry(1, 1);
        pyGeometry.attributes.uv.array[5] = 0.5;
        pyGeometry.attributes.uv.array[7] = 0.5;
        pyGeometry.rotateX(- Math.PI / 2);
        pyGeometry.translate(0, 0.5, 0);

        const pzGeometry = new THREE.PlaneGeometry(1, 1);
        pzGeometry.attributes.uv.array[1] = 0.5;
        pzGeometry.attributes.uv.array[3] = 0.5;
        pzGeometry.translate(0, 0, 0.5);

        const nzGeometry = new THREE.PlaneGeometry(1, 1);
        nzGeometry.attributes.uv.array[1] = 0.5;
        nzGeometry.attributes.uv.array[3] = 0.5;
        nzGeometry.rotateY(Math.PI);
        nzGeometry.translate(0, 0, - 0.5);

        const matrix = new THREE.Matrix4();

        const geometries = [];


        for (let z = 0; z < this.worldDepth; z++) {

            for (let x = 0; x < this.worldWidth; x++) {

                const h = this.getY(x, z);

                matrix.makeTranslation(
                    x - this.worldHalfWidth,
                    h,
                    z - this.worldHalfDepth
                );

                const px = this.getY(x + 1, z);
                const nx = this.getY(x - 1, z);
                const pz = this.getY(x, z + 1);
                const nz = this.getY(x, z - 1);

                geometries.push(pyGeometry.clone().applyMatrix4(matrix));

                if ((px !== h && px !== h + 1) || x === 0) {

                    geometries.push(pxGeometry.clone().applyMatrix4(matrix));

                }

                if ((nx !== h && nx !== h + 1) || x === this.worldWidth - 1) {

                    geometries.push(nxGeometry.clone().applyMatrix4(matrix));

                }

                if ((pz !== h && pz !== h + 1) || z === this.worldDepth - 1) {

                    geometries.push(pzGeometry.clone().applyMatrix4(matrix));

                }

                if ((nz !== h && nz !== h + 1) || z === 0) {

                    geometries.push(nzGeometry.clone().applyMatrix4(matrix));

                }

            }

        }

        const debugSceneData = {};
        const geometry = BufferGeometryUtils.mergeGeometries(geometries);
        geometry.computeBoundingSphere();
        debugSceneData.geometry = geometry;

        const texture = this.assetsLoaders.getLoader(THREE.TextureLoader).load('textures/minecraft/atlas.png');
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        debugSceneData.texture = texture;

        const material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.FrontSide });
        debugSceneData.material = material;
        this.rtVar.v("debug.render.material.wireframe").on("change", ((material, ev) => {
            material.wireframe = ev.new;
            material.needsUpdate = true;
        }).bind(this, material));

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        debugSceneData.mesh = mesh;

        const ambientLight = new THREE.AmbientLight(0xeeeeee, 1);
        this.scene.add(ambientLight);
        debugSceneData.ambientLight = ambientLight;

        const directionalLight = new THREE.DirectionalLight(0xffffff, 12);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
        debugSceneData.directionalLight = directionalLight;

        this.debugSceneData = debugSceneData;
    };

    generateHeight(width, height) {

        const data = [], perlin = new ImprovedNoise(),
            size = width * height, z = Math.random() * 100;

        let quality = 2;

        for (let i = 0; i < size; i++) data[i] = 0;

        for (let j = 0; j < 4; j++) {

            for (let i = 0; i < size; i++) {

                const x = i % width, y = (i / width) | 0;
                data[i] += perlin.noise(x / quality, y / quality, z) * quality;

            }

            quality *= 4;

        }

        return data;

    };

};
