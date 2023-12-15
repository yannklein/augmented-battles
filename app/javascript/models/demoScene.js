import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Soldier from "../models/soldier"


export default class DemoScene {
  constructor(container, armiesInfo, currentUser, gameController) {
    this.imageMarkerFolder = "/characters/markers/"
    this.imageMarkers = ["m1", "m2", "m3", "m4", "m5", "m6"]

    this.container = container
    this.armiesInfo = armiesInfo
    this.currentUser = currentUser
    this.gameController = gameController
    
    this.soldiers = []
    this.soldierSelected = false
    this.markers = []

    this.initScene()
    console.log("DemoScene initialized")
  }

  createStuffs() {
    let markerIndex = 0
    Object.keys(this.armiesInfo).forEach((player, playerIndex) => {
      this.armiesInfo[player]["army"].forEach((soldier, soldierIndex, soldierArr) => {
        const markerRoot = this.markers[markerIndex]
        markerRoot.position.x = soldierIndex * 4  - (soldierArr.length-1) * 4 / 2
        markerRoot.position.y = 0
        markerRoot.position.z = playerIndex * 4 - 2
        this.soldiers.push(
          new Soldier(
            player,
            soldier,
            this.armiesInfo[player]["color"],
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
    // this.renderer.setClearColor(new THREE.Color("lightgrey"), 0)
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
  }

  performAction(soldier) {
    // check actions
    console.log(this.gameController.turn)
    switch (this.gameController.turn) {
      case "move":
        console.log("start move action")
        // if current player's soldier, select and move it
        if (soldier.player == this.currentUser) {
          this.unSelectAll()
          soldier.select()
          soldier.showMoveRange()
          this.soldierSelected = soldier
        }
        break
      case "attack":
      case "fight":
        console.log("start attack action")
        // if current player's soldier, select it
        if (soldier.player == this.currentUser) {
          this.soldiers.forEach((sol) => {
            sol.unSelect()
            sol.removeAttackArrow()
          })
          this.gameController.setTurn("attack")
          soldier.select()
          soldier.showAttackRange()
          this.soldierSelected = soldier
        }
        // if opponent player and own soldier selected, attack!
        else if (this.soldierSelected) {
          this.soldiers.forEach((sol) => {
            sol.removeAttackArrow()
            if (sol != this.soldierSelected) {
              sol.unSelect()
            }
          })
          soldier.select()
          this.soldierSelected.attack(soldier)
          this.gameController.setTurn("fight")
        }
        break
      default:
        console.log("no action")
        break
    }
  }

  onSelect(event) {
    console.log(this.gameController.turn)
    // if defense mode no selection possible
    if (this.gameController.turn == "defense") {
      return
    }

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    const pointer = new THREE.Vector2(0, 0)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    // update the picking ray with the camera and pointer position
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, this.camera)

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(this.markers)

    // unselect all and return if no soldier selected
    console.log(intersects.length)
    if (intersects.length == 0) {
      this.unSelectAll()
      return
    }

    // retrieve the intersecting soldier
    // intersects is an array of JS obj with a key object containing the soldier part (base or asset)
    const intersectedSoldierPart = intersects.find(
      (inters) => inters.object.marker
    ).object
    this.performAction(intersectedSoldierPart.soldier)
  }

  unSelectAll() {
    this.soldiers.forEach((soldier) => soldier.unSelect())
    this.soldierSelected = null
    if (this.gameController.turn == "fight") {
      this.gameController.setTurn("attack")
    }
    console.log("unselect all")
  }
}
