class Army < ApplicationRecord
  belongs_to :game
  belongs_to :user
  has_many :soldiers, dependent: :destroy
  enum :category, [:earth, :sirius, :centauri, :aldebaran]

  def populate(num)
    num.times do
      new_soldier = Soldier.new( 
        name: Faker::Games::Heroes.name,
        category: Soldier.categories.values.sample, 
        skirmish_power: rand(1..11), 
        distance_power: rand(1..11), 
        max_distance: rand(1..11), 
        speed: rand(1..11)
      )
      new_soldier.army = self
      new_soldier.save
    end
  end
end
