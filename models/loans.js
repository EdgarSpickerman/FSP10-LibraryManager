'use strict';

module.exports = (sequelize, DataTypes) => {
  const loans = sequelize.define('loans', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    book_id: {
      type: DataTypes.INTEGER,
      validate: { isInt: { msg: 'Please enter a valid Book' } }
    },
    patron_id: {
      type: DataTypes.INTEGER,
      validate: { isInt: { msg: 'Please enter a valid Patron' } }
    },
    loaned_on: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: { msg: 'Please enter a valid loaned on date' }
      }
    },
    return_by: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: { msg: 'Please enter a valid return by date' },
      }
    },
    returned_on: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: { msg: 'Please enter a valid returned on date' },
      }
    }
  });

  loans.associate = models => {
    loans.belongsTo(models.books, { foreignKey: 'book_id' });
    loans.belongsTo(models.patrons, { foreignKey: 'patron_id' });
  };
  return loans;
};