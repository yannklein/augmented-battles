import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

import DemoScene from "../models/demoScene"
import ArScene from "../models/arScene"

// Connects to data-controller="game"
export default class extends Controller {
  static values = {
    armies: Object, // all data about 2 armies fighting
    currentUserId: Number, // ID of the logged in user
    turnUserId: Number, // ID of the user of the current turn
    gameId: Number // game ID
  }

  static targets = [
    'move',         // "Your turn!" label and "continue to attack" button
    'attack',       // "Time to attack!" label
    'defense',      // "Defense time" label
    'fight',        // "Fight ⚡️" button, asking user to move soldiers
    'settingMenu',  // bottom right setting menu
    'score',        // top left/right score boxes
    'fist',         // all fists of the score boxes (both players)
    'winner'        // winner/loser modal
  ]

  connect() { 
    // initialize AR vs Demo (non-AR) mode
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.mode = urlParams.get('mode');

    // initialize turn targets and step matching
    this.stepControls = {
      move: this.moveTarget,      // user can move soldiers
      attack: this.attackTarget,  // user can select soldier to attack
      fight: this.fightTarget,    // user can attack soldier
      fightCinematic: null,       // attack cinematic step
      defense: this.defenseTarget // defense step, no action possible until next play turn is over
    }
    
    // define initial turn's player
    this.setTurnPlayer(this.turnUserIdValue)

    // initialize websocket
    this.channel = createConsumer().subscriptions.create(
      { channel: "GameChannel", id: this.gameIdValue },
      { received: data => this.processChannelMsg(JSON.parse(data)) }
    )

    // initialize the AR scene
    const SceneType = (this.mode === "demo") ? DemoScene : ArScene;
    this.arScene = new SceneType(this.element, this.armiesValue, this.currentUserIdValue, this)

    // Listen to any click on the scene triggering the onSelect of the AR scene
    window.addEventListener("click", this.arScene.onSelect)
  }

  // update the turn's player
  setTurnPlayer(player) {
    // set the initial step depending on its your turn (move) or not(defense)
    this.step = this.currentUserIdValue == player ? 'move' : 'defense'
    // set the new ID of the user of the current turn
    this.turnUserIdValue = player
    this.updateStepControls()
    this.updateTurnUserInScore()
  }

  // receive and process websocket data (so far, only who's current player)
  processChannelMsg(data) {
    console.log(data)
    switch (data.type) {
      case "next turn":
        this.setTurnPlayer(data.turn_user)
        break;
      case "update soldier":
        const soldier = this.arScene.soldiers.find(sol => sol.soldier.id === data.soldier_id)
        console.log(this.arScene);
        soldier.updateManaDisplay(data.mana)

        if (data.mana <= 0) {
          this.fistTargets.find(fist => fist.id === `life-${data.soldier_id}`).remove();
        }
        break;
      case "game finished":
        console.log(this.currentUserIdValue, data.user_id, this.currentUserIdValue === data.user_id)
        const outcome = (this.currentUserIdValue === data.loser_id) ? "You lost!" : "You won!"
        console.log(outcome, this.winnerTarget.firstElementChild);
        this.winnerTarget.firstElementChild.innerText = outcome;
        this.winnerTarget.classList.add('d-flex');
        this.winnerTarget.classList.remove('d-none');
        break;
    
      default:
        console.warn("Unknown cable message");
        break;
    }
  }

  endTurn() {
    // end turn for current turn's player (connected to backend)
    fetch(`/games/${this.gameIdValue}/next_turn`)
    // unselect any soldier on board
    this.arScene.unSelectAll()
  }

  setStep(step) {
    // set a define turn
    this.step = step
    this.updateStepControls()
  }

  nextStep() {
    // move to next turn
    console.log(this.stepControls)
    const steps = Object.keys(this.stepControls)
    const currentStepIndex = steps.indexOf(this.step)
    const nextStep = currentStepIndex < steps.length - 1 ? currentStepIndex + 1 : 0
    this.step = steps[nextStep]
    console.log("next turn", this.step)
    switch (this.step) {
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

  prevStep() {
    // move to previous turn
    const steps = Object.keys(this.stepControls)
    const currentTurn = steps.indexOf(this.step)
    const prevStep = currentTurn > 0 ? currentTurn - 1 : currentTurn
    this.step = steps[prevStep]
    console.log("prev turn", this.step)
    this.updateStepControls()
  }

  fight() {
    console.log("fight action")
    this.nextStep()
    // fight cinematic happenning
    setTimeout(() => {
      this.nextStep()
      // got to next turn
    }, 1000);
  }

  updateTurnUserInScore() {
    // highlights the player score card of the current turn's player
    this.scoreTargets.forEach((scoreTarget) => {
      console.log(scoreTarget.dataset.user, this.turnUserIdValue, scoreTarget.dataset.user == this.turnUserIdValue)
      if (scoreTarget.dataset.user == this.turnUserIdValue) {
        scoreTarget.classList.add('player-turn')
      } else {
        scoreTarget.classList.remove('player-turn')
      }
    })
  }

  updateStepControls() {
    // display the step controls relative to the current turn
    Object.values(this.stepControls).forEach(stepTarget => stepTarget?.classList.remove("active"))
    this.stepControls[this.step].classList.add("active")
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
