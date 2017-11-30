'use strict';
module.exports = (sequelize, DataTypes) => {
  const patrons = sequelize.define('patrons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      validate: { notEmpty: { msg: 'Looks like you forgot to enter a first name' } }
    },
    last_name: {
      type: DataTypes.STRING,
      validate: { notEmpty: { msg: 'Looks like you forgot to enter a last name' } }
    },
    address: {
      type: DataTypes.STRING,
      validate: { notEmpty: { msg: 'Looks like you forgot to enter an address' } }
    },
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: { msg: 'Please enter a valid Email' } }
    },
    library_id: {
      type: DataTypes.STRING,
      validate: { notEmpty: { msg: 'Looks like you forgot to enter a libray id' } }
    },
    zip_code: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: { msg: 'Please enter a valid Zip code' },
        notEmpty: { msg: 'Looks like you forgot to enter a zip code or it was invalid' }
      }
    }
  });

  patrons.associate = models => patrons.hasOne(models.loans, { foreignKey: 'patron_id' });
  return patrons;
};