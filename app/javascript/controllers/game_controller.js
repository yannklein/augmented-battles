import { Controller } from "@hotwired/stimulus";
// import "mind-ar/dist/mindar-image-three.prod.js";
import porcelainImg from "/public/matcap-porcelain-white.jpg";
import * as THREE from "three";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader"
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
THREEx.ArToolkitContext.baseURL = "/";

// Connects to data-controller="game"
export default class extends Controller {
  static targets = ["container"];
  static values = {
    armies: Object,
  };

  connect() {
    console.log("Hello from GamesController");
    this.imageTargetUrl = "/characters/targets.mind";
    this.imageAssetUrl = "/characters/3dAssets/";
    this.imageTargets = [
      "alien",
      "ancestor",
      "black_hole",
      "eva",
      "gaia",
      "god_eye",
      "light_cone",
      "lilith",
      "nova",
      "ocean",
      "octopod",
      "omni_eye",
      "rising_sun",
      "shell",
      "triangle",
    ];
    this.imageTargetMax = 5;
    this.cameraParam = THREEx.ArToolkitContext.baseURL + "camera_para.dat";
    console.log(this.armiesValue);
    // this.initMindAR();
    // console.log(this.mindarThree);
    this.initARJS(() => {
      const gameSoldiers = this.flattenArmies(this.armiesValue);
      gameSoldiers.forEach((soldier, index) => {
        this.createSoldier(soldier, index);
      });
    });
  }

  initARJS(stuffsToMake) {
    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    this.renderer.setSize(640, 480);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    this.element.appendChild(this.renderer.domElement);

    // array of functions for the rendering loop
    this.onRenderFcts = [];

    // init scene and camera
    this.scene = new THREE.Scene();

    // Create a camera
    this.camera = new THREE.Camera();
    this.scene.add(this.camera);

    // Handle arToolkitSource
    this.arToolkitSource = new THREEx.ArToolkitSource({
      // to read from the webcam
      sourceType: "webcam",
      sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
      sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
    });

    this.arToolkitSource.init(() => {
      this.arToolkitSource.domElement.addEventListener("canplay", () => {
        console.log(
          "canplay",
          "actual source dimensions",
          this.arToolkitSource.domElement.videoWidth,
          this.arToolkitSource.domElement.videoHeight
        );

        this.initARContext();
      });

      window.arToolkitSource = this.arToolkitSource;
    });

    // handle resize
    window.addEventListener("resize", () => {
      this.onResize();
    });

    window.close = () => {
      this.disposeARContext();
      this.disposeARSource();
    };

    // update artoolkit on every frame
    this.onRenderFcts.push( () => {
      if (!this.arToolkitContext || !this.arToolkitSource || !this.arToolkitSource.ready) {
        return;
      }

      this.arToolkitContext.update(this.arToolkitSource.domElement);

      // update scene.visible if the marker is seen
      this.scene.visible = this.camera.visible;
    });

    // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
    this.scene.visible = false;

    // stuff to make here!
    stuffsToMake();

    // render the scene
    this.onRenderFcts.push(() => {
      this.renderer.render(this.scene, this.camera);
    });

    // run the rendering loop
    let lastTimeMsec = null;
    const animate = (nowMsec) => {
      // keep looping
      requestAnimationFrame(animate);
      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      let deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      // call each update function
      this.onRenderFcts.forEach((onRenderFct) => {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
      });
    };
    requestAnimationFrame(animate);
  }

  onResize() {
    this.arToolkitSource.onResizeElement();
    this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
    if (window.arToolkitContext.arController !== null) {
      this.arToolkitSource.copyElementSizeTo(
        window.arToolkitContext.arController.canvas
      );
    }
  }

  // Initialize arToolkitContext
  initARContext() {
    console.log("initARContext()");

    // CONTEXT
    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: this.cameraParam,
      detectionMode: "mono_and_matrix",
      matrixCodeType: "3x3",
      patternRatio: 0.5,

      // canvasWidth: arToolkitSource.domElement.videoWidth,
      // canvasHeight: arToolkitSource.domElement.videoHeight
    });

    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());

      this.arToolkitContext.arController.orientation = this.getSourceOrientation();
      this.arToolkitContext.arController.options.orientation =
        this.getSourceOrientation();

      console.log("arToolkitContext", this.arToolkitContext);
      window.arToolkitContext = this.arToolkitContext;
    });

    // MARKER
    this.arMarkerControls = new THREEx.ArMarkerControls(
      this.arToolkitContext,
      this.camera,
      {
        type : 'pattern',
        patternUrl : THREEx.ArToolkitContext.baseURL + './patt.hiro',
        // type: "barcode",
        // barcodeValue: 0,
        smooth: true,
        changeMatrixMode: "cameraTransformMatrix",
      }
    );

    console.log("ArMarkerControls", this.arMarkerControls);
    window.arMarkerControls = this.arMarkerControls;
  }

  getSourceOrientation() {
    if (!this.arToolkitSource) {
      return null;
    }

    console.log(
      "actual source dimensions",
      this.arToolkitSource.domElement.videoWidth,
      this.arToolkitSource.domElement.videoHeight
    );

    if (
      this.arToolkitSource.domElement.videoWidth >
      this.arToolkitSource.domElement.videoHeight
    ) {
      console.log("source orientation", "landscape");
      return "landscape";
    } else {
      console.log("source orientation", "portrait");
      return "portrait";
    }
  }

  disposeARSource() {
    console.log("disposeARSource()");

    const video = document.querySelector("#arjs-video");

    if (video) {
      video?.srcObject?.getTracks().map((track) => track.stop());
      video.remove();
    }

    this.arToolkitSource = null;
  }

  disposeARContext() {
    console.log("disposeARContext()");

    if (this.arToolkitContext?.arController?.cameraParam?.dispose) {
      this. arToolkitContext.arController.cameraParam.dispose();
    }

    if (this.arToolkitContext?.arController?.dispose) {
      this.arToolkitContext.arController.dispose();
    }

    this.arToolkitContext = null;
  }

  // async start() {
  //   const { renderer, scene, camera } = this.mindarThree;
  //   await this.mindarThree.start();
  //   renderer.setAnimationLoop(() => {
  //     renderer.render(scene, camera);
  //   });
  // }

  // async stop() {
  //   this.mindarThree.stop();
  //   this.mindarThree.renderer.setAnimationLoop(null);
  // }

  // initMindAR() {
  //   THREE = window.MINDAR.IMAGE.THREE;
  //   this.mindarThree = new window.MINDAR.IMAGE.MindARThree({
  //     container: this.containerTarget,
  //     maxTrack: this.imageTargetMax,
  //     imageTargetSrc: this.imageTargetUrl,
  //   });
  //   const gameSoldiers = this.flattenArmies(this.armiesValue);
  //   gameSoldiers.forEach((soldier, index) => {
  //     this.createSoldier(soldier, index);
  //   });
  //   this.start();
  // }

  createSoldier(soldier, anchorIndex) {
    const soldierGroup = new THREE.Group();
    soldierGroup.name = `${soldier.name}-${anchorIndex}`;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = 0.1;
    soldierGroup.add(plane);

    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(soldier.max_distance / 5, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.2,
      })
    );
    soldierGroup.add(circle);

    {
      const manager = new THREE.LoadingManager();
      const textureLoader = new THREE.TextureLoader(manager);
      textureLoader.load(porcelainImg, (porcelain) => {
        const material = new THREE.MeshMatcapMaterial({
          side: THREE.DoubleSide,
          matcap: porcelain,
        });
        const loader = new STLLoader();
        loader.load(
          `${this.imageAssetUrl}${soldier.category}.stl`,
          (geometry) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(0.05, 0.05, 0.05);
            soldierGroup.add(mesh);
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
          },
          (error) => {
            console.log(error);
          }
        );
      });
    }

    const text = `${soldier.name} ${soldier.skirmish_power}/${soldier.distance_power}`;
    const fontSize = 12;
    const mesh = this.addText(text, fontSize);
    soldierGroup.add(mesh);

    this.scene.add(soldierGroup);
  }

  addText(text, fontSize) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const metrics = context.measureText(text);
    const textWidth = this.roundUp(metrics.width + 20.0, 2);
    const textHeight = this.roundUp(fontSize + 10.0, 2);
    canvas.width = textWidth;
    canvas.height = textHeight;
    context.font = `${fontSize}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#000000";
    context.fillText(text, textWidth / 2, textHeight / 2);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      //color: 0xffffff,
      //useScreenCoordinates: false
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(textWidth / 60, textHeight / 60, 10, 10),
      material
    );

    mesh.position.y = 0;
    mesh.position.z = 0.2;
    mesh.position.x = 0;
    return mesh;
  }

  flattenArmies(armies) {
    return Object.values(armies).flat();
  }

  roundUp(numToRound, multiple) {
    let value = multiple;
    while (value < numToRound) {
      value = value * multiple;
    }
    return value;
  }
}
