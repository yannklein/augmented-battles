import { Controller } from "@hotwired/stimulus";
import "mind-ar/dist/mindar-image-three.prod.js";

// Connects to data-controller="game"
export default class extends Controller {
  static targets = ['container']
  static values = {
    armies: Object
  }
  
  connect() {
    console.log("Hello from GamesController")
    this.imageTargetUrl = "/characters/targets.mind"
    this.imageTargets = ['alien','ancestor','black_hole','eva','gaia','god_eye','light_cone','lilith','nova','ocean','octopod','omni_eye','rising_sun','shell','triangle']
    this.imageTargetMax = 5
    console.log(this.armiesValue);
    this.initMindAR()
    console.log(this.mindarThree)
  }

  async start(){
    const { renderer, scene, camera } = this.mindarThree;
    await this.mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  };

  async stop() {
    this.mindarThree.stop();
    this.mindarThree.renderer.setAnimationLoop(null);
  }

  initMindAR() {
    this.THREE = window.MINDAR.IMAGE.THREE;
    this.mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: this.containerTarget,
      maxTrack: this.imageTargetMax,
      imageTargetSrc: this.imageTargetUrl,
    });
    const gameSoldiers = this.flattenArmies(this.armiesValue)
    gameSoldiers.forEach((soldier, index) => {
      this.createSoldier(soldier, index)
    });
    this.start()
  }

  createSoldier(soldier, anchorIndex) {
    const imageTarget = this.imageTargets.find(target => soldier.category == target)
    const anchor = this.mindarThree.addAnchor(anchorIndex);
    anchor.name = soldier.name;

    const geometry = new this.THREE.PlaneGeometry(1, 1);
    const material = new this.THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const plane = new this.THREE.Mesh(geometry, material);
    anchor.group.add(plane);

    const text = `${soldier.name} ${soldier.skirmish_power}/${soldier.distance_power}`;
    const fontSize = 12;
    const mesh = this.addText(text, fontSize)
    anchor.group.add(mesh);
  }

  addText(text, fontSize){
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const metrics = context.measureText(text);
    const textWidth = this.roundUp(metrics.width+20.0, 2);
    const textHeight = this.roundUp(fontSize+10.0, 2);     
    canvas.width = textWidth;
    canvas.height = textHeight;
    context.font = `${fontSize}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#000000";
    context.fillText(text, textWidth / 2, textHeight / 2);
    const texture = new this.THREE.Texture(canvas);
    texture.needsUpdate = true;
    const material = new this.THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: this.THREE.DoubleSide
      //color: 0xffffff,
      //useScreenCoordinates: false
    });
    const mesh = new this.THREE.Mesh(new this.THREE.PlaneGeometry(textWidth/60, textHeight/60, 10, 10), material);
        
    mesh.position.y = 0;
    mesh.position.z = 0.1;
    mesh.position.x = 0;
    return mesh  
  }

  flattenArmies(armies) {
    return Object.values(armies).flat()
  }

  roundUp(numToRound, multiple){
    var value = multiple;
    while(value < numToRound) {
      value = value * multiple;
    }
    return value;
  }
}
