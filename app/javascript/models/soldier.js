import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import porcelainImg from "/public/matcap-porcelain-white.jpg";

export default class Soldier {
  constructor(soldier, color, markerRoot) {
    this.imageAssetUrl = "/characters/3dAssets/";
    const soldierGroup = new THREE.Group;
    soldierGroup.name = `${soldier.name}`;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = 0.05;
    soldierGroup.add(plane);

    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(soldier.max_distance / 5, 32),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.1,
      })
    );
    soldierGroup.add(circle);

    {
      const manager = new THREE.LoadingManager();
      const textureLoader = new THREE.TextureLoader(manager);
      textureLoader.load(porcelainImg, (porcelain) => {
        const material = new THREE.MeshMatcapMaterial({
          side: THREE.DoubleSide,
          matcap: porcelain,
        });
        const loader = new STLLoader();
        loader.load(
          `${this.imageAssetUrl}${markerRoot.name}.stl`,
          (geometry) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(0.05, 0.05, 0.05);
            mesh.position.z = 0.1;
            soldierGroup.add(mesh);
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

    const text = `${soldier.name} ${soldier.skirmish_power}/${soldier.distance_power}`;
    const fontSize = 12;
    const mesh = this.addText(text, fontSize);
    soldierGroup.add(mesh);
    soldierGroup.rotateX(-Math.PI/2)

    markerRoot.add(soldierGroup);
  }

  addText(text, fontSize) {
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
    mesh.position.z = 0.2;
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