class SoldiersController < ApplicationController
  def update
    @soldier = Soldier.find(params[:id])
    @soldier.update(soldier_params)
    GameChannel.broadcast_to(
      @soldier.army.game,
      {
        soldier_id: @soldier.id,
        mana: @soldier.mana
      }.to_json
    )
    render json: @soldier
  end

  private

  def soldier_params
    params.require(:soldier).permit(:mana)
  end
end
