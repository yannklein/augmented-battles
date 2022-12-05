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
    // initialize turn targets
    this.stepControls = {
      move: this.moveTarget, 
      attack: this.attackTarget, 
      fight: this.fightTarget,
      fightCinematic: null,
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

    // initialize the AR scene
    this.arScene = new ArScene(this.element, this.armiesValue, this.currentUserValue, this)

    // Listen to click on the scene
    window.addEventListener("click", this.arScene.onSelect.bind(this.arScene))
  }

  setTurnPlayer(player) {
    // update the turn's player
    this.turn = this.currentUserValue == player ? 'move' : 'defense'
    this.turnUserValue = player
    this.updateStepControls()
    this.updateUserScore()
  }

  processChannelMsg(data) {
    // receive and process websocket data (so far, only who's current player)
    console.log(data)
    if (data.turn_user) {
      this.setTurnPlayer(data.turn_user)
    }
  }

  endTurn() {
    // end turn for current player (connected to backend)
    const url = `/games/${this.gameIdValue}/next_turn`
    fetch(url)
    this.arScene.unSelectAll()
  }

  setTurn(turn) {
    // set a define turn
    this.turn = turn
    this.updateStepControls()
  }

  nextTurn() {
    // move to next turn
    console.log(this.stepControls)
    const steps = Object.keys(this.stepControls)
    const currentTurn = steps.indexOf(this.turn)
    const nextTurn = currentTurn < steps.length - 1 ? currentTurn + 1 : 0
    this.turn = steps[nextTurn]
    console.log("next turn", this.turn)
    switch (this.turn) {
      case 'defense':
        this.endTurn()
        break;
      case 'fightCinematic':
        this.hideAllStepControls()
        break;
      default:
        this.updateStepControls()
        break;
    }
  }

  prevTurn() {
    // move to previous turn
    const steps = Object.keys(this.stepControls)
    const currentTurn = steps.indexOf(this.turn)
    const prevTurn = currentTurn > 0 ? currentTurn - 1 : currentTurn
    this.turn = steps[prevTurn]
    console.log("prev turn", this.turn)
    this.updateStepControls()
  }

  fight() {
    console.log("fight action")
    this.nextTurn()
    setTimeout(() => {
      this.nextTurn()
    }, 2000)
  }

  updateUserScore() {
    // highlights the player score card of the current turn's player
    this.scoreTargets.forEach((scoreTarget) => {
      console.log(scoreTarget.dataset.user, this.turnUserValue, scoreTarget.dataset.user == this.turnUserValue)
      if (scoreTarget.dataset.user == this.turnUserValue) {
        scoreTarget.classList.add('player-turn')
      } else {
        scoreTarget.classList.remove('player-turn')
      }
    })
  }

  updateStepControls() {
    // display the step controls relative to the current turn
    Object.values(this.stepControls).forEach(stepTarget => stepTarget?.classList.remove("active"))
    this.stepControls[this.turn].classList.add("active")
  }

  hideAllStepControls() {
    // hod all the step controls
    Object.values(this.stepControls).forEach(stepTarget => stepTarget?.classList.remove("active"))
  }

  openSetting() {
    // open/close the setting menu
    this.settingMenuTarget.classList.toggle("active")
  }
}
