var express = require('express');
var router = express.Router();
const controller = require('../controller/auth')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login',controller.login)

router.post('/register',controller.register)

module.exports = router;
