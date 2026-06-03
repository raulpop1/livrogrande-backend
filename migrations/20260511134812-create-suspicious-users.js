module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SuspiciousUsers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      reason: { type: Sequelize.STRING, allowNull: false }, 
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });
  },
  down: async (queryInterface) => await queryInterface.dropTable('SuspiciousUsers')
};