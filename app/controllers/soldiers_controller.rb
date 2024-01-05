class SoldiersController < ApplicationController
  def update
    @soldier = Soldier.find(params[:id])
    @game = @soldier.army.game
    @soldier.update(soldier_params)
    GameChannel.broadcast_to(
      @game,
      {
        type: "update soldier",
        soldier_id: @soldier.id,
        mana: @soldier.mana
      }.to_json
    )
    if @soldier.army.isDecimated
      # @game.update(winner: @soldier.army.user)
      GameChannel.broadcast_to(
      @game,
      {
        type: "game finished",
        army_id: @soldier.army.id,
        loser_id: @soldier.army.user.id,
      }.to_json
    )
    end
    render json: @soldier
  end

  private

  def soldier_params
    params.require(:soldier).permit(:mana)
  end
end
