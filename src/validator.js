(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.validator = factory(root);
  }
})(this, function (root) {

  'use strict';

  var exports = {};

  var requiredMessage = 'This field is required';

  var displayError = function (elem, type, message) {
    console.log('Type of error:', type);
    while (elem.parentNode) {
      if (elem.hasAttribute('data-error')) {
        elem.style.border = '1px solid red';
        break;
      }
      elem = elem.parentNode;
    }
  };

  var removeError = function () {

  };

  exports.template = function (message) {
    return '<li>' + message + '</li>';
  };

  exports.onError = function (elem, type, scope) {
    displayError(elem, type);
  };

  exports.afterError = function (elem, type, scope) {
    // console.log(elem);
  };

  var Validator = function (elem, options) {
    this.elem = elem;
    this.options = options || {};
    this.trigger = this.options.trigger || null;
    this.on = this.options.on || null;
    this.fields = [
      'input',
      'textarea',
      'select'
    ];
    this.callbacks = {
      valid: function () { return this; },
      invalid: function () { return this; }
    };
    if (!this.elem) return this.callbacks;
    addNoValidate(this.elem);
    for (var i = 0; i < this.trigger.length; i++) {
      addEvent(this.elem.querySelector(this.trigger[i]), this.on, bind(this.validate, this));
    }
  };

  Validator.prototype.constructor = Validator;

  Validator.prototype.valid = function (callback) {
    this.callbacks.valid = callback;
    return this;
  };

  Validator.prototype.invalid = function (callback) {
    this.callbacks.invalid = callback;
    return this;
  };

  Validator.prototype.validate = function (event) {
    var valid = true;
    var fields = getFields(this.elem, this.fields);
    for (var i = 0; i < fields.length; i++) {
      var result = checkNode(fields[i], this.elem);
      if (!result) {
        valid = false;
      }
    }
    if (valid) {
      this.callbacks.valid();
    } else {
      this.callbacks.invalid();
    }
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }
  };

  var compile = function (string) {
    var node = document.createElement('div');
    node.innerHTML = string;
    return node.childNodes[0];
  };

  var trim = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  };

  var bind = function (fn, obj) {
    return function () {
      return fn.apply(obj, arguments);
    };
  };

  var addNoValidate = function (elem) {
    if (!elem.hasAttribute('novalidate')) {
      elem.setAttribute('novalidate', '');
    }
  };

  var addEvent = function (elem, ev, callback) {
    if (elem.attachEvent) {
      elem['e' + ev + callback] = callback;
      elem[ev + callback] = function () {
        elem['e' + ev + callback](root.event);
      };
      elem.attachEvent('on' + ev, elem[ev + callback]);
    } else {
      elem.addEventListener(ev, callback, false);
    }
  };

  var getFields = function (scope, fields) {
    var elems = [];
    for (var i = 0; i < fields.length; i++) {
      var matches = scope.querySelectorAll(fields[i]);
      for (var j = 0; j < matches.length; j++) {
        if (!matches[j].hasAttribute('data-novalidate')) {
          elems.push(matches[j]);
        }
      }
    }
    return elems;
  };

  var getNode = function (elem) {
    var type;
    var nodeName = elem.nodeName.toLowerCase();
    switch (nodeName) {
    case 'select':
      type = nodeName;
      break;
    case 'textarea':
      type = nodeName;
      break;
    default:
      type = elem.type;
      break;
    }
    return type;
  };

  var getAttrs = function (elem) {
    var attrs = [];
    var elemAttrs = elem.attributes;
    for (var i = 0; i < elemAttrs.length; i++) {
      var attr = elemAttrs[i];
      var prop = attr.nodeName;
      var value = attr.nodeValue;
      if (prop === 'required' || prop === 'pattern') {
        var obj = {};
        obj[prop] = value;
        attrs.push(obj);
      }
    }
    return attrs;
  };

  var checkNode = function (elem, scope) {
    var attrs = getAttrs(elem);
    var node = getNode(elem);
    var valid = true;
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      for (var prop in attr) {
        var result = tool[prop](elem, node, attr[prop], scope);
        if (result) {
          exports.afterError(elem, prop, scope);
        } else {
          exports.onError(elem, prop, scope);
          valid = false;
        }
      }
    }
    return valid;
  };

  var tool = {
    type: function () {
      // TODO: Maybe... still debating the type check...
      // call patterns[pattern] to check
      // var toMatch = ['number', 'email', 'tel', 'url'];
    },
    required: function (elem, type, value, scope) {
      var test;
      switch (type) {
      case 'radio':
      case 'checkbox':
        test = function () {
          var names = scope.querySelectorAll('[name=' + elem.name + ']');
          for (var i = 0; i < names.length; i++) {
            if (names[i].checked) {
              return true;
            }
          }
          return false;
        };
        break;
      case 'select':
        test = function () {
          var value = trim(elem.options[elem.selectedIndex].value);
          if (!value) {
            return false;
          }
          return true;
        };
        break;
      default:
        test = function () {
          var value = trim(elem.value);
          if (new RegExp(patterns.empty).test(value)) {
            return false;
          }
          return true;
        };
        break;
      }
      return test();
    },
    pattern: function (elem, node, pattern) {
      var match = patterns[pattern];
      if (match) {
        pattern = match;
      }
      return new RegExp(pattern).test(elem.value);
    }
  };

  exports.run = function (scope, options) {
    var form = document.querySelector('form[name="' + scope + '"]');
    return new Validator(form, options);
  };

  var patterns = {
    email: '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$',
    url: '[-a-zA-Z0-9@:%._+~#=]{2,256}.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)',
    number: '^[-+]?[0-9]*.?[0-9]+$',
    empty: '^\\s*$'
  };

  exports.config = function (options) {
    options = options || {};
    var patterns = options.patterns;
    if (patterns) {
      for (var prop in patterns) {
        patterns[prop] = patterns[prop];
      }
    }
  };

  return exports;

});
