import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import porcelainImg from "/public/matcap-porcelain-white.jpg";

export default class Soldier {
  constructor(player, soldier, color, marker, onRenderFcts) {
    this.selected = false;
    this.player = player;
    this.soldier = soldier;
    this.color = parseInt(color, 16);
    this.marker = marker;
    this.onRenderFcts = onRenderFcts;
    this.imageAssetUrl = "/characters/3dAssets/";
    this.porcelainImg = porcelainImg;
    this.createSoldier();
  }

  select() {
    // this.base.material.opacity = 1;
    this.selectCircle = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.2, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      })
    );
    this.selectCircle.marker = this.marker;
    this.selectCircle.rotation.x += Math.PI / 2;
    // this.selectCircle.position.z = 0.2;
    this.marker.add(this.selectCircle);
    this.selected = true;
  }

  unselect() {
    // this.base.material.opacity = 0.1;
    this.selected = false;
    // remove range/selection circle wherever it is
    this.marker.parent.remove(this.range);
    this.marker.remove(this.range);
    this.marker.remove(this.selectCircle);
    this.marker.parent.remove( this.arrowAttack );

  }

  showAttackRange() {
    this.range = new THREE.Mesh(
      new THREE.RingGeometry(
        this.soldier.max_distance,
        this.soldier.max_distance + 0.3,
        32
      ),
      new THREE.MeshBasicMaterial({
        color: this.color,
        side: THREE.DoubleSide,
      })
    );
    this.range.marker = this.marker;
    this.range.rotation.x += Math.PI / 2;
    this.marker.add(this.range);
  }

  showMoveRange() {
    console.log("move!");
    this.marker.parent.remove(this.range);
    this.range = this.createMoveRange();
    this.range.position.x = this.marker.position.x;
    this.range.position.y = this.marker.position.y;
    this.range.position.z = this.marker.position.z;
    this.range.quaternion.copy(this.marker.quaternion);
    this.marker.parent.add(this.range);
  }

  attack(otherSoldier) {
    console.log("attack!");
    this.arrowAttack = this.createArrow(otherSoldier);
    this.marker.parent.add(this.arrowAttack);
  }

  removeAttackArrow() {
    console.log('remove arrow');
    this.marker.parent.remove( this.arrowAttack );
  }

  createArrow(otherSoldier) {
    console.log("arrow");
    console.log(this.marker, otherSoldier.marker);
    const group = new THREE.Group();
    
    const arrowMat = new THREE.MeshLambertMaterial({color: 0xff9900})
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 32);
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.rotation.x = Math.PI / 2;
    arrowMesh.position.z = 0.25;
    arrowMesh.position.y = 0.5;
    group.add(arrowMesh);
    
    const cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32);
    const cylinderMesh = new THREE.Mesh(cylinderGeo, arrowMat);
    cylinderMesh.rotation.x = Math.PI / 2;
    cylinderMesh.position.z = -0.25;
    cylinderMesh.position.y = 0.5;
    group.add(cylinderMesh);

    this.onRenderFcts.push(() => {
      group.position.copy(this.getMiddle(this.marker.position, otherSoldier.marker.position))
      group.lookAt(otherSoldier.marker.position);
    })
    return group;
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
    const geometry = new THREE.CircleGeometry(1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      // transparent: true,
      // opacity: 0.8,
    });

    const plane = new THREE.Mesh(geometry, material);
    // plane.position.z = 0.05;
    plane.marker = this.marker;
    plane.soldier = this;
    return plane;
  }

  createMoveRange() {
    const circleGroup = new THREE.Group();
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(this.soldier.speed / 2, 32),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        color: this.color,
        transparent: true,
        opacity: 0.5,
      })
    );
    circle.marker = this.marker;
    circle.rotation.x += Math.PI / 2;
    circleGroup.add(circle);
    return circleGroup;
  }

  createAsset(callback) {
    const manager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(manager);
    textureLoader.load(this.porcelainImg, (porcelain) => {
      const material = new THREE.MeshMatcapMaterial({
        side: THREE.DoubleSide,
        matcap: porcelain,
      });
      const loader = new STLLoader();
      loader.load(
        `${this.imageAssetUrl}${this.marker.name}.stl`,
        (geometry) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.set(0.05, 0.05, 0.05);
          mesh.position.z = 0.1;
          mesh.marker = this.marker;
          mesh.soldier = this;
          callback(mesh);
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

  createSoldier() {
    this.soldierGroup = new THREE.Group();
    this.soldierGroup.name = this.soldier.name;

    this.base = this.createBase();
    this.soldierGroup.add(this.base);

    this.createAsset((asset) => {
      this.soldierGroup.add(asset);
    });

    this.text = this.createText(
      `${this.soldier.name} ${this.soldier.skirmish_power}/${this.soldier.distance_power}`,
      12
    );
    this.soldierGroup.add(this.text);

    // createSelectFeature(this.soldierGroup);

    this.soldierGroup.rotateX(-Math.PI / 2);
    this.marker.add(this.soldierGroup);
  }

  createText(text, fontSize) {
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
    mesh.position.z = 2;
    mesh.position.x = 0;
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  roundUp(numToRound, multiple) {
    let value = multiple;
    while (value < numToRound) {
      value = value * multiple;
    }
    return value;
  }
}
