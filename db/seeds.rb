puts "Destroying users, games, armies, soldiers..."
Game.destroy_all
User.destroy_all
puts "Destroyed!"

puts "Create users..."
User.create!(email: "yann@me.com", password: "password")
User.create!(email: "luc@me.com", password: "password")
puts "Created"
