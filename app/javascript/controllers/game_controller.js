import { Controller } from "@hotwired/stimulus";
// import "mind-ar/dist/mindar-image-three.prod.js";
import porcelainImg from "/public/matcap-porcelain-white.jpg";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
THREEx.ArToolkitContext.baseURL = "/";

// Connects to data-controller="game"
export default class extends Controller {
  static targets = ["container"];
  static values = {
    armies: Object,
  };

  connect() {
    // console.log("Hello from GamesController");
    // // this.imageTargetUrl = "/characters/targets.mind";
    // this.imageMarkerFolder = "/characters/markers/";
    this.imageMarkers = ["m1", "m2", "m3", "m4", "m5", "m6"];
    // this.imageAssetUrl = "/characters/3dAssets/";
    // // this.imageTargets = [
    // //   "alien",
    // //   "ancestor",
    // //   "black_hole",
    // //   "eva",
    // //   "gaia",
    // //   "god_eye",
    // //   "light_cone",
    // //   "lilith",
    // //   "nova",
    // //   "ocean",
    // //   "octopod",
    // //   "omni_eye",
    // //   "rising_sun",
    // //   "shell",
    // //   "triangle",
    // // ];
    // this.imageTargetMax = 5;
    // this.cameraParam = THREEx.ArToolkitContext.baseURL + "camera_para.dat";
    // console.log(this.armiesValue);
    // // this.initMindAR();
    // // console.log(this.mindarThree);
    this.initARJS();
  }

  makeStuff() {
    const gameSoldiers = this.flattenArmies(this.armiesValue);
    console.log(this.markers);
    gameSoldiers.forEach((soldier, index) => {
      this.createSoldier(soldier, index, this.markers[index]);
    });
  }

  initARJS() {
   // init renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
		this.renderer.setSize(640, 480);
		this.renderer.domElement.style.position = 'absolute'
		this.renderer.domElement.style.top = '0px'
		this.renderer.domElement.style.left = '0px'
		this.element.appendChild(this.renderer.domElement);

		// array of functions for the rendering loop
		const onRenderFcts = [];
		// let arToolkitContext, markerControls;
    let arToolkitContext;
		// init scene and camera
		const scene = new THREE.Scene();

		//////////////////////////////////////////////////////////////////////////////////
		//		Initialize a basic camera
		//////////////////////////////////////////////////////////////////////////////////

		// Create a camera
		this.camera = new THREE.Camera();
		scene.add(this.camera);

    // Create the marker roots
    this.markers = []
    this.imageMarkers.forEach((imageMarker) => {
      const markerRoot = new THREE.Group;
      markerRoot.name = imageMarker;
      scene.add(markerRoot);
      this.markers.push(markerRoot);
    });

		////////////////////////////////////////////////////////////////////////////////
		//          handle arToolkitSource
		////////////////////////////////////////////////////////////////////////////////

		const arToolkitSource = new THREEx.ArToolkitSource({
			// to read from the webcam
			sourceType: 'webcam',

			// to read from an image
			// sourceType : 'image',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

			// to read from a video
			// sourceType : 'video',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
		})

		arToolkitSource.init(() =>  {
			arToolkitContext = this.initARContext(arToolkitSource)
			onResize()
		})

		// handle resize
		window.addEventListener('resize', () => {
			onResize()
		})
		const onResize = () => {
			arToolkitSource.onResizeElement()
			arToolkitSource.copyElementSizeTo(this.renderer.domElement)
			if (arToolkitContext.arController !== null) {
				arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
			}
		}

		// update artoolkit on every frame
		onRenderFcts.push(() => {
			if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
				return;
			}

			arToolkitContext.update(arToolkitSource.domElement)
		})

		this.createStuffs();

		//////////////////////////////////////////////////////////////////////////////////
		//		render the whole thing on the page
		//////////////////////////////////////////////////////////////////////////////////

		// render the scene
		onRenderFcts.push(() => {
			this.renderer.render(scene, this.camera);
		})

		// run the rendering loop
		var lastTimeMsec = null
    const animate = (nowMsec) => {
      // keep looping
			requestAnimationFrame(animate);
			// measure time
			lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
			var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
			lastTimeMsec = nowMsec
			// call each update function
			onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
			})
		}
    requestAnimationFrame(animate)






    // // init renderer
    // this.renderer = new THREE.WebGLRenderer({
    //   antialias: true,
    //   alpha: true,
    // });
    // this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    // this.renderer.setSize(640, 480);
    // this.renderer.domElement.style.position = "absolute";
    // this.renderer.domElement.style.top = "0px";
    // this.renderer.domElement.style.left = "0px";
    // this.element.appendChild(this.renderer.domElement);

    // // array of functions for the rendering loop
    // this.onRenderFcts = [];
    
    // // init scene and camera
    // this.scene = new THREE.Scene();
    
    // // Create a camera
    // this.camera = new THREE.Camera();
    // this.scene.add(this.camera);
    
    // // Create markers array
    // this.markers = [];
    // this.imageMarkers.forEach((imageMarker) => {
    //   const markerRoot = new THREE.Group;
    //   markerRoot.name = imageMarker;
    //   this.scene.add(markerRoot);
    //   this.markers.push(markerRoot);
    // });

    // // Handle arToolkitSource
    // this.arToolkitSource = new THREEx.ArToolkitSource({
    //   // to read from the webcam
    //   sourceType: "webcam",
    //   sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
    //   sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
    // });

    // this.arToolkitSource.init(() => {
    //   this.arToolkitSource.domElement.addEventListener("canplay", () => {
    //     console.log(
    //       "canplay",
    //       "actual source dimensions",
    //       this.arToolkitSource.domElement.videoWidth,
    //       this.arToolkitSource.domElement.videoHeight
    //     );

    //     this.initARContext();
    //   });

    //   window.arToolkitSource = this.arToolkitSource;
    // });

    // // handle resize
    // window.addEventListener("resize", () => {
    //   this.onResize();
    // });

    // window.close = () => {
    //   this.disposeARContext();
    //   this.disposeARSource();
    // };

    // // update artoolkit on every frame
    // this.onRenderFcts.push(() => {
    //   if (
    //     !this.arToolkitContext ||
    //     !this.arToolkitSource ||
    //     !this.arToolkitSource.ready
    //   ) {
    //     return;
    //   }

    //   this.arToolkitContext.update(this.arToolkitSource.domElement);

    //   // update scene.visible if the marker is seen
    //   this.scene.visible = this.camera.visible;
    // });

    // // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
    // this.scene.visible = false;


    // this.makeStuff();

    // // render the scene
    // this.onRenderFcts.push(() => {
    //   this.renderer.render(this.scene, this.camera);
    // });

    // // run the rendering loop
    // let lastTimeMsec = null;
    // const animate = (nowMsec) => {
    //   // keep looping
    //   requestAnimationFrame(animate);
    //   // measure time
    //   lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    //   let deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    //   lastTimeMsec = nowMsec;
    //   // call each update function
    //   this.onRenderFcts.forEach((onRenderFct) => {
    //     onRenderFct(deltaMsec / 1000, nowMsec / 1000);
    //   });
    // };
    // requestAnimationFrame(animate);
  }

  createStuffs(){
    this.markers.forEach((marker) => {
      // add a gizmo in the center of the marker
      var geometry = new THREE.OctahedronGeometry(0.1, 0)
      var material = new THREE.MeshNormalMaterial({
        wireframe: true
      });
      var mesh = new THREE.Mesh(geometry, material);
      marker.add(mesh);
    });
  }

  initARContext(arToolkitSource){
    const getSourceOrientation = () => {
			if (!arToolkitSource) {
				return null;
			}

			console.log(
				'actual source dimensions',
				arToolkitSource.domElement.videoWidth,
				arToolkitSource.domElement.videoHeight
			);

			if (arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight) {
				console.log('source orientation', 'landscape');
				return 'landscape';
			} else {
				console.log('source orientation', 'portrait');
				return 'portrait';
			}
		}

    console.log('initARContext()');
    // create atToolkitContext
    const arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'camera_para.dat',
      detectionMode: 'mono',
    })
    // initialize it
    arToolkitContext.init(() => {
      // copy projection matrix to camera
      this.camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      arToolkitContext.arController.orientation = getSourceOrientation();
      arToolkitContext.arController.options.orientation = getSourceOrientation();

      console.log('arToolkitContext', arToolkitContext);
      window.arToolkitContext = arToolkitContext;
    })
    // build markerControls for markerRoot1
    this.markers.forEach((marker) => {
      new THREEx.ArMarkerControls(arToolkitContext, marker, {
        type: 'pattern',
        patternUrl: `${THREEx.ArToolkitContext.baseURL}characters/markers/pattern-${marker.name}.patt`,
        // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
      })
    });

    return arToolkitContext;
  }

  // onResize() {
  //   this.arToolkitSource.onResizeElement();
  //   this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
  //   if (window.arToolkitContext.arController !== null) {
  //     this.arToolkitSource.copyElementSizeTo(
  //       window.arToolkitContext.arController.canvas
  //     );
  //   }
  // }

  // Initialize arToolkitContext
  // initARContext() {
  //   console.log("initARContext()");

  //   // CONTEXT
  //   this.arToolkitContext = new THREEx.ArToolkitContext({
  //     cameraParametersUrl: this.cameraParam,
  //     detectionMode: "mono_and_matrix",
  //     matrixCodeType: "3x3",
  //     patternRatio: 0.5,

  //     // canvasWidth: arToolkitSource.domElement.videoWidth,
  //     // canvasHeight: arToolkitSource.domElement.videoHeight
  //   });

  //   this.arToolkitContext.init(() => {
  //     this.camera.projectionMatrix.copy(
  //       this.arToolkitContext.getProjectionMatrix()
  //     );

  //     this.arToolkitContext.arController.orientation =
  //       this.getSourceOrientation();
  //     this.arToolkitContext.arController.options.orientation =
  //       this.getSourceOrientation();

  //     console.log("arToolkitContext", this.arToolkitContext);
  //     window.arToolkitContext = this.arToolkitContext;

  //   });

  //   // Create markers
  //   this.markers.forEach(marker => this.createMarker(marker));
  //   console.log(this.markers);

  //   // console.log("ArMarkerControls", this.arMarkerControls);
  //   // window.arMarkerControls = this.arMarkerControls;
  // }

  // createMarker(marker) {
  //   new THREEx.ArMarkerControls(this.arToolkitContext, marker, {
  //     type: "pattern",
  //     patternUrl: `${this.imageMarkerFolder}pattern-${marker.name}.patt`,
  //     // type: "barcode",
  //     // barcodeValue: 0,
  //     smooth: true,
  //     changeMatrixMode: "cameraTransformMatrix",
  //   });
  // }

  // getSourceOrientation() {
  //   if (!this.arToolkitSource) {
  //     return null;
  //   }

  //   console.log(
  //     "actual source dimensions",
  //     this.arToolkitSource.domElement.videoWidth,
  //     this.arToolkitSource.domElement.videoHeight
  //   );

  //   if (
  //     this.arToolkitSource.domElement.videoWidth >
  //     this.arToolkitSource.domElement.videoHeight
  //   ) {
  //     console.log("source orientation", "landscape");
  //     return "landscape";
  //   } else {
  //     console.log("source orientation", "portrait");
  //     return "portrait";
  //   }
  // }

  // disposeARSource() {
  //   console.log("disposeARSource()");

  //   const video = document.querySelector("#arjs-video");

  //   if (video) {
  //     video?.srcObject?.getTracks().map((track) => track.stop());
  //     video.remove();
  //   }

  //   this.arToolkitSource = null;
  // }

  // disposeARContext() {
  //   console.log("disposeARContext()");

  //   if (this.arToolkitContext?.arController?.cameraParam?.dispose) {
  //     this.arToolkitContext.arController.cameraParam.dispose();
  //   }

  //   if (this.arToolkitContext?.arController?.dispose) {
  //     this.arToolkitContext.arController.dispose();
  //   }

  //   this.arToolkitContext = null;
  // }

  // createSoldier(soldier, index, markerRoot) {
  //   console.log(markerRoot);
  //   const soldierGroup = new THREE.Group;
  //   soldierGroup.name = `${soldier.name}-${index}`;

  //   const geometry = new THREE.PlaneGeometry(1, 1);
  //   const material = new THREE.MeshBasicMaterial({
  //     color: 0xffffff,
  //     transparent: true,
  //     opacity: 0.8,
  //   });
  //   const plane = new THREE.Mesh(geometry, material);
  //   plane.position.z = 0.1;
  //   soldierGroup.add(plane);

  //   const circle = new THREE.Mesh(
  //     new THREE.CircleGeometry(soldier.max_distance / 5, 32),
  //     new THREE.MeshBasicMaterial({
  //       color: 0xffff00,
  //       transparent: true,
  //       opacity: 0.2,
  //     })
  //   );
  //   soldierGroup.add(circle);

  //   {
  //     const manager = new THREE.LoadingManager();
  //     const textureLoader = new THREE.TextureLoader(manager);
  //     textureLoader.load(porcelainImg, (porcelain) => {
  //       const material = new THREE.MeshMatcapMaterial({
  //         side: THREE.DoubleSide,
  //         matcap: porcelain,
  //       });
  //       const loader = new STLLoader();
  //       loader.load(
  //         `${this.imageAssetUrl}${soldier.category}.stl`,
  //         (geometry) => {
  //           const mesh = new THREE.Mesh(geometry, material);
  //           mesh.scale.set(0.05, 0.05, 0.05);
  //           soldierGroup.add(mesh);
  //         },
  //         (xhr) => {
  //           console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  //         },
  //         (error) => {
  //           console.log(error);
  //         }
  //       );
  //     });
  //   }

  //   const text = `${soldier.name} ${soldier.skirmish_power}/${soldier.distance_power}`;
  //   const fontSize = 12;
  //   const mesh = this.addText(text, fontSize);
  //   soldierGroup.add(mesh);

  //   markerRoot.add(soldierGroup);
  // }

  // addText(text, fontSize) {
  //   const canvas = document.createElement("canvas");
  //   const context = canvas.getContext("2d");
  //   const metrics = context.measureText(text);
  //   const textWidth = this.roundUp(metrics.width + 20.0, 2);
  //   const textHeight = this.roundUp(fontSize + 10.0, 2);
  //   canvas.width = textWidth;
  //   canvas.height = textHeight;
  //   context.font = `${fontSize}px Arial`;
  //   context.textAlign = "center";
  //   context.textBaseline = "middle";
  //   context.fillStyle = "#000000";
  //   context.fillText(text, textWidth / 2, textHeight / 2);
  //   const texture = new THREE.Texture(canvas);
  //   texture.needsUpdate = true;
  //   const material = new THREE.MeshBasicMaterial({
  //     map: texture,
  //     transparent: true,
  //     side: THREE.DoubleSide,
  //     //color: 0xffffff,
  //     //useScreenCoordinates: false
  //   });
  //   const mesh = new THREE.Mesh(
  //     new THREE.PlaneGeometry(textWidth / 60, textHeight / 60, 10, 10),
  //     material
  //   );

  //   mesh.position.y = 0;
  //   mesh.position.z = 0.2;
  //   mesh.position.x = 0;
  //   return mesh;
  // }

  // flattenArmies(armies) {
  //   return Object.values(armies).flat();
  // }

  // roundUp(numToRound, multiple) {
  //   let value = multiple;
  //   while (value < numToRound) {
  //     value = value * multiple;
  //   }
  //   return value;
  // }
}
