const express = require('express'),
  router = express.Router(),
  moment = require('moment'),
  Books = require('../models').books,
  Loans = require('../models').loans,
  Patrons = require('../models').patrons;

var today = moment().format('YYYY-MM-DD');
var due = moment().add(7, 'days').format('YYYY-MM-DD');
const pluralToSingle = (plural) => plural.slice(0, plural.length - 1);
const getData = (model, condition) => model.findAll(condition);
const link = req => `/lists/${req.params.models}/all`;
const handleErr = (err) => console.log(err);

const query = (req, res, errors) => {
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
    return Promise.all([getData(model, condition), getData(model, {})]).then(data => setProps(data, req)).then(view => res.render('lists', view))
      .catch(handleErr);
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
    return Promise.all([model.findAll(condition), Loans.findAll(lCondition)]).then(data => setProps(data, req, errors))
      .then(view => res.render('details', view)).catch(handleErr);
  } else if (req.params.models) {
    let view = { [pluralToSingle(req.params.models)]: {}, title: `New ${pluralToSingle(req.params.models)}` };
    if (errors.length > 0) {
      view.errors = errors;
      view[pluralToSingle(req.params.models)] = req.body;
    }
    if (req.params.models === 'loans') return getAvailLoans().then(data => setProps(data, req, errors))
      .then(view => res.render('forms', view)).catch(handleErr);
    res.render('forms',view);
  }
};

const setProps = (data, req, errors) => {
  let view = {};
  if (req.params.filter) {
    view.title = req.params.filter + ' ' + req.params.models;
    view.pages = data[1].map((data, index) => index / 10).filter(val => Number.isInteger(val)).map(data => data + 1);
    if (req.params.filter !== 'all' && req.params.models === 'books') view[req.params.models] = data[0].map(data => data.book)
    else view[req.params.models] = data[0]
  } else if (req.params.id) {
    view = { today: today, loans: data[1], [pluralToSingle(req.params.models)]: data[0][0] }
    if (view.book) view.title = view.book.title;
    if (view.patron) view.title = view.patron.first_name + ' ' + view.patron.last_name;
    if (view.loan) view.title = 'Patron:Return Book';
    if (errors.length > 0) {
      view.errors = errors;
      view[pluralToSingle(req.params.models)] = req.body;
    }
    if (req.params.models === 'loans' && errors.length > 0) {
      return Loans.findAll({ where: { id: { $eq: req.params.id } }, include: [Books, Patrons] })
        .then(data => {
          view.loan = data[0];
          return view;
        })
    }
  } else if (req.params.models) {
    view = { loan: {}, books: data[0], patrons: data[1], title: 'New Loan', today: today, due: due };
    if (errors.length > 0) {
      view.errors = errors;
      view.loan = req.body;
    }
  }
  return view;
}

const getAvailLoans = () => {
  return Loans.findAll({ where: { returned_on: { $eq: null } } }).then(data => data.map(data => data.book_id))
    .then(checked => Promise.all([Books.findAll({ where: { id: { $notIn: checked } } }), Patrons.findAll()]))
}

const updateOrCreate = (req, res) => {
  if (req.params.models === 'loans') model = Loans;
  else if (req.params.models === 'books') model = Books;
  else if (req.params.models === 'patrons') model = Patrons;
  if (req.params.id) {
    return model.findAll({ where: { id: { $eq: req.params.id } } }).then(data => data[0].update(req.body))
      .then(() => res.redirect(link(req))).catch(err => handlePostErr(err, req, res))
  } else {
    return model.create(req.body).then(() => res.redirect(link(req))).catch(err => handlePostErr(err, req, res))
  }
}

const handlePostErr = (err, req, res) => {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') return query(req, res, err.errors);
  else res.sendStatus(500);
}
/***************************************************************** ROUTES *****************************************************************/
router.get('/', (req, res) => res.render('index', { title: 'Express' }));
router.get('/lists/:models/:filter', (req, res) => query(req, res));
router.get('/lists/:models', (req, res) => console.log(search));
router.get('/new/:models', (req, res) => query(req, res, []));
router.post('/new/:models', (req, res) => updateOrCreate(req, res));
router.get('/details/:models/:id', (req, res) => query(req, res,
router.post('/details/:models/:id', (req, res) => updateOrCreate(req, res));

module.exports = router;