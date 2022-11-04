class AddNameToSoldiers < ActiveRecord::Migration[7.0]
  def change
    add_column :soldiers, :name, :string
  end
end
