import { Controller } from "@hotwired/stimulus"
import 'mind-ar/dist/mindar-image-three.prod.js';

// Connects to data-controller="game"
export default class extends Controller {
  connect() {
    console.log("Hello from GameController")
  }
}
