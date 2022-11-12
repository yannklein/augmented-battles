puts "Destroying users, games, armies, soldiers..."
Game.destroy_all
User.destroy_all
puts "Destroyed!"

puts "Create users..."
u1 = User.create!(email: "yann@me.com", password: "password")
u2 = User.create!(email: "luc@me.com", password: "password")
puts "Created"


puts "Create games..."
game = Game.create!(
  archived: false, 
  user: u1,
  turn: u1,
)
puts "Created"

puts "Create armies..."
army1 = Army.create!(
  category: 1, 
  user: u1,
  game: game,
)
army1.populate(3)
army2 = Army.create!(
  category: 2, 
  user: u2,
  game: game,
)
army2.populate(3)
puts "Created"