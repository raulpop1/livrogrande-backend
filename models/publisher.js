module.exports = (sequelize, DataTypes) => {
  const Publisher = sequelize.define('Publisher', {
    name: { type: DataTypes.STRING, allowNull: false },
    location: DataTypes.STRING
  });

  Publisher.associate = function(models) {
    //a publisher can have many books
    Publisher.hasMany(models.Book, { foreignKey: 'publisherId', as: 'books' });
  };

  return Publisher;
};