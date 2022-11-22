import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import Soldier from "../models/soldier";

THREEx.ArToolkitContext.baseURL = "/";

export default class ArScene {
  constructor(container, armiesInfo, currentUser) {
    this.imageMarkerFolder = "/characters/markers/";
    this.imageMarkers = ["m1", "m2", "m3", "m4", "m5", "m6"];

    // raycasting variables
    this.container = container;
    this.pointer = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();

    this.armiesInfo = armiesInfo;
    this.currentUser = currentUser;
    this.soldiers = [];
    this.soldierSelected = false;
    this.markers = [];

    this.initScene();
  }

  createStuffs() {
    let markerIndex = 0;
    Object.keys(this.armiesInfo).forEach((player) => {
      this.armiesInfo[player]["army"].forEach((soldier) => {
        const markerRoot = this.markers[markerIndex];
        this.soldiers.push(
          new Soldier(
            player,
            soldier,
            this.armiesInfo[player]["color"],
            markerRoot
          )
        );
        markerIndex += 1;
      });
    });
  }

  initScene(callback) {
    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      autoResize: true,
      alpha: true,
    });
    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    this.container.appendChild(this.renderer.domElement);

    // array of functions for the rendering loop
    const onRenderFcts = [];
    // let arToolkitContext, markerControls
    let arToolkitContext;
    // init scene and camera
    this.scene = new THREE.Scene();

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.scene.add(this.camera);

    // Create the marker roots
    this.imageMarkers.forEach((imageMarker) => {
      const markerRoot = new THREE.Group();
      markerRoot.name = imageMarker;
      markerRoot.isMarker = true;
      this.scene.add(markerRoot);
      this.markers.push(markerRoot);
    });

    ////////////////////////////////////////////////////////////////////////////////
    //          handle arToolkitSource
    ////////////////////////////////////////////////////////////////////////////////

    const arToolkitSource = new THREEx.ArToolkitSource({
      // to read from the webcam
      sourceType: "webcam",

      // to read from an image
      // sourceType : 'image',
      // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

      // to read from a video
      // sourceType : 'video',
      // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
    });

    arToolkitSource.init(() => {
      arToolkitContext = this.initARContext(arToolkitSource);
      setTimeout(() => {
        onResize();
      }, 200);
      onResize();
    });

    // handle resize
    window.addEventListener("resize", () => {
      onResize();
    });
    const onResize = () => {
      arToolkitSource.onResizeElement();
      arToolkitSource.copyElementSizeTo(this.renderer.domElement);
      if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
      }
    };

    // update artoolkit on every frame
    onRenderFcts.push(() => {
      if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
        return;
      }

      arToolkitContext.update(arToolkitSource.domElement);
    });

    this.createStuffs();

    //////////////////////////////////////////////////////////////////////////////////
    //		render the whole thing on the page
    //////////////////////////////////////////////////////////////////////////////////

    // render the scene
    onRenderFcts.push(() => {
      this.renderer.render(this.scene, this.camera);
    });

    // run the rendering loop
    var lastTimeMsec = null;
    const animate = (nowMsec) => {
      // keep looping
      requestAnimationFrame(animate);
      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      // call each update function
      onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
      });
    };
    requestAnimationFrame(animate);
  }

  initARContext(arToolkitSource) {
    const getSourceOrientation = () => {
      if (!arToolkitSource) {
        return null;
      }

      console.log(
        "actual source dimensions",
        arToolkitSource.domElement.videoWidth,
        arToolkitSource.domElement.videoHeight
      );

      if (
        arToolkitSource.domElement.videoWidth >
        arToolkitSource.domElement.videoHeight
      ) {
        console.log("source orientation", "landscape");
        return "landscape";
      } else {
        console.log("source orientation", "portrait");
        return "portrait";
      }
    };

    console.log("initARContext()");
    // create atToolkitContext
    const arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: THREEx.ArToolkitContext.baseURL + "camera_para.dat",
      detectionMode: "mono",
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
    });
    // initialize it
    arToolkitContext.init(() => {
      // copy projection matrix to camera
      this.camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      arToolkitContext.arController.orientation = getSourceOrientation();
      arToolkitContext.arController.options.orientation =
        getSourceOrientation();

      console.log("arToolkitContext", arToolkitContext);
      window.arToolkitContext = arToolkitContext;
    });
    // build markerControls for markerRoot1
    this.markers.forEach((marker) => {
      new THREEx.ArMarkerControls(arToolkitContext, marker, {
        type: "pattern",
        patternUrl: `${this.imageMarkerFolder}pattern-${marker.name}.patt`,
        // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
      });
    });

    return arToolkitContext;
  }

  performAction(soldier, turn) {
    // unselect all and return if no soldier selected
    if (!soldier) {
      this.soldiers.forEach((soldier) => soldier.unselect());
      this.soldierSelected = false;
      console.log("unselect all");
      return;
    }

    // check actions
    switch (turn) {
      case "move":
        console.log("start move action");
        // if current player's soldier, select and move it
        if (soldier.player != this.currentUser && !this.soldierSelected) {
          this.soldiers.forEach((soldier) => soldier.unselect());
          soldier.select();
          soldier.move();
          this.soldierSelected = true;
        }
        break;
      case "attack":
        console.log("start attack action");
        // if current player's soldier, select it
        if (soldier.player == this.currentUser) {
          soldier.select();
          this.soldierSelected = true;
        }
        // if opponent player and own soldier selected, attack!
        else if (this.soldierSelected) {
          soldier.attack();
          soldier.unselect();
          this.soldierSelected = false;
        }
        break;

      default:
        console.log("no action");
        break;
    }
  }

  onSelect(turn, event) {
    // if defense mode no selection possible
    if (turn == "defense") {
      return;
    }

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.markers.map((marker) => marker.base)
    );

    //iterate over all the intersected objects
    // intersects.forEach((intersect) => {
    // });

    // retrieve the intersecting soldier
    const currentMarker = intersects.find(inters => inters?.object.marker)?.object.marker;
    console.log(currentMarker);
    const soldier = this.soldiers.find( sold => sold.marker === currentMarker)
    console.log(soldier);

    this.performAction(soldier, turn)
  }
}
