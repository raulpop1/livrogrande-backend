const { Log, SuspiciousUser, Sequelize } = require('../models');
const { Op } = Sequelize;

async function stealthLogger(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    
    const userId = req.headers['x-user-id'];
    const roleId = req.headers['x-role-id'];

    if (userId && roleId) {
      const action = req.method === 'POST' ? 'Added a book' : req.method === 'PUT' ? 'Edited a book' : 'Deleted a book';

      try {
        //persist the log of this action in the Logs table
        await Log.create({ userId, groupId: roleId, actionInfo: action });

        //if a user does more than 4 actions in 30 seconds, they are suspicious
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        
        const recentActionCount = await Log.count({
          where: { 
            userId: userId, 
            createdAt: { [Op.gte]: thirtySecondsAgo } 
          }
        });

        if (recentActionCount > 4) {
          //check if they are already on the observation list
          const existingSuspect = await SuspiciousUser.findOne({ where: { userId } });
          
          if (!existingSuspect) {
             // Place them on the Observation List!
             await SuspiciousUser.create({ 
                 userId: userId, 
                 reason: `Spamming: Performed ${recentActionCount} actions in under 30 seconds.` 
             });
             console.log(`🚨 STEALTH ALERT: User ${userId} flagged and added to Observation List!`);
          }
        }
      } catch (error) {
        console.error("Stealth Logger failed to record:", error);
      }
    }
  }
  
  next();
}

module.exports = stealthLogger;