import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import Soldier from "../models/soldier"
import ArScene from "./arScene";


export default class DemoScene extends ArScene {
  constructor(container, armiesInfo, currentUserId, gameController) {
    super(container, armiesInfo, currentUserId, gameController)
  }

  createStuffs() {
    let markerIndex = 0
    Object.keys(this.armiesInfo).forEach((playerId, playerIndex) => {
      this.armiesInfo[playerId]["army"].forEach((soldierData, soldierIndex, soldierArr) => {
        const markerRoot = this.markers[markerIndex]
        markerRoot.position.x = soldierIndex * 4  - (soldierArr.length-1) * 4 / 2
        markerRoot.position.y = 0
        markerRoot.position.z = playerIndex * 4 - 2
        this.soldiers.push(
          new Soldier(
            playerId,
            soldierData,
            this.armiesInfo[playerId]["color"],
            markerRoot,
            this.onRenderFcts
          )
        )
        markerIndex += 1
      })
    })
  }

  initScene() {
    // init renderer
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0.5)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.domElement.style.position = "absolute"
    this.renderer.domElement.style.top = "0px"
    this.renderer.domElement.style.left = "0px"
    this.container.appendChild(this.renderer.domElement)

    // array of functions for the rendering loop
    this.onRenderFcts = []

    // init scene and camera
    this.scene = new THREE.Scene()

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.scene.add(this.camera)

    // Add a basic light
    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
    this.scene.add(light)


    // Adding some helpers
    const size = 10;
    const divisions = 10;
    const gridHelper = new THREE.GridHelper( size, divisions );
    this.scene.add( gridHelper );

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.update();

    this.camera.position.z = 5;
    this.camera.position.y = 4;
    this.camera.rotation.x -= Math.PI/4;

    // Create the marker roots
    this.imageMarkers.forEach((imageMarker, i) => {
      const markerRoot = new THREE.Group()
      markerRoot.name = imageMarker
      markerRoot.isMarker = true
      markerRoot.position.x = 999
      markerRoot.position.y = 999
      markerRoot.position.z = 999
      this.scene.add(markerRoot)
      this.markers.push(markerRoot)
    })

    document.addEventListener("keydown", (event) => {
      const soldier = this.soldiers.find((soldier) => soldier.selected)
      console.log(soldier);
      if (!soldier) {
        return;
      }
      switch (event.key) {
        case "ArrowUp":
          soldier.marker.position.z -= 0.1
          break;
        case "ArrowDown":
          soldier.marker.position.z += 0.1
          break;
        case "ArrowRight":
          soldier.marker.position.x += 0.1
          break;
        case "ArrowLeft":
          soldier.marker.position.x -= 0.1
          break;
        default:
          break;
      }
    })
    
    this.createStuffs()

    //////////////////////////////////////////////////////////////////////////////////
    //		render the whole thing on the page
    //////////////////////////////////////////////////////////////////////////////////

    // render the scene
    this.onRenderFcts.push(() => {
      this.renderer.render(this.scene, this.camera)
    })

    // run the rendering loop
    var lastTimeMsec = null
    const animate = (nowMsec) => {
      // keep looping
      requestAnimationFrame(animate)

      this.controls.update();

      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
      var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
      lastTimeMsec = nowMsec
      // call each update function
      this.onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
      })
    }
    requestAnimationFrame(animate)
    console.log("DemoScene initialized")
  }
}
