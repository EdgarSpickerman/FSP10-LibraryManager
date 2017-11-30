var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res) => res.render('index', { title: 'Express' }));

router.get('/lists/:models/:filter', (req, res) => res.render('lists', { title: 'Express' }));

router.get('/details/:models/:id', (req, res) => res.render('details', { title: 'Express' }));

router.get('/new/:models', (req, res) => res.render('forms', { title: 'Express' }));

module.exports = router;
