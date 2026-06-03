module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }, // Plaintext is fine per assignment notes
    roleId: DataTypes.INTEGER
  });
  User.associate = function(models) {
    User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
  };
  return User;
};