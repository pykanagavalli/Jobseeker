var express = require('express');
var router = express.Router();
const controller = require('../controller/auth')
const helper = require('../helper/common')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login',controller.login)

router.post('/register',controller.register)

router.get('/GetOneUser',helper.verifyPayload,controller.GetOneUser)

router.get('/logout',helper.verifyPayload,controller.logout)


module.exports = router;
