# Bogart Form Warden

## Installation

* Install with npm: `npm install bogart-form-warden`
* Clone from git: `git clone https://github.com/nrstott/bogart-form-warden`

## Usage

This package provies Form Warden JSGI middleware.
Require `bogart-form-warden` for the middleware constructor.
Use it in routes or in `app.use` calls.

Example of using `formWarden` middleware in a route:

    var router = bogart.router();

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

    router.get('/',

      formWarden(validationOptions).viewEngine(viewEngine),

      function (req) {
        var email = req.params.email;
        return viewEngine.respond('index.html', {
          locals: { email: email }
        });
      }
    );

## Tests

Run the tests with `npm test`.

## Example

* Install dependencies: `npm install`.
* Run the example in the `examples` directory: `node examples/app.js`.
