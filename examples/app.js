var bogart = require('bogart')
  , formWarden = require('../index');

var viewEngine = bogart.viewEngine('mustache');

var validationOptions = {
  fields: {
    email: [
      {
        isValid: 'required',
        message: 'Email is required'
      },
      {
        isValid: 'email',
        message: 'Email must be a valid email address'
      }
    ]
  }
};

var router = bogart.router();

var emailForm = formWarden(validationOptions)
  .viewEngine(viewEngine)
  .selector('#emailForm');

router.get('/', emailForm, function (req) {
  var email = req.params.email;
  return viewEngine.respond('index.html', {
    layout: false,
    locals: { email: email }
  });
});

router.post('/', emailForm, function (req) {
  return viewEngine.respond('index.html', {
    layout: false,
    locals: { email: req.params.email || '' }
  });
});

var app = bogart.app();
app.use(bogart.middleware.directory('public'));
app.use(router);

app.start();
