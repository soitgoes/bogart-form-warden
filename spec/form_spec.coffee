Form = require '../lib/form'
bogart = require 'bogart'
q = bogart.q
EventEmitter = require('events').EventEmitter
formWarden = require('form-warden')


describe 'Form', ->

  it 'should construct', ->
    expect(new Form()).not.toBeUndefined()

  it 'should set viewEngine', ->
    viewEngine = new EventEmitter();

    expect(new Form().viewEngine(viewEngine).viewEngine()).toBe(viewEngine)

  it 'should set selector', ->
    selector = '.form';
    expect(new Form().selector(selector).selector()).toBe(selector)

  it 'should have default selector', ->
    expect(new Form().selector()).toBe('form')

  describe 'GET request', ->
    form = null
    validationOptions = null
    viewEngine = null
    afterRender = null
    next = null
    res = null
    req = null
    selector = '.someSelector'

    beforeEach ->
      validationOptions =
        fields:
          email: [ { isValid:"required", message:"Email is required"},
                   { isValid:"email", message:"Email must be valid"} ]

      viewEngine = bogart.viewEngine('mustache')
      spyOn(viewEngine, 'cache').andReturn('hello world')

      afterRender = jasmine.createSpy('afterRender')
      viewEngine.on('afterRender', afterRender)

      next = jasmine.createSpy 'next'
      next.andCallFake (req) ->
        viewEngine.respond 'index.mustache'

      req =
        method: 'get'
        pathInfo: '/'
        headers:
          accepts: 'text/html'

      form = new Form(validationOptions).viewEngine(viewEngine).selector(selector)

      res = form(next)(req)

    it 'should call next', (done) ->
      res
        .then ->
          expect(next).toHaveBeenCalled()
        .fail (err) =>
          @fail(err)
        .fin done

    it 'should add formWardenScript to locals', (done) ->
      res
        .then ->
          expect(afterRender.mostRecentCall.args[1].locals.formWardenScript).not.toBeUndefined()
        .fail (err) =>
          @fail(err)
        .fin done
    it 'should include the jquery formwarden call on the formWardenScript local variable', (done) ->
      res
        .then ->
          expect(afterRender.mostRecentCall.args[1].locals.formWardenScript).toContain('$("'+selector+'")')
        .fail (err) =>
          @fail(err)
        .fin done

  describe 'POST request', ->
    next = null
    validationOptions = null
    form = null
    res = null
    req = null

    beforeEach ->
      spyOn(formWarden, 'validateForm').andReturn({ validForm: true })
      next = jasmine.createSpy('next')
      next.andReturn q({ status: 200, body: [], headers: {} })

      form = new Form(validationOptions).viewEngine(viewEngine)

      req =
        method: 'post'
        pathInfo: '/'
        input: []
        headers:
          accepts: 'text/html'
        params:
          a: 1
          b: 2

      res = form(next)(req)

    it 'should call next', (done) ->
      res
        .then ->
          expect(next).toHaveBeenCalled()
        .fail (err) =>
          @fail err
        .fin done

    it 'should call validateForm', (done) ->
      res
        .then ->
          expect(formWarden.validateForm).toHaveBeenCalledWith(req.params, validationOptions)
        .fail (err) =>
          @fail err
        .fin done

    # it 'should respond with 403', (done) ->
    #   res
    #     .then ->
    #       expect(viewEngine.respond).toHaveBeenCalled()
#    it 'should call respond with errors', (done) ->
#      res
#        .then ->
#          expect(viewEngine.respond).toHaveBeenCalledWith({errors:[]});    
