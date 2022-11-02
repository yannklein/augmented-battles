class GamesController < ApplicationController
  before_action :set_game, only: [:update, :next_next]
  def index
    @game = Game.new
    @games = Game.where(user: current_user).includes(:user, :winner)
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
    if game.update(game_params)
      redirect_to game_path(game)
    else
      render 'show'
    end
  end

  def next_turn
    next_player = arrays_next(game.players, game.turn)
    game.turn = next_player
    game.save
    redirect_to game_path(game)
  end

  def arrays_next(array, element)
    next_index = array.index(element) + 1
    next_index < array.size ? array[next_index] : array[0]
  end

  private

  def set_game
    game = Game.find(params[:id])
  end

  def game_params
    params.require(:game).permit(:winner, :archive)
  end
end
