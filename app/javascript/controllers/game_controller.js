import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

import ArScene from "../models/arScene"

// Connects to data-controller="game"
export default class extends Controller {
  static values = {
    armies: Object,
    currentUser: String,
    turnUser: String,
    gameId: Number
  }
  static targets = ['move', 'attack', 'defense', 'fight', 'settingMenu', 'score']

  connect() {
    console.log(this.armiesValue)
  
    // initialize turn
    this.stepControls = {
      move: this.moveTarget, 
      attack: this.attackTarget, 
      fight: this.fightTarget,
      defense: this.defenseTarget
    }
    
    // define initial turn
    this.turn = this.turnUserValue
    this.setTurnPlayer(this.turn)

    // initialize websocket
    this.channel = createConsumer().subscriptions.create(
      { channel: "GameChannel", id: this.gameIdValue },
      { received: data => this.processChannelMsg(JSON.parse(data)) }
    )
    console.log(`Subscribed to the game with the id ${this.gameIdValue}.`)

    this.arScene = new ArScene(this.element, this.armiesValue, this.currentUserValue, this)

    // Listen to click on the scene
    window.addEventListener("click", this.arScene.onSelect.bind(this.arScene));
  }

  setTurnPlayer(player) {
    this.turn = this.currentUserValue == player ? 'move' : 'defense'
    this.turnUserValue = player
    console.log(this.turn);
    this.updateStepControls()
    this.updateUserScore()
  }

  processChannelMsg(data) {
    console.log(data);
    if (data.turn_user) {
      this.setTurnPlayer(data.turn_user)
    }
  }

  endTurn() {
    const url = `/games/${this.gameIdValue}/next_turn`
    fetch(url)
    this.arScene.unSelectAll()
  }

  nextTurn() {
    console.log(this.stepControls);
    const steps = Object.keys(this.stepControls)
    const currentTurn = steps.indexOf(this.turn)
    const nextTurn = currentTurn < steps.length - 1 ? currentTurn + 1 : 0
    this.turn = steps[nextTurn]
    console.log("next turn", this.turn);
    if (this.turn == 'defense') {
      this.endTurn();
    }
    this.updateStepControls()
  }

  setTurn(turn) {
    this.turn = turn
    this.updateStepControls()
  }

  prevTurn() {
    const steps = Object.keys(this.stepControls)
    const currentTurn = steps.indexOf(this.turn)
    const prevTurn = currentTurn > 0 ? currentTurn - 1 : currentTurn
    this.turn = steps[prevTurn]
    console.log("prev turn", this.turn);
    this.updateStepControls()
  }

  updateUserScore() {
    console.log("user score");
    this.scoreTargets.forEach((scoreTarget) => {
      console.log(scoreTarget.dataset.user, this.turnUserValue, scoreTarget.dataset.user == this.turnUserValue);
      if (scoreTarget.dataset.user == this.turnUserValue) {
        scoreTarget.classList.add('player-turn')
      } else {
        scoreTarget.classList.remove('player-turn')
      }
    })
  }

  updateStepControls() {
    Object.values(this.stepControls).forEach(stepTarget => stepTarget.classList.remove("active"))
    this.stepControls[this.turn].classList.add("active")
  }

  openSetting() {
    this.settingMenuTarget.classList.toggle("active")
  }
}
