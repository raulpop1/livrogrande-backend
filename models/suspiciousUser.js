module.exports = (sequelize, DataTypes) => {
  const SuspiciousUser = sequelize.define('SuspiciousUser', {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    reason: { type: DataTypes.STRING, allowNull: false }
  });
  
  //link this to the User table so the Admin can see the actual username, not just an ID number
  SuspiciousUser.associate = function(models) {
    SuspiciousUser.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };
  return SuspiciousUser;
};