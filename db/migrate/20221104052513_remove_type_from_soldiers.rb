class RemoveTypeFromSoldiers < ActiveRecord::Migration[7.0]
  def change
    remove_column :soldiers, :type, :string
  end
end
