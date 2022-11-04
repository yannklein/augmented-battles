import { Controller } from "@hotwired/stimulus";
import "mind-ar/dist/mindar-image-three.prod.js";

// Connects to data-controller="game"
export default class extends Controller {
  static targets = ['start', 'stop', 'container']
  
  connect() {
    console.log("Hello from GamesController")
    this.imageTargetUrl = "/characters/targets.mind"
    this.imageTargetCount = 16
    this.imageTargetMax = 5
    this.initMindAR()
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
    const THREE = window.MINDAR.IMAGE.THREE;
    this.mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: this.containerTarget,
      maxTrack: this.imageTargetMax,
      imageTargetSrc: this.imageTargetUrl,
    });
    
    for (let i=0; i < this.imageTargetCount; i+=1) {
      const anchor = this.mindarThree.addAnchor(i);
      const geometry = new THREE.PlaneGeometry(1, 0.55);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
      });
      const plane = new THREE.Mesh(geometry, material);
      anchor.group.add(plane);
    }
    this.start()
  }
}
