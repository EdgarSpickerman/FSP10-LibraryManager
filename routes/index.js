const express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Books = require('../models').books,
  Loans = require('../models').loans,
  Patrons = require('../models').patrons;

var today = moment().format('YYYY-MM-DD');
var due = moment().add(7, 'days').format('YYYY-MM-DD');

const getData = (model, condition) => model.findAll(condition);
const handleErr = (err) => console.log(err);
const updateModel = (model, body) => { };

const validation = (req, res, next) => {
  if (req.params.filters !== 'all' && req.params.filters !== 'overdue' && req.params.filters !== 'checked out') return next(err);
  if (req.params.models !== 'loans' && req.params.models !== 'patrons' && req.params.models !== 'books') return next(err);
}

const setProps = (data, req) => {
  let view = {};
  if (req.params.filter) {
    view.title = req.params.filter + ' ' + req.params.models;
    view.pages = data[1].map((data, index) => index / 10).filter(val => Number.isInteger(val)).map(data => data + 1);
    if (req.params.filter !== 'all' && req.params.models === 'books') view[req.params.models] = data[0].map(data => data.book)
    else view[req.params.models] = data[0]
  } else if (req.params.id) {
    view.today = today;
    view.loans = data[1];
    view[req.params.models.slice(0, req.params.models.length - 1)] = data[0][0];
    if (view.book) view.title = view.book.title;
    if (view.patron) view.title = view.patron.first_name + ' ' + view.patron.last_name;
    if (view.loan) view.title = 'Patron:Return Book';
    console.log(view);
  }
  return view;
}

const query = (req, res) => {
  if (req.params.filter) {
    let model = Loans;
    let condition = {};
    if (req.params.filter === 'all' && req.params.models === 'loans') condition = { include: [Books, Patrons] };
    if (req.params.filter === 'all' && req.params.models === 'patrons') model = Patrons;
    if (req.params.filter === 'all' && req.params.models === 'books') model = Books;
    if (req.params.filter === 'overdue') condition = { include: [Books, Patrons], where: { returned_on: { $eq: null }, return_by: { $lt: today } } };
    if (req.params.filter === 'checked out') condition = { include: [Books, Patrons], where: { returned_on: { $eq: null } } };
    if (req.query.page) {
      condition.limit = 10;
      condition.offset = 10 * (req.query.page - 1);
    }
    return Promise.all([getData(model, condition), getData(model, {})]).then(data => setProps(data, req)).then(view => res.render('lists', view)).catch(handleErr);
  } else if (req.params.id) {
    let model = Loans;
    let lCondition = { include: [Books, Patrons], where: { id: { $eq: req.params.id } } };
    let condition = { where: { id: { $eq: req.params.id } } };
    if (req.params.models === 'patrons') {
      lCondition = { include: [Books, Patrons], where: { patron_id: { $eq: req.params.id } } };
      model = Patrons;
    } else if (req.params.models === 'books') {
      lCondition = { include: [Books, Patrons], where: { book_id: { $eq: req.params.id } } };
      model = Books;
    } else if (req.params.models === 'loans') condition = lCondition;
    return Promise.all([model.findAll(condition), Loans.findAll(lCondition)]).then(data => setProps(data, req)).then(view => res.render('details', view)).catch(handleErr);
  } else if (req.models) {
    if (req.params.models === 'loans') console.log('loan details')
    if (req.params.models === 'loans') console.log('patrons details')
    if (req.params.models === 'loans') console.log('books details')
  }

};

/***************************************************************** ROUTES *****************************************************************/
router.get('/', (req, res) => res.render('index', { title: 'Express' }));

router.get('/lists/:models/:filter', (req, res) => query(req, res));

router.get('/details/:models/:id', (req, res) => query(req, res));

router.get('/new/:models', (req, res) => res.render('forms', { title: 'Express' }));

module.exports = router;
