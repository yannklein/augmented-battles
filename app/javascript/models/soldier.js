import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import porcelainImg from "/public/matcap-porcelain-white.jpg";

export default class Soldier {
  constructor(soldier, color, marker) {
    this.soldier = soldier;
    this.color = color;
    this.marker = marker;
    this.imageAssetUrl = "/characters/3dAssets/";
    this.porcelainImg = porcelainImg;
    this.createSoldier();
  }

  createBase() {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.5,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = 0.05;
    return plane;
  }

  createRange() {
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(this.soldier.max_distance / 5, 32),
      new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.1,
      })
    );
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
    const soldierGroup = new THREE.Group();
    soldierGroup.name = this.soldier.name;

    const base = this.createBase();
    soldierGroup.add(base);

    const range = this.createRange();
    soldierGroup.add(range);

    this.createAsset((asset) => {
      soldierGroup.add(asset);
    });

    const text = this.createText(
      `${this.soldier.name} ${this.soldier.skirmish_power}/${this.soldier.distance_power}`,
      12
    );
    soldierGroup.add(text);

    soldierGroup.rotateX(-Math.PI / 2);
    this.marker.add(soldierGroup);
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

    mesh.position.y = -1;
    mesh.position.z = 0.1;
    mesh.position.x = 0;
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
