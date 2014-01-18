var fs = require('fs'),
    path = require('path'),
    bogart = require('bogart'),
    util = require('util'),
    q = bogart.q,
    formWarden = require('form-warden');

function getErrorArray(fields){
    var errorList = [];
    for (var key in fields){
        if(fields.hasOwnProperty(key)){
            var field = fields[key];
        
            if (!field.valid && field.visible){
                errorList.push(field.error)
            }
        }
    }
    return errorList;
}

function createValidationBeforeRenderListener(req, errors) {
    return function(viewEngine, opts) {
        opts = opts || {};
        opts.locals = opts.locals || {};

        if (errors) {
            opts.locals.errors = errors;
            opts.status = 403;
        }
    };
}

function createInitializationBeforeRenderListener(req, selector, validationOptions) {
    return function(viewEngine, opts) {
        opts.locals.formWardenScript =
            opts.locals.formWardenScript +
            '\n\n' +
            util.format('<script type="text/javascript">' +
                '(function ($) { $("%s").validation(%s); })(jQuery);' +
                '</script>',
                selector, JSON.stringify(validationOptions))
    };
}

function Form(validationOptions) {
    var selector = 'form',
        viewEngine;

    var form = function(next) {
        var handler = function(req) {
            var res, initializationListener = createInitializationBeforeRenderListener(req,
                    form.selector(), validationOptions);

            form.viewEngine().on('beforeRender', initializationListener);

            if (bogart.isPost(req) || bogart.isPut(req) || bogart.isDelete(req)) {
                var validationResult = formWarden.validateForm(req.params, validationOptions),
                    errors = getErrorArray(validationResult.fields),
                    beforeRenderListener = createValidationBeforeRenderListener(req, errors);
                
                req.errors = errors;
                form.viewEngine().on('beforeRender', beforeRenderListener);
                res = next(req)
                    .then(function(res) {
                        return res;
                    })
                    .finally(function(res) {
                        form.viewEngine().removeListener('beforeRender', beforeRenderListener);
                        return res;
                    });
            } else {
                res = next(req);
            }
            return res.finally(function(res) {
                form.viewEngine().removeListener('beforeRender', initializationListener);
                return res;
            });
        };

        return handler;
    };

    form.viewEngine = function(val) {
        if (val) {
            viewEngine = viewEnginePlugin(val);
            return this;
        }
        if (viewEngine === undefined) {
            viewEngine = bogart.viewEngine('mustache');
        }
    
        return viewEngine;
    };

    form.selector = function(val) {
        if (val) {
            selector = val;
            return this;
        }

        return selector;
    };

    return form;
}

Form.prototype.selector = function(val) {
    if (val) {
        this._selector = val;
        return this;
    }

    return this._selector;
};

/*
 * Private Helpers
 */

var formWardenScript;

function getFormwardenScript() {
    if (formWardenScript === undefined) {
        formWardenScript = readFormwardenScript();
    }

    return formWardenScript;
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
    viewEngine.on('beforeRender', function(viewEngine, opts) {
        opts = opts || {};
        opts.locals = opts.locals || {};

        var formWardenScript = getFormwardenScript();

        opts.locals.formWardenScript = formWardenScript;
    });

    return viewEngine;
}

module.exports = Form;