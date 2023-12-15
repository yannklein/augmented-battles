import * as THREE from "three"
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js"
import Soldier from "../models/soldier"

THREEx.ArToolkitContext.baseURL = "/"

export default class ArScene {
  constructor(container, armiesInfo, currentUser, gameController) {
    this.imageMarkerFolder = "/characters/markers/"
    this.imageMarkers = ["m1", "m2", "m3", "m4", "m5", "m6"]
    
    this.container = container
    this.armiesInfo = armiesInfo
    this.currentUser = currentUser
    this.gameController = gameController
    
    this.soldiers = []
    this.soldierSelected = null
    this.soldierAttacked = null
    this.markers = []
    
    this.initScene()
  }

  createStuffs() {
    let markerIndex = 0
    Object.keys(this.armiesInfo).forEach((player) => {
      this.armiesInfo[player]["army"].forEach((soldier) => {
        const markerRoot = this.markers[markerIndex]
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
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      autoResize: true,
      alpha: true,
    })
    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.domElement.style.position = "absolute"
    this.renderer.domElement.style.top = "0px"
    this.renderer.domElement.style.left = "0px"
    this.container.appendChild(this.renderer.domElement)

    // array of functions for the rendering loop
    this.onRenderFcts = []
    // let arToolkitContext, markerControls
    let arToolkitContext
    // init scene and camera
    this.scene = new THREE.Scene()

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    )
    this.scene.add(this.camera)

    // Add a basic light
    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
    this.scene.add(light)

    // Create the marker roots
    this.imageMarkers.forEach((imageMarker) => {
      const markerRoot = new THREE.Group()
      markerRoot.name = imageMarker
      markerRoot.isMarker = true
      markerRoot.position.x = 999
      markerRoot.position.y = 999
      markerRoot.position.z = 999
      this.scene.add(markerRoot)
      this.markers.push(markerRoot)
    })

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
    })

    arToolkitSource.init(() => {
      arToolkitContext = this.initARContext(arToolkitSource)
      setTimeout(() => {
        onResize()
      }, 200)
      onResize()
    })

    // handle resize
    window.addEventListener("resize", () => {
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
    this.onRenderFcts.push(() => {
      if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
        return
      }

      arToolkitContext.update(arToolkitSource.domElement)
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
    console.log("ArScene initialized")
  }

  initARContext(arToolkitSource) {
    const getSourceOrientation = () => {
      if (!arToolkitSource) {
        return null
      }

      console.log(
        "actual source dimensions",
        arToolkitSource.domElement.videoWidth,
        arToolkitSource.domElement.videoHeight
      )

      if (
        arToolkitSource.domElement.videoWidth >
        arToolkitSource.domElement.videoHeight
      ) {
        console.log("source orientation", "landscape")
        return "landscape"
      } else {
        console.log("source orientation", "portrait")
        return "portrait"
      }
    }

    console.log("initARContext()")
    // create atToolkitContext
    const arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: THREEx.ArToolkitContext.baseURL + "camera_para.dat",
      detectionMode: "mono",
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
    })
    // initialize it
    arToolkitContext.init(() => {
      // copy projection matrix to camera
      this.camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix())
      arToolkitContext.arController.orientation = getSourceOrientation()
      arToolkitContext.arController.options.orientation =
        getSourceOrientation()

      console.log("arToolkitContext", arToolkitContext)
      window.arToolkitContext = arToolkitContext
    })
    // build markerControls for markerRoot1
    this.markers.forEach((marker) => {
      new THREEx.ArMarkerControls(arToolkitContext, marker, {
        type: "pattern",
        patternUrl: `${this.imageMarkerFolder}pattern-${marker.name}.patt`,
        // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
      })
    })

    return arToolkitContext
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
          this.soldierAttacked = soldier
          this.soldierAttacked.select()
          this.soldierSelected.attack(this.soldierAttacked)
          this.gameController.setTurn("fight")
        }
        break
      case "fightCinematic":
        console.log(this.soldierAttacked, this.soldierSelected);
        const impact = - Math.round(this.soldierSelected.soldier.skirmish_power * Math.random())
        console.log({impact});
        this.soldierAttacked.updateMana(impact)
        // TODO: update mana in backend
        console.log("fightCinematic")
      default:
        console.log("no action", this.gameController.turn)
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
