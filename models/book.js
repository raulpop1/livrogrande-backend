module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    title: { type: DataTypes.STRING, allowNull: false },
    author: DataTypes.STRING,
    genre: DataTypes.STRING,
    year: DataTypes.INTEGER,
    publisherId: DataTypes.INTEGER
  });

  Book.associate = function(models) {
    //a book belongs to one publisher (3NF)
    Book.belongsTo(models.Publisher, { foreignKey: 'publisherId', as: 'publisher' });
  };

  return Book;
};