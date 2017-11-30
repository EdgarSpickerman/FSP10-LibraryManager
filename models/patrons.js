'use strict';
module.exports = (sequelize, DataTypes) => {
  const patrons = sequelize.define('patrons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  });
  return patrons;
};