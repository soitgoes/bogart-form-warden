var fs = require('fs')
  , path = require('path')
  , bogart = require('bogart')
  , util = require('util')
  , q = bogart.q
  , formWarden = require('form-warden');

function createValidationBeforeRenderListener(req, validationResult) {
  return function (viewEngine, opts) {
    opts = opts || {};
    opts.locals = opts.locals || {};

    if (!validationResult.validForm) {
      opts.locals.errors = validationResult.fields;
    }
  };
}

function createInitializationBeforeRenderListener(req, selector, validationOptions) {
  return function (viewEngine, opts) {
    opts.locals.formWardenScript = 
      opts.locals.formWardenScript +
      '\n\n' +
      util.format('<script type="text/javascript">'+
        '(function ($) { $("%s").validation(%s); })(jQuery);'+
        '</script>',
        selector, JSON.stringify(validationOptions))
  };
}

function Form(validationOptions) {
  var selector = 'form'
    , viewEngine;

  var form = function (next) {
    var handler = function (req) {
      var res
        , initializationListener = createInitializationBeforeRenderListener(req,
                                      form.selector(), validationOptions);
      
      form.viewEngine().on('beforeRender', initializationListener);

      if (bogart.isPost(req) || bogart.isPut(req) || bogart.isDelete(req)) {
        var validationResult = formWarden.validateForm(req.params, validationOptions)
          , beforeRenderListener = createValidationBeforeRenderListener(req, validationResult);
      
        form.viewEngine().on('beforeRender', beforeRenderListener);

        res = next(req)
          .then(function (res) {
            return res;
          })
          .fin(function (res) {
            form.viewEngine().removeListener('beforeRender', beforeRenderListener);

            return res;
          });
      } else {
        res = next(req);
      }

      return res.fin(function (res) {
        form.viewEngine().removeListener('beforeRender', initializationListener);
        return res;
      });
    };

    return handler;
  };

  form.viewEngine = function (val) {
    if (val) {
      viewEngine = viewEnginePlugin(val);
      return this;
    }

    if (viewEngine === undefined) {
      viewEngine = bogart.viewEngine('mustache');
    }

    return viewEngine;
  };

  form.selector = function (val) {
    if (val) {
      selector = val;
      return this;
    }

    return selector;
  };

  return form;
}

Form.prototype.selector = function (val) {
  if (val) {
    this._selector = val;
    return this;
  }

  return this._selector;
};

/*
 * Private Helpers
 */

var formwardenScript;

function getFormwardenScript() {
  if (formwardenScript === undefined) {
    formwardenScript = readFormwardenScript();
  }

  return formwardenScript;
}

function readFormwardenScript() {
  var dir = path.join(__dirname, '..', 'node_modules',
        'form-warden');

  var formsWardenFilePath = path.join(dir, 'formwarden.js');
  var jQueryFormsWardenFilepath = path.join(dir, 'jquery.formwarden.js');

  return '<script type="text/javascript">' +
    fs.readFileSync(formsWardenFilePath, 'utf8') + '\n\n' +
    fs.readFileSync(jQueryFormsWardenFilepath, 'utf8') +
    '</script>';
}

/*
 * Adds the form warden script on key `opts.locals.formwardenScript`
 * in the `viewEngine.render` options.
 *
 * @param {ViewEngine} viewEngine  Bogart viewEngine
 * @returns {ViewEngine}
 */
function viewEnginePlugin(viewEngine) {
  viewEngine.on('beforeRender', function (viewEngine, opts) {
    opts = opts || {};
    opts.locals = opts.locals || {};

    var formwardenScript = getFormwardenScript();

    opts.locals.formwardenScript = getFormwardenScript();
  });

  return viewEngine;
}

module.exports = Form;
