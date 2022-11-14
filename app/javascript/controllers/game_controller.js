import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import Soldier from "../models/soldier";
THREEx.ArToolkitContext.baseURL = "/";

// Connects to data-controller="game"
export default class extends Controller {
  static targets = ["container"];
  static values = {
    armies: Object,
  };

  connect() {
    console.log(this.armiesValue);
    this.imageMarkerFolder = "/characters/markers/";
    this.imageMarkers = ["m1", "m2", "m3", "m4", "m5", "m6"];
    this.playerColor = ['#ff0000', '#00ff00']
    this.initARJS();
  }

  initARJS() {
   // init renderer
		this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      autoResize: true,
      alpha: true
		});
		this.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.domElement.style.position = 'absolute'
		this.renderer.domElement.style.top = '0px'
		this.renderer.domElement.style.left = '0px'
		document.body.appendChild(this.renderer.domElement);

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
      setTimeout(() => {
        onResize();
      }, 200);
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
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerWidth,
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
        patternUrl: `${this.imageMarkerFolder}pattern-${marker.name}.patt`,
        // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
      })
    });

    return arToolkitContext;
  }

  createStuffs(){
    let markerIndex = 0;
    Object.keys(this.armiesValue).forEach((player) => {
      this.armiesValue[player]['army'].forEach((soldier) => {
        const markerRoot = this.markers[markerIndex]
        new Soldier(soldier, this.armiesValue[player]['color'], markerRoot)
        markerIndex += 1;
      });
    });
  }
}
