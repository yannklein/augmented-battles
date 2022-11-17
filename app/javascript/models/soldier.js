import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import porcelainImg from "/public/matcap-porcelain-white.jpg";

export default class Soldier {
  constructor(player, soldier, color, marker) {
    this.selected = false
    this.player = player
    this.soldier = soldier
    this.color = parseInt(color,16)
    this.marker = marker
    this.imageAssetUrl = "/characters/3dAssets/"
    this.porcelainImg = porcelainImg
    this.createSoldier()
  }

  select() {
    // this.base.material.opacity = 0.5;
    this.selected = true
    this.range
  }

  unselect() {
    // this.base.material.opacity = 0.1;
    this.selected = false
    this.soldierGroup.remove(this.range);
  }

  move() {
    console.log('move!');
    this.range = this.createRange();
    this.soldierGroup.add(this.range);
  }

  attack() {
    console.log('attack!');
  }

  createBase() {
    const geometry = new THREE.PlaneGeometry(1.4, 1.4);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      // transparent: true,
      // opacity: 0.1,
    });

    const plane = new THREE.Mesh(geometry, material);
    // plane.position.z = 0.05;
    plane.marker = this.marker;
    this.marker.base = plane;
    return plane;
  }

  createRange() {
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(this.soldier.max_distance / 5, 32),
      new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.5,
      })
    );
    circle.marker = this.marker;
    return circle;
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
    mesh.rotation.x = Math.PI/2;
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
