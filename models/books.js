'use strict';
module.exports = (sequelize, DataTypes) => {
  const books = sequelize.define('books', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  });
  return books;
};