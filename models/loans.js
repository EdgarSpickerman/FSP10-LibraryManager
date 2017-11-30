'use strict';
const moment = require('moment');

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
        isDate: { msg: 'Please enter a valid loaned on date' },
        isAfter: {
          args: [moment().subtract(1, 'days').format('YYYY- MM - DD')],
          msg: 'Please enter a date on or after today'
        }
      }
    },
    return_by: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: { msg: 'Please enter a valid return by date' },
        isAfter: {
          args: [moment().add(7, 'days').format('YYYY- MM - DD')],
          msg: 'Please enter a date on or after 7 days from now'
        }
      }
    },
    returned_on: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      isNotNullAndValidInt: function () {
        if (this.returned_on !== null && isNaN(this.returned_on)) throw new Error('Please enter a valid date otherwise leave blank');
      }
    }
  });

  loans.associate = models => {
    loans.belongsTo(models.books, { foreignKey: 'book_id' });
    loans.belongsTo(models.patrons, { foreignKey: 'patron_id' });
  };
  return loans;
};