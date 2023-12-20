import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

import DemoScene from "../models/demoScene"
import ArScene from "../models/arScene"

// Connects to data-controller="game"
export default class extends Controller {
  static values = {
    armies: Object,
    currentUser: Number,
    turnUser: String,
    gameId: Number
  }
  static targets = ['move', 'attack', 'defense', 'fight', 'settingMenu', 'score', 'fist', 'winner']

  connect() { 
    // initialize AR vs Demo (non-AR) mode
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.mode = urlParams.get('mode');
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
      if (this.mode === "demo") {
        this.arScene = new DemoScene(this.element, this.armiesValue, this.currentUserValue, this)
      }
      else {
        this.arScene = new ArScene(this.element, this.armiesValue, this.currentUserValue, this)
      }

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
    // turn message
    if (data.turn_user) {
      this.setTurnPlayer(data.turn_user)
    }
    // soldier update msg
    if (data.soldier_id) {
      const soldier = this.arScene.soldiers.find(sol => sol.soldier.id === data.soldier_id)
      console.log(this.arScene);
      soldier.updateManaDisplay(data.mana)

      if (data.mana <= 0) {
        this.fistTargets.find(fist => fist.id === `life-${data.soldier_id}`).remove();
      }
    }

    // army update msg
    if (data.army_id) {
      console.log(this.currentUserValue, data.user_id, this.currentUserValue === data.user_id)
      const outcome = (this.currentUserValue === data.user_id) ? "You won!" : "You lost!"
      console.log(outcome, this.winnerTarget.firstElementChild);
      this.winnerTarget.firstElementChild.innerText = outcome;
      this.winnerTarget.classList.add('d-flex');
      this.winnerTarget.classList.remove('d-none');
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
    // fight cinematic happenning
    this.nextTurn()
    // got to next turn
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
