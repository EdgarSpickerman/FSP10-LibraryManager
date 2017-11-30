'use strict';
module.exports = (sequelize, DataTypes) => {
  const loans = sequelize.define('loans', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  });
  return loans;
};