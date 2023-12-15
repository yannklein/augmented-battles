class GamesController < ApplicationController
  before_action :set_game, only: [:update, :next_turn, :show, :live, :join]
  def index
    @game = Game.new
    @games = Game.joins(:armies).where(armies: {user: current_user}).includes(:user, :winner)
  end

  def create
    @game = Game.new
    @game.archived = false
    @game.user = current_user
    @game.turn = current_user
    if @game.save
      redirect_to game_path(@game)
    else
      @games = Game.where(user: current_user).includes(:user, :winner)
      render 'index'
    end
  end

  def update
    if @game.update(game_params)
      redirect_to game_path(@game)
    else
      render 'show'
    end
  end
  
  def show
    @qr_code = RQRCode::QRCode.new(game_live_path(@game))
    @svg = @qr_code.as_svg
  end

  def join
    new_army = Army.create(
      category: Army.categories.values.sample,
      game: @game,
      user: current_user
    )
    new_army.populate(3)
    redirect_to game_live_path(@game)
  end

  def live
    @armies = {}
    player_color = ['d82b2b', '2b962b']
    @game.armies.each_with_index do |army, index|
      @armies[army.user.id] = {}
      @armies[army.user.id]['turn'] = army.user.id == @game.turn.id
      @armies[army.user.id]['army'] = army.soldiers.order(:name).map { |soldier| soldier.as_json }
      @armies[army.user.id]['color'] = player_color[index]
    end
  end

  def next_turn
    next_player = arrays_next(@game.players, @game.turn)
    @game.update(turn: next_player)
    GameChannel.broadcast_to(
      @game,
      {
        game_id: @game.id,
        turn_user: next_player.id
      }.to_json
    )
    head :ok
  end

  private

  def arrays_next(array, element)
    next_index = array.index(element) + 1
    next_index < array.size ? array[next_index] : array[0]
  end

  def set_game
    @game = Game.find(params[:id])
  end

  def game_params
    params.require(:game).permit(:winner, :archive)
  end
end
