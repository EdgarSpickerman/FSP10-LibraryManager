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

const query = (req, res, errors, next) => {
  if (!validatePath(req)) res.sendStatus(404);
  let condition = {};
  let fCond = {};
  if (req.params.filter) {
    let model = Loans;
    if (req.params.filter === 'all' && req.params.models === 'loans') condition = { include: [Books, Patrons] };
    if (req.params.filter === 'all' && req.params.models === 'patrons') model = Patrons;
    if (req.params.filter === 'all' && req.params.models === 'books') model = Books;
    if (req.params.filter === 'overdue') condition = { include: [Books, Patrons], where: { returned_on: { $eq: null }, return_by: { $lt: today } } };
    if (req.params.filter === 'checked out') condition = { include: [Books, Patrons], where: { returned_on: { $eq: null } } };
    return getData(model, condition).then(data => setProps(data, req))
      .then(view => res.render('lists', view)).catch(handleErr);
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
    view.pages = data.map((data, index) => index / 10).filter(val => Number.isInteger(val)).map(data => data + 1);
    if (req.params.filter !== 'all' && req.params.models === 'books') view[req.params.models] = data.map(data => data.book)
    else view[req.params.models] = data
    if (req.params.filter === 'all') view.all = true;
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
    } //need a setProp for the searching
  }
  return view;
}

const setSearchProps = (data, req) => { return { [req.params.models]: data, title: `${pluralToSingle(req.params.models)} Search Results` } }

const getAvailLoans = () => {
  return Loans.findAll({ where: { returned_on: { $eq: null } } }).then(data => data.map(data => data.book_id))
    .then(checked => Promise.all([Books.findAll({ where: { id: { $notIn: checked } } }), Patrons.findAll()]))
}

const updateOrCreate = (req, res, next) => {
  if (!validatePath(req)) res.sendStatus(404);
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

const searchfor = (req, res) => {
  let model = Loans;
  let condition = { where: {} };
  if (req.params.models === 'books') model = Books;
  else if (req.params.models === 'patrons') model = Patrons;
  for (prop in req.query) {
    if (req.query[prop] !== '') {
      condition.where[prop] = { $like: `%${req.query[prop]}%` };
    }
  }
  if (req.params.models === 'loans') {
    condition.include = [{ model: Books, where: {} }, { model: Patrons, where: {} }];
    if (req.query.title) {
      condition.include[0].where.title = { $like: `%${req.query.title}%` }
      delete condition.where.title;
    }
    if (req.query.first_name) {
      condition.include[1].where.first_name = { $like: `%${req.query.first_name}%` }
      delete condition.where.first_name;
    }
    if (req.query.last_name) {
      condition.include[1].where.last_name = { $like: `%${req.query.last_name}%` }
      delete condition.where.last_name;
    }
  }
  return model.findAll(condition).then(data => setSearchProps(data, req)).then(view =>res.render('lists', view)).catch(handleErr);
}

const handlePostErr = (err, req, res) => {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') return query(req, res, err.errors);
  else res.sendStatus(500);
}

const validatePath = (req) => {
  if (req.params.models === 'loans' || req.params.models === 'books' || req.params.models === 'patrons') {
    if (req.params.filter) {
      if (req.params.filter === 'all' || req.params.filter === 'overdue' || req.params.filter === 'checked out') {
        return true
      } else return false
    } else return true
  } else return false
}
/***************************************************************** ROUTES *****************************************************************/
router.get('/', (req, res) => res.render('index', { title: 'Express' }));
router.get('/lists/:models/:filter', (req, res, next) => query(req, res, [], next));
router.get('/new/:models', (req, res, next) => query(req, res, [], next));
router.get('/details/:models/:id', (req, res, next) => query(req, res, [], next));
router.get('/lists/:models', (req, res, next) => searchfor(req,res));
router.post('/new/:models', (req, res, next) => updateOrCreate(req, res, next));
router.post('/details/:models/:id', (req, res, next) => updateOrCreate(req, res, next));

module.exports = router;