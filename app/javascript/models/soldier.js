import * as THREE from "three"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"
import porcelainImg from "/public/matcap-porcelain-white.jpg"

export default class Soldier {
  constructor(id, soldierData, color, marker, onRenderFcts) {
    this.selected = false
    this.id = id
    this.soldierData = soldierData
    this.color = parseInt(color, 16)
    this.marker = marker
    this.onRenderFcts = onRenderFcts
    this.imageAssetUrl = "/characters/3dAssets/"
    this.porcelainImg = porcelainImg
    this.createSoldier()

    // invisible if no more mana
    if (this.soldierData.mana <= 0) {
      this.killSoldier()
      return
    }
  }

  select() {
    // this.base.material.opacity = 1
    this.selectCircle = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.2, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      })
    )
    this.selectCircle.marker = this.marker
    this.selectCircle.rotation.x += Math.PI / 2
    // this.selectCircle.position.z = 0.2
    this.marker.add(this.selectCircle)
    this.selected = true
  }

  unSelect() {
    // this.base.material.opacity = 0.1
    this.selected = false
    if (!this.marker || !this.marker.parent) {
      return
    }
    // remove range/selection circle wherever it is
    this.marker.parent.remove(this.range)
    this.marker.remove(this.range)
    this.marker.remove(this.selectCircle)
    this.marker.parent.remove( this.arrowAttack )

  }

  showAttackRange() {
    this.range = new THREE.Mesh(
      new THREE.RingGeometry(
        this.soldierData.max_distance,
        this.soldierData.max_distance + 0.3,
        32
      ),
      new THREE.MeshBasicMaterial({
        color: this.color,
        side: THREE.DoubleSide,
      })
    )
    this.range.marker = this.marker
    this.range.rotation.x += Math.PI / 2
    this.marker.add(this.range)
  }

  showMoveRange() {
    console.log("move!")
    this.marker.parent.remove(this.range)
    this.range = this.createMoveRange()
    this.range.position.x = this.marker.position.x
    this.range.position.y = this.marker.position.y
    this.range.position.z = this.marker.position.z
    this.range.quaternion.copy(this.marker.quaternion)
    this.marker.parent.add(this.range)
  }

  attack(otherSoldier) {
    console.log("attack!")
    this.arrowAttack = this.createArrow(otherSoldier)
    this.marker.parent.add(this.arrowAttack)
  }

  removeAttackArrow() {
    console.log('remove arrow')
    this.marker.parent.remove( this.arrowAttack )
  }

  createArrow(otherSoldier) {
    console.log("arrow")
    console.log(this.marker, otherSoldier.marker)
    const group = new THREE.Group()
    
    const arrowMat = new THREE.MeshLambertMaterial({color: 0xff9900})
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 32)
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat)
    arrowMesh.rotation.x = Math.PI / 2
    arrowMesh.position.z = 0.25
    arrowMesh.position.y = 0.5
    group.add(arrowMesh)
    
    const cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32)
    const cylinderMesh = new THREE.Mesh(cylinderGeo, arrowMat)
    cylinderMesh.rotation.x = Math.PI / 2
    cylinderMesh.position.z = -0.25
    cylinderMesh.position.y = 0.5
    group.add(cylinderMesh)

    this.onRenderFcts.push(() => {
      group.position.copy(this.getMiddle(this.marker.position, otherSoldier.marker.position))
      group.lookAt(otherSoldier.marker.position)
    })
    return group
  }

  scalarMiddle(x1, x2){
    const min = Math.min(x1, x2)
    const max = Math.max(x1, x2)
    return min + (Math.abs(max - min) / 2)
  }
  getMiddle(pos1, pos2){
    return new THREE.Vector3(
      this.scalarMiddle(pos1.x, pos2.x),
      this.scalarMiddle(pos1.y, pos2.y),
      this.scalarMiddle(pos1.z, pos2.z)
    )
  }

  createBase() {
    const geometry = new THREE.CircleGeometry(1, 32)
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      // transparent: true,
      // opacity: 0.8,
    })

    const plane = new THREE.Mesh(geometry, material)
    // plane.position.z = 0.05
    plane.marker = this.marker
    plane.soldier = this
    return plane
  }

  createManaBalls() {
    const group = new THREE.Group()
    group.name = 'mana-balls'
    const ballAmount = this.soldierData.mana

    for (let i=0; i < ballAmount; i++) {
      const geometry = new THREE.TetrahedronGeometry(0.2, 0)
      const material = new THREE.MeshLambertMaterial({color: 0xC56CEF})

      const ball = new THREE.Mesh(geometry, material)
      ball.marker = this.marker
      ball.soldier = this

      
      group.add(ball)
    }

    // Trigonometry Constants for Orbital Paths 
    let theta = 0; // Current angle
    // Angle increment on each render
    const dTheta = 2 * Math.PI / 300;

    this.onRenderFcts.push(() => {
      //Increment theta, and update sphere coords based off new value        
      theta += dTheta;
      // Store trig functions for sphere orbits 
      // MUST BE INSIDE RENDERING FUNCTION OR THETA VALUES ONLY GET SET ONCE
      const radius = 0.7
      const trigs = [
          {x: Math.cos(theta*1.05), y: Math.sin(theta*1.05), z: Math.cos(theta*1.05)},
          {x: Math.cos(theta*0.8), y: Math.sin(theta*0.8), z: Math.sin(theta*0.8)},
          {x: Math.cos(theta*1.25), y: Math.cos(theta*1.25), z: Math.sin(theta*1.25)},
          {x: Math.sin(theta*0.6), y: Math.cos(theta*0.6), z: Math.sin(theta*0)}
      ];
      group.children.forEach((ball, i) => {
        ball.position.x = radius * trigs[i]['x'];
        ball.position.y = radius * trigs[i]['y'];
        ball.position.z = radius * trigs[i]['z'] + 1;
      })
    })
    return group
  }

  createMoveRange() {
    const circleGroup = new THREE.Group()
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(this.soldierData.speed / 2, 32),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        color: this.color,
        transparent: true,
        opacity: 0.5,
      })
    )
    circle.marker = this.marker
    circle.rotation.x += Math.PI / 2
    circleGroup.add(circle)
    return circleGroup
  }

  createAsset(callback) {
    const manager = new THREE.LoadingManager()
    const textureLoader = new THREE.TextureLoader(manager)
    textureLoader.load(this.porcelainImg, (porcelain) => {
      const material = new THREE.MeshMatcapMaterial({
        side: THREE.DoubleSide,
        matcap: porcelain,
      })
      const loader = new STLLoader()
      loader.load(
        `${this.imageAssetUrl}${this.marker.name}.stl`,
        (geometry) => {
          const mesh = new THREE.Mesh(geometry, material)
          mesh.scale.set(0.05, 0.05, 0.05)
          mesh.position.z = 0.1
          mesh.marker = this.marker
          mesh.soldier = this
          callback(mesh)
        },
        (xhr) => {
          // console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
        },
        (error) => {
          console.log(error)
        }
      )
    })
  }

  killSoldier() {
    this.marker.visible = false
    // this.marker.parent.removeFromParent()
  }

  updateManaDisplay() {
    // hide the solidier if killed
    if (this.soldierData.mana <= 0) {
      this.killSoldier()
    } 
    // update text
    const oldText = this.soldierGroup.getObjectByName("text");
    this.soldierGroup.remove(oldText)
    this.text = this.createText(
      `${this.soldierData.name} ${this.soldierData.skirmish_power}/${this.soldierData.distance_power} ❤️${this.soldierData.mana}`,
      12
      )
    console.log(this.soldierData);
    this.soldierGroup.add(this.text)

    // update balls
    // remove current mana balls
    this.soldierGroup.remove(this.manaBalls)
    // recreate with the right mana balls amount
    this.manaBalls = this.createManaBalls()
    this.soldierGroup.add(this.manaBalls)
  }

  updateMana(value){
    // callback(this.soldierData.mana)
    const url = `/soldiers/${this.soldierData.id}`
    console.log(url);
    const token = document.getElementsByName('csrf-token')[0].content
    let newMana = this.soldierData.mana + value
    newMana = newMana >= 0 ? newMana : 0
    const form = new FormData();
    form.append("soldier[mana]", newMana)
    fetch(url, {
      method: "PATCH",
      headers: { "X-CSRF-Token": token},
      body: form
    })
      .then(r => r.json())
      .then((data) => {
        this.soldierData.mana = data.mana
        this.updateManaDisplay()
    })
  }

  createSoldier() {
    this.soldierGroup = new THREE.Group()
    this.soldierGroup.name = this.soldierData.name

    this.base = this.createBase()
    this.soldierGroup.add(this.base)

    this.manaBalls = this.createManaBalls()
    this.soldierGroup.add(this.manaBalls)

    this.createAsset((asset) => {
      this.soldierGroup.add(asset)
    })

    this.text = this.createText(
      `${this.soldierData.name} ${this.soldierData.skirmish_power}/${this.soldierData.distance_power} ❤️${this.soldierData.mana}`,
      12
    )
    this.soldierGroup.add(this.text)

    // createSelectFeature(this.soldierGroup)

    this.soldierGroup.rotateX(-Math.PI / 2)
    this.marker.add(this.soldierGroup)
  }

  createText(text, fontSize) {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    const metrics = context.measureText(text)
    const textWidth = this.roundUp(metrics.width + 20.0, 2)
    const textHeight = this.roundUp(fontSize + 10.0, 2)
    canvas.width = textWidth
    canvas.height = textHeight
    context.font = `${fontSize}px Arial`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillStyle = "#000000"
    context.fillText(text, textWidth / 2, textHeight / 2)
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      //color: 0xffffff,
      //useScreenCoordinates: false
    })
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(textWidth / 60, textHeight / 60, 10, 10),
      material
    )
    mesh.name = "text"
    mesh.position.y = 0
    mesh.position.z = 2
    mesh.position.x = 0
    mesh.rotation.x = Math.PI / 2
    return mesh
  }

  roundUp(numToRound, multiple) {
    let value = multiple
    while (value < numToRound) {
      value = value * multiple
    }
    return value
  }
}
