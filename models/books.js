'use strict';
module.exports = (sequelize, DataTypes) => {
  const books = sequelize.define('books', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    author: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: { msg: 'Looks like you forgot to enter the author' }
      }
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: { msg: 'Looks like you forgot to enter the title' }
      }
    },
    genre: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: { msg: 'Looks like you forgot to enter the genre' }
      }
    },
    first_published: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isNotNullAndValidInt: function () {
          if (this.first_published !== null && isNaN(this.first_published)) throw new Error('Please enter a valid year if known. Otherwise leave blank');
        }
      }
    }
  });

  books.associate = models => books.hasOne(models.loans, { foreignKey: 'book_id' });
  return books;
};