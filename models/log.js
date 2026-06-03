module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    actionInfo: { type: DataTypes.STRING, allowNull: false }
  });
  return Log;
};