(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*! kefir - 0.1.12
 *  https://github.com/pozadi/kefir
 */
;(function(global){
  "use strict";

var NOTHING = ['<nothing>'];

function id(x) {return x}

function get(map, key, notFound) {
  if (map && key in map) {
    return map[key];
  } else {
    return notFound;
  }
}

function own(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function createObj(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F();
}

function extend(/*target, mixin1, mixin2...*/) {
  var length = arguments.length
    , result, i, prop;
  if (length === 1) {
    return arguments[0];
  }
  result = arguments[0];
  for (i = 1; i < length; i++) {
    for (prop in arguments[i]) {
      if(own(arguments[i], prop)) {
        result[prop] = arguments[i][prop];
      }
    }
  }
  return result;
}

function inherit(Child, Parent/*[, mixin1, mixin2, ...]*/) {
  var length = arguments.length
    , i;
  Child.prototype = createObj(Parent.prototype);
  Child.prototype.constructor = Child;
  for (i = 2; i < length; i++) {
    extend(Child.prototype, arguments[i]);
  }
  return Child;
}

function agrsToArray(args) {
  if (args.length === 1 && isArray(args[0])) {
    return args[0];
  }
  return toArray(args);
}

function getFn(fn, context) {
  if (isFn(fn)) {
    return fn;
  } else {
    if (context == null || !isFn(context[fn])) {
      throw new Error('not a function: ' + fn + ' in ' + context);
    } else {
      return context[fn];
    }
  }
}

function call(fn, context, args) {
  if (context != null) {
    if (!args || args.length === 0) {
      return fn.call(context);
    } else {
      return fn.apply(context, args);
    }
  } else {
    if (!args || args.length === 0) {
      return fn();
    }
    switch (args.length) {
      case 1: return fn(args[0]);
      case 2: return fn(args[0], args[1]);
      case 3: return fn(args[0], args[1], args[2]);
    }
    return fn.apply(null, args);
  }
}

function concat(a, b) {
  var result = new Array(a.length + b.length)
    , j = 0
    , length, i;
  length = a.length;
  for (i = 0; i < length; i++, j++) {
    result[j] = a[i];
  }
  length = b.length;
  for (i = 0; i < length; i++, j++) {
    result[j] = b[i];
  }
  return result;
}

function cloneArray(input) {
  var length = input.length
    , result = new Array(length)
    , i;
  for (i = 0; i < length; i++) {
    result[i] = input[i];
  }
  return result;
}

function map(input, fn) {
  var length = input.length
    , result = new Array(length)
    , i;
  for (i = 0; i < length; i++) {
    result[i] = fn(input[i]);
  }
  return result;
}

function fillArray(arr, value) {
  var length = arr.length
    , i;
  for (i = 0; i < length; i++) {
    arr[i] = value;
  }
}

function contains(arr, value) {
  var length = arr.length
    , i;
  for (i = 0; i < length; i++) {
    if (arr[i] === value) {
      return true;
    }
  }
  return false;
}

function rest(arr, start, onEmpty) {
  if (arr.length > start) {
    return Array.prototype.slice.call(arr, start);
  }
  return onEmpty;
}

function toArray(arrayLike) {
  if (isArray(arrayLike)) {
    return arrayLike;
  } else {
    return cloneArray(arrayLike);
  }
}

var now = Date.now ?
  function() { return Date.now() } :
  function() { return new Date().getTime() };

function isFn(fn) {
  return typeof fn === 'function';
}

function isUndefined(x) {
  return typeof x === 'undefined';
}

function isArray(xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
}

var isArguments = function(xs) {
  return Object.prototype.toString.call(xs) === '[object Arguments]';
}

// For IE
if (!isArguments(arguments)) {
  isArguments = function(obj) {
    return !!(obj && own(obj, 'callee'));
  }
}

function isEqualArrays(a, b) {
  var length, i;
  if (a == null && b == null) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (i = 0, length = a.length; i < length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function toStream(obs) {
  if (obs instanceof Stream) {
    return obs;
  } else {
    return obs.changes();
  }
}

function toProperty(obs) {
  if (obs instanceof Stream) {
    return obs.toProperty();
  } else {
    return obs;
  }
}

function withInterval(name, mixin) {

  function AnonymousStream(wait, args) {
    Stream.call(this);
    this._wait = wait;
    this._intervalId = null;
    var _this = this;
    this._bindedOnTick = function() {  _this._onTick()  }
    this._init(args);
  }

  inherit(AnonymousStream, Stream, {

    _name: name,

    _init: function(args) {},
    _free: function() {},

    _onTick: function() {},

    _onActivation: function() {
      this._intervalId = setInterval(this._bindedOnTick, this._wait);
    },
    _onDeactivation: function() {
      if (this._intervalId !== null) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    },

    _clear: function() {
      Stream.prototype._clear.call(this);
      this._bindedOnTick = null;
      this._free();
    }

  }, mixin);

  Kefir[name] = function(wait) {
    return new AnonymousStream(wait, rest(arguments, 1, []));
  }
}

function withOneSource(name, mixin, options) {


  options = extend({
    streamMethod: function(StreamClass, PropertyClass) {
      return function() {  return new StreamClass(this, arguments)  }
    },
    propertyMethod: function(StreamClass, PropertyClass) {
      return function() {  return new PropertyClass(this, arguments)  }
    }
  }, options || {});



  mixin = extend({
    _init: function(args) {},
    _free: function() {},

    _handleValue: function(x, isCurrent) {  this._send('value', x, isCurrent)  },
    _handleEnd: function(__, isCurrent) {  this._send('end', null, isCurrent)  },

    _onActivationHook: function() {},
    _onDeactivationHook: function() {},

    _handleAny: function(type, x, isCurrent) {
      switch (type) {
        case 'value': this._handleValue(x, isCurrent); break;
        case 'end': this._handleEnd(x, isCurrent); break;
      }
    },

    _onActivation: function() {
      this._onActivationHook();
      this._source.on('any', [this._handleAny, this]);
    },
    _onDeactivation: function() {
      this._onDeactivationHook();
      this._source.off('any', [this._handleAny, this]);
    }
  }, mixin || {});



  function AnonymousStream(source, args) {
    Stream.call(this);
    this._source = source;
    this._name = source._name + '.' + name;
    this._init(args);
  }

  inherit(AnonymousStream, Stream, {
    _clear: function() {
      Stream.prototype._clear.call(this);
      this._source = null;
      this._free();
    }
  }, mixin);



  function AnonymousProperty(source, args) {
    Property.call(this);
    this._source = source;
    this._name = source._name + '.' + name;
    this._init(args);
  }

  inherit(AnonymousProperty, Property, {
    _clear: function() {
      Property.prototype._clear.call(this);
      this._source = null;
      this._free();
    }
  }, mixin);



  if (options.streamMethod) {
    Stream.prototype[name] = options.streamMethod(AnonymousStream, AnonymousProperty);
  }

  if (options.propertyMethod) {
    Property.prototype[name] = options.propertyMethod(AnonymousStream, AnonymousProperty);
  }

}



var Kefir = {};





// Fn

function Fn(fnMeta) {
  if (isFn(fnMeta) || (fnMeta instanceof Fn)) {
    return fnMeta;
  }
  if (fnMeta && fnMeta.length) {
    if (fnMeta.length === 1) {
      if (isFn(fnMeta[0])) {
        return fnMeta[0];
      } else {
        throw new Error('can\'t convert to Fn ' + fnMeta);
      }
    }
    this.fn = getFn(fnMeta[0], fnMeta[1]);
    this.context = fnMeta[1];
    this.args = rest(fnMeta, 2, null);
  } else {
    throw new Error('can\'t convert to Fn ' + fnMeta);
  }
}
Kefir.Fn = Fn;

Fn.call = function(fn, args) {
  if (isFn(fn)) {
    return call(fn, null, args);
  } else if (fn instanceof Fn) {
    if (fn.args) {
      if (args) {
        args = concat(fn.args, args);
      } else {
        args = fn.args;
      }
    }
    return call(fn.fn, fn.context, args);
  } else {
    return Fn.call(new Fn(fn), args);
  }
}

Fn.isEqual = function(a, b) {
  if (a === b) {
    return true;
  }
  a = new Fn(a);
  b = new Fn(b);
  if (isFn(a) || isFn(b)) {
    return a === b;
  }
  return a.fn === b.fn &&
    a.context === b.context &&
    isEqualArrays(a.args, b.args);
}




// Subscribers

function Subscribers() {
  this.value = [];
  this.end = [];
  this.any = [];
  this.total = 0;
}

extend(Subscribers.prototype, {
  add: function(type, fn) {
    this[type].push(new Fn(fn));
    this.total++;
  },
  remove: function(type, fn) {
    var subs = this[type]
      , length = subs.length
      , i;
    fn = new Fn(fn);
    for (i = 0; i < length; i++) {
      if (Fn.isEqual(subs[i], fn)) {
        subs.splice(i, 1);
        this.total--;
        return;
      }
    }
  },
  call: function(type, args) {
    var subs = this[type]
      , length = subs.length
      , i;
    if (length !== 0) {
      if (length === 1) {
        Fn.call(subs[0], args);
      } else {
        subs = cloneArray(subs);
        for (i = 0; i < length; i++) {
          Fn.call(subs[i], args);
        }
      }
    }
  },
  isEmpty: function() {
    return this.total === 0;
  }
});





// Observable

function Observable() {
  this._subscribers = new Subscribers();
  this._active = false;
  this._alive = true;
}
Kefir.Observable = Observable;

extend(Observable.prototype, {

  _name: 'observable',

  _onActivation: function() {},
  _onDeactivation: function() {},

  _setActive: function(active) {
    if (this._active !== active) {
      this._active = active;
      if (active) {
        this._onActivation();
      } else {
        this._onDeactivation();
      }
    }
  },

  _clear: function() {
    this._setActive(false);
    this._alive = false;
    this._subscribers = null;
  },

  _send: function(type, x, isCurrent) {
    if (this._alive) {
      if (!(type === 'end' && isCurrent)) {
        if (type === 'end') {  x = undefined  }
        this._subscribers.call(type, [x, !!isCurrent]);
        this._subscribers.call('any', [type, x, !!isCurrent]);
      }
      if (type === 'end') {  this._clear()  }
    }
  },

  _callWithCurrent: function(fnType, fn, valueType, value) {
    if (fnType === valueType) {
      Fn.call(fn, [value, true]);
    } else if (fnType === 'any') {
      Fn.call(fn, [valueType, value, true]);
    }
  },

  on: function(type, fn) {
    if (this._alive) {
      this._subscribers.add(type, fn);
      this._setActive(true);
    }
    if (!this._alive) {
      this._callWithCurrent(type, fn, 'end');
    }
    return this;
  },

  off: function(type, fn) {
    if (this._alive) {
      this._subscribers.remove(type, fn);
      if (this._subscribers.isEmpty()) {
        this._setActive(false);
      }
    }
    return this;
  },

  toString: function() {  return '[' + this._name + ']'  }

});









// Stream

function Stream() {
  Observable.call(this);
}
Kefir.Stream = Stream;

inherit(Stream, Observable, {

  _name: 'stream'

});







// Property

function Property() {
  Observable.call(this);
  this._current = NOTHING;
}
Kefir.Property = Property;

inherit(Property, Observable, {

  _name: 'property',

  _send: function(type, x, isCurrent) {
    if (this._alive) {
      if (!isCurrent) {
        if (type === 'end') {  x = undefined  }
        this._subscribers.call(type, [x, false]);
        this._subscribers.call('any', [type, x, false]);
      }
      if (type === 'value') {  this._current = x  }
      if (type === 'end') {  this._clear()  }
    }
  },

  on: function(type, fn) {
    if (this._alive) {
      this._subscribers.add(type, fn);
      this._setActive(true);
    }
    if (this._current !== NOTHING) {
      this._callWithCurrent(type, fn, 'value', this._current);
    }
    if (!this._alive) {
      this._callWithCurrent(type, fn, 'end');
    }
    return this;
  }

});






// Log

function logCb(name, type, x, isCurrent) {
  console.log(name, '<' + type + (isCurrent ? ':current' : '') + '>', x);
}

Observable.prototype.log = function(name) {
  this.on('any', [logCb, null, name || this.toString()]);
  return this;
}

Observable.prototype.offLog = function(name) {
  this.off('any', [logCb, null, name || this.toString()]);
  return this;
}



// Kefir.withInterval()

withInterval('withInterval', {
  _init: function(args) {
    this._fn = new Fn(args[0]);
    var _this = this;
    this._bindedSend = function(type, x) {  _this._send(type, x)  }
  },
  _free: function() {
    this._fn = null;
    this._bindedSend = null;
  },
  _onTick: function() {
    Fn.call(this._fn, [this._bindedSend]);
  }
});





// Kefir.fromPoll()

withInterval('fromPoll', {
  _init: function(args) {
    this._fn = new Fn(args[0]);
  },
  _free: function() {
    this._fn = null;
  },
  _onTick: function() {
    this._send('value', Fn.call(this._fn));
  }
});





// Kefir.interval()

withInterval('interval', {
  _init: function(args) {
    this._x = args[0];
  },
  _free: function() {
    this._x = null;
  },
  _onTick: function() {
    this._send('value', this._x);
  }
});




// Kefir.sequentially()

withInterval('sequentially', {
  _init: function(args) {
    this._xs = cloneArray(args[0]);
    if (this._xs.length === 0) {
      this._send('end')
    }
  },
  _free: function() {
    this._xs = null;
  },
  _onTick: function() {
    switch (this._xs.length) {
      case 1:
        this._send('value', this._xs[0]);
        this._send('end');
        break;
      default:
        this._send('value', this._xs.shift());
    }
  }
});




// Kefir.repeatedly()

withInterval('repeatedly', {
  _init: function(args) {
    this._xs = cloneArray(args[0]);
    this._i = -1;
  },
  _onTick: function() {
    if (this._xs.length > 0) {
      this._i = (this._i + 1) % this._xs.length;
      this._send('value', this._xs[this._i]);
    }
  }
});





// Kefir.later()

withInterval('later', {
  _init: function(args) {
    this._x = args[0];
  },
  _free: function() {
    this._x = null;
  },
  _onTick: function() {
    this._send('value', this._x);
    this._send('end');
  }
});

// .merge()

function Merge(sources) {
  Stream.call(this);
  if (sources.length === 0) {
    this._send('end');
  } else {
    this._sources = sources;
    this._aliveCount = 0;
  }
}

inherit(Merge, Stream, {

  _name: 'merge',

  _onActivation: function() {
    var length = this._sources.length,
        i;
    this._aliveCount = length;
    for (i = 0; i < length; i++) {
      this._sources[i].on('any', [this._handleAny, this]);
    }
  },

  _onDeactivation: function() {
    var length = this._sources.length,
        i;
    for (i = 0; i < length; i++) {
      this._sources[i].off('any', [this._handleAny, this]);
    }
  },

  _handleAny: function(type, x, isCurrent) {
    if (type === 'value') {
      this._send('value', x, isCurrent);
    } else {
      this._aliveCount--;
      if (this._aliveCount === 0) {
        this._send('end', null, isCurrent);
      }
    }
  },

  _clear: function() {
    Stream.prototype._clear.call(this);
    this._sources = null;
  }

});

Kefir.merge = function(sources) {
  return new Merge(sources);
}

Observable.prototype.merge = function(other) {
  return Kefir.merge([this, other]);
}







// .combine()

function Combine(sources, combinator) {
  Property.call(this);
  if (sources.length === 0) {
    this._send('end');
  } else {
    this._combinator = combinator ? new Fn(combinator) : null;
    this._sources = map(sources, toProperty);
    this._aliveCount = 0;
    this._currents = new Array(sources.length);
  }
}

inherit(Combine, Property, {

  _name: 'combine',

  _onActivation: function() {
    var length = this._sources.length,
        i;
    this._aliveCount = length;
    fillArray(this._currents, NOTHING);
    for (i = 0; i < length; i++) {
      this._sources[i].on('any', [this._handleAny, this, i]);
    }
  },

  _onDeactivation: function() {
    var length = this._sources.length,
        i;
    for (i = 0; i < length; i++) {
      this._sources[i].off('any', [this._handleAny, this, i]);
    }
  },

  _handleAny: function(i, type, x, isCurrent) {
    if (type === 'value') {
      this._currents[i] = x;
      if (!contains(this._currents, NOTHING)) {
        var combined = cloneArray(this._currents);
        if (this._combinator) {
          combined = Fn.call(this._combinator, this._currents);
        }
        this._send('value', combined, isCurrent);
      }
    } else {
      this._aliveCount--;
      if (this._aliveCount === 0) {
        this._send('end', null, isCurrent);
      }
    }
  },

  _clear: function() {
    Property.prototype._clear.call(this);
    this._sources = null;
  }

});

Kefir.combine = function(sources, combinator) {
  return new Combine(sources, combinator);
}

Observable.prototype.combine = function(other, combinator) {
  return Kefir.combine([this, other], combinator);
}






// .sampledBy()

function SampledBy(passive, active, combinator) {
  Stream.call(this);
  if (active.length === 0) {
    this._send('end');
  } else {
    this._passiveCount = passive.length;
    this._combinator = combinator ? new Fn(combinator) : null;
    this._sources = concat(passive, active);
    this._aliveCount = 0;
    this._currents = new Array(this._sources.length);
    fillArray(this._currents, NOTHING);
  }
}

inherit(SampledBy, Stream, {

  _name: 'sampledBy',

  _onActivation: function() {
    var length = this._sources.length,
        i;
    this._aliveCount = length - this._passiveCount;
    for (i = 0; i < length; i++) {
      this._sources[i].on('any', [this._handleAny, this, i]);
    }
  },

  _onDeactivation: function() {
    var length = this._sources.length,
        i;
    for (i = 0; i < length; i++) {
      this._sources[i].off('any', [this._handleAny, this, i]);
    }
  },

  _handleAny: function(i, type, x, isCurrent) {
    if (type === 'value') {
      this._currents[i] = x;
      if (i >= this._passiveCount) {
        if (!contains(this._currents, NOTHING)) {
          var combined = cloneArray(this._currents);
          if (this._combinator) {
            combined = Fn.call(this._combinator, this._currents);
          }
          this._send('value', combined, isCurrent);
        }
      }
    } else {
      if (i >= this._passiveCount) {
        this._aliveCount--;
        if (this._aliveCount === 0) {
          this._send('end', null, isCurrent);
        }
      }
    }
  },

  _clear: function() {
    Stream.prototype._clear.call(this);
    this._sources = null;
  }

});

Kefir.sampledBy = function(passive, active, combinator) {
  return new SampledBy(passive, active, combinator);
}

Observable.prototype.sampledBy = function(other, combinator) {
  return Kefir.sampledBy([this], [other], combinator);
}






// .pool()

function _AbstractPool() {
  Stream.call(this);
  this._sources = [];
}

inherit(_AbstractPool, Stream, {

  _name: 'abstractPool',

  _sub: function(obs) {
    obs.on('value', [this._send, this, 'value']);
    obs.on('end', [this._remove, this, obs]);
  },
  _unsub: function(obs) {
    obs.off('value', [this._send, this, 'value']);
    obs.off('end', [this._remove, this, obs]);
  },

  _add: function(obs) {
    this._sources.push(obs);
    if (this._active) {
      this._sub(obs);
    }
  },
  _remove: function(obs) {
    if (this._active) {
      this._unsub(obs);
    }
    for (var i = 0; i < this._sources.length; i++) {
      if (this._sources[i] === obs) {
        this._sources.splice(i, 1);
        return;
      }
    }
  },

  _onActivation: function() {
    var sources = cloneArray(this._sources);
    for (var i = 0; i < sources.length; i++) {
      this._sub(sources[i]);
    }
  },
  _onDeactivation: function() {
    for (var i = 0; i < this._sources.length; i++) {
      this._unsub(this._sources[i]);
    }
  }

});



function Pool() {
  _AbstractPool.call(this);
}

inherit(Pool, _AbstractPool, {

  _name: 'pool',

  add: function(obs) {
    this._add(obs);
    return this;
  },
  remove: function(obs) {
    this._remove(obs);
    return this;
  }

});

Kefir.pool = function() {
  return new Pool();
}





// .flatMap()

function FlatMap(source, fn) {
  _AbstractPool.call(this);
  this._source = source;
  this._name = source._name + '.flatMap';
  this._fn = fn ? new Fn(fn) : null;
  this._mainEnded = false;
}

inherit(FlatMap, _AbstractPool, {

  _onActivation: function() {
    _AbstractPool.prototype._onActivation.call(this);
    this._source.on('any', [this._handleMainSource, this]);
  },
  _onDeactivation: function() {
    _AbstractPool.prototype._onDeactivation.call(this);
    this._source.off('any', [this._handleMainSource, this]);
  },

  _handleMainSource: function(type, x, isCurrent) {
    if (type === 'value') {
      if (this._fn) {
        x = Fn.call(this._fn, [x]);
      }
      this._add(x);
    } else {
      if (this._sources.length === 0) {
        this._send('end', null, isCurrent);
      } else {
        this._mainEnded = true;
      }
    }
  },

  _remove: function(obs) {
    _AbstractPool.prototype._remove.call(this, obs);
    if (this._mainEnded && this._sources.length === 0) {
      this._send('end');
    }
  },

  _clear: function() {
    _AbstractPool.prototype._clear.call(this);
    this._source = null;
  }

});

Observable.prototype.flatMap = function(fn) {
  return new FlatMap(this, fn);
}







// .flatMapLatest()
// TODO


// .toProperty()

withOneSource('toProperty', {
  _init: function(args) {
    if (args.length > 0) {
      this._send('value', args[0]);
    }
  }
}, {
  propertyMethod: null,
  streamMethod: function(StreamClass, PropertyClass) {
    return function() {  return new PropertyClass(this, arguments)  }
  }
});




// .changes()

withOneSource('changes', {
  _handleValue: function(x, isCurrent) {
    if (!isCurrent) {
      this._send('value', x);
    }
  }
}, {
  streamMethod: null,
  propertyMethod: function(StreamClass, PropertyClass) {
    return function() {  return new StreamClass(this)  }
  }
});




// .withHandler()

withOneSource('withHandler', {
  _init: function(args) {
    var _this = this;
    this._handler = new Fn(args[0]);
    this._bindedSend = function(type, x, isCurrent) {  _this._send(type, x, isCurrent)  }
  },
  _free: function() {
    this._handler = null;
    this._bindedSend = null;
  },
  _handleAny: function(type, x, isCurrent) {
    Fn.call(this._handler, [this._bindedSend, type, x, isCurrent]);
  }
});





// .map(fn)

withOneSource('map', {
  _init: function(args) {
    this._fn = new Fn(args[0]);
  },
  _free: function() {
    this._fn = null;
  },
  _handleValue: function(x, isCurrent) {
    this._send('value', Fn.call(this._fn, [x]), isCurrent);
  }
});





// .filter(fn)

withOneSource('filter', {
  _init: function(args) {
    this._fn = new Fn(args[0]);
  },
  _free: function() {
    this._fn = null;
  },
  _handleValue: function(x, isCurrent) {
    if (Fn.call(this._fn, [x])) {
      this._send('value', x, isCurrent);
    }
  }
});





// .takeWhile(fn)

withOneSource('takeWhile', {
  _init: function(args) {
    this._fn = new Fn(args[0]);
  },
  _free: function() {
    this._fn = null;
  },
  _handleValue: function(x, isCurrent) {
    if (Fn.call(this._fn, [x])) {
      this._send('value', x, isCurrent);
    } else {
      this._send('end', null, isCurrent);
    }
  }
});





// .take(n)

withOneSource('take', {
  _init: function(args) {
    this._n = args[0];
    if (this._n <= 0) {
      this._send('end');
    }
  },
  _handleValue: function(x, isCurrent) {
    this._n--;
    this._send('value', x, isCurrent);
    if (this._n === 0) {
      this._send('end');
    }
  }
});





// .skip(n)

withOneSource('skip', {
  _init: function(args) {
    this._n = args[0] < 0 ? 0 : args[0];
  },
  _handleValue: function(x, isCurrent) {
    if (this._n === 0) {
      this._send('value', x, isCurrent);
    } else {
      this._n--;
    }
  }
});




// .skipDuplicates([fn])

function strictlyEqual(a, b) {  return a === b  }

withOneSource('skipDuplicates', {
  _init: function(args) {
    if (args.length > 0) {
      this._fn = new Fn(args[0]);
    } else {
      this._fn = strictlyEqual;
    }
    this._prev = NOTHING;
  },
  _free: function() {
    this._fn = null;
    this._prev = null;
  },
  _handleValue: function(x, isCurrent) {
    if (this._prev === NOTHING || !Fn.call(this._fn, [this._prev, x])) {
      this._send('value', x, isCurrent);
    }
    this._prev = x;
  }
});





// .skipWhile(fn)

withOneSource('skipWhile', {
  _init: function(args) {
    this._fn = new Fn(args[0]);
    this._skip = true;
  },
  _free: function() {
    this._fn = null;
  },
  _handleValue: function(x, isCurrent) {
    if (!this._skip) {
      this._send('value', x, isCurrent);
      return;
    }
    if (!Fn.call(this._fn, [x])) {
      this._skip = false;
      this._fn = null;
      this._send('value', x, isCurrent);
    }
  }
});





// .diff(seed, fn)

withOneSource('diff', {
  _init: function(args) {
    this._prev = args[0];
    this._fn = new Fn(rest(args, 1));
  },
  _free: function() {
    this._prev = null;
    this._fn = null;
  },
  _handleValue: function(x, isCurrent) {
    this._send('value', Fn.call(this._fn, [this._prev, x]), isCurrent);
    this._prev = x;
  }
});





// .scan(seed, fn)

withOneSource('scan', {
  _init: function(args) {
    this._prev = args[0];
    this._fn = new Fn(rest(args, 1));
  },
  _free: function() {
    this._prev = null;
    this._fn = null;
  },
  _handleValue: function(x, isCurrent) {
    this._prev = Fn.call(this._fn, [this._prev, x]);
    this._send('value', this._prev, isCurrent);
  }
});





// .reduce(seed, fn)

withOneSource('reduce', {
  _init: function(args) {
    this._result = args[0];
    this._fn = new Fn(rest(args, 1));
  },
  _free: function(){
    this._fn = null;
    this._result = null;
  },
  _handleValue: function(x) {
    this._result = Fn.call(this._fn, [this._result, x]);
  },
  _handleEnd: function(__, isCurrent) {
    this._send('value', this._result, isCurrent);
    this._send('end', null, isCurrent);
  }
});





// .throttle(wait, {leading, trailing})

withOneSource('throttle', {
  _init: function(args) {
    this._wait = args[0];
    this._leading = get(args[1], 'leading', true);
    this._trailing = get(args[1], 'trailing', true);
    this._trailingCallValue = null;
    this._trailingCallTimeoutId = null;
    this._endAfterTrailingCall = false;
    this._lastCallTime = 0;
    var _this = this;
    this._makeTrailingCallBinded = function() {  _this._makeTrailingCall()  };
  },
  _free: function() {
    this._trailingCallValue = null;
    this._makeTrailingCallBinded = null;
  },
  _handleValue: function(x, isCurrent) {
    if (isCurrent) {
      this._send('value', x, isCurrent);
      return;
    }
    var curTime = now();
    if (this._lastCallTime === 0 && !this._leading) {
      this._lastCallTime = curTime;
    }
    var remaining = this._wait - (curTime - this._lastCallTime);
    if (remaining <= 0) {
      this._cancelTralingCall();
      this._lastCallTime = curTime;
      this._send('value', x);
    } else if (this._trailing) {
      this._scheduleTralingCall(x, remaining);
    }
  },
  _handleEnd: function(__, isCurrent) {
    if (isCurrent) {
      this._send('end', null, isCurrent);
      return;
    }
    if (this._trailingCallTimeoutId) {
      this._endAfterTrailingCall = true;
    } else {
      this._send('end');
    }
  },
  _scheduleTralingCall: function(value, wait) {
    if (this._trailingCallTimeoutId) {
      this._cancelTralingCall();
    }
    this._trailingCallValue = value;
    this._trailingCallTimeoutId = setTimeout(this._makeTrailingCallBinded, wait);
  },
  _cancelTralingCall: function() {
    if (this._trailingCallTimeoutId !== null) {
      clearTimeout(this._trailingCallTimeoutId);
      this._trailingCallTimeoutId = null;
    }
  },
  _makeTrailingCall: function() {
    this._send('value', this._trailingCallValue);
    this._trailingCallTimeoutId = null;
    this._trailingCallValue = null;
    this._lastCallTime = !this._leading ? 0 : now();
    if (this._endAfterTrailingCall) {
      this._send('end');
    }
  }
});






// .delay()

withOneSource('delay', {
  _init: function(args) {
    this._wait = args[0];
  },
  _handleValue: function(x, isCurrent) {
    if (isCurrent) {
      this._send('value', x, isCurrent);
      return;
    }
    var _this = this;
    setTimeout(function() {  _this._send('value', x)  }, this._wait);
  },
  _handleEnd: function(__, isCurrent) {
    if (isCurrent) {
      this._send('end', null, isCurrent);
      return;
    }
    var _this = this;
    setTimeout(function() {  _this._send('end')  }, this._wait);
  }
});

// Kefir.fromBinder(fn)

function FromBinder(fn) {
  Stream.call(this);
  this._fn = new Fn(fn);
  this._unsubscribe = null;
}

inherit(FromBinder, Stream, {

  _name: 'fromBinder',

  _onActivation: function() {
    var _this = this;
    this._unsubscribe = Fn.call(this._fn, [
      function(type, x) {  _this._send(type, x)  }
    ]);
  },
  _onDeactivation: function() {
    if (isFn(this._unsubscribe)) {
      this._unsubscribe();
    }
    this._unsubscribe = null;
  },

  _clear: function() {
    Stream.prototype._clear.call(this);
    this._fn = null;
  }

})

Kefir.fromBinder = function(fn) {
  return new FromBinder(fn);
}






// Kefir.emitter()

function Emitter() {
  Stream.call(this);
}

inherit(Emitter, Stream, {
  _name: 'emitter',
  emit: function(x) {  this._send('value', x)  },
  end: function() {  this._send('end')  }
});

Kefir.emitter = function() {
  return new Emitter();
}







// Kefir.empty()

var emptyObj = new Stream();
emptyObj._send('end');
emptyObj._name = 'empty';
Kefir.empty = function() {  return emptyObj  }





// Kefir.constant(x)

function ConstantProperty(x) {
  Property.call(this);
  this._send('value', x);
  this._send('end');
}

inherit(ConstantProperty, Property, {
  _name: 'constant'
})

Kefir.constant = function(x) {
  return new ConstantProperty(x);
}


  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Kefir;
    });
    global.Kefir = Kefir;
  } else if (typeof module === "object" && typeof exports === "object") {
    module.exports = Kefir;
    Kefir.Kefir = Kefir;
  } else {
    global.Kefir = Kefir;
  }

}(this));
},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"JkpR2F":3,"inherits":2}],6:[function(require,module,exports){
/*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
/*global module, require, __dirname, document*/
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

var sinon = (function (formatio) {
    var div = typeof document != "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;

    function isDOMNode(obj) {
        var success = false;

        try {
            obj.appendChild(div);
            success = div.parentNode == obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }

        return success;
    }

    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }

    function isFunction(obj) {
        return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function isReallyNaN(val) {
        return typeof val === 'number' && isNaN(val);
    }

    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }

    function isRestorable (obj) {
        return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
    }

    var sinon = {
        wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }

            if (typeof method != "function") {
                throw new TypeError("Method wrapper should be function");
            }

            var wrappedMethod = object[property],
                error;

            if (!isFunction(wrappedMethod)) {
                error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                    property + " as function");
            } else if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
            } else if (wrappedMethod.calledBefore) {
                var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
                error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }

            if (error) {
                if (wrappedMethod && wrappedMethod._stack) {
                    error.stack += '\n--------------\n' + wrappedMethod._stack;
                }
                throw error;
            }

            // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
            // when using hasOwn.call on objects from other frames.
            var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;
            // Set up a stack trace which can be used later to find what line of
            // code the original method was created on.
            method._stack = (new Error('Stack Trace for original')).stack;

            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    delete object[property];
                }
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };

            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);

            return method;
        },

        extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }

                    // DONT ENUM bug, only care about toString
                    if (arguments[i].hasOwnProperty("toString") &&
                        arguments[i].toString != target.toString) {
                        target.toString = arguments[i].toString;
                    }
                }
            }

            return target;
        },

        create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        },

        deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }

            if (typeof a != 'object' || typeof b != 'object') {
                if (isReallyNaN(a) && isReallyNaN(b)) {
                    return true;
                } else {
                    return a === b;
                }
            }

            if (isElement(a) || isElement(b)) {
                return a === b;
            }

            if (a === b) {
                return true;
            }

            if ((a === null && b !== null) || (a !== null && b === null)) {
                return false;
            }

            if (a instanceof RegExp && b instanceof RegExp) {
              return (a.source === b.source) && (a.global === b.global) &&
                (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline);
            }

            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
                return false;
            }

            if (aString == "[object Date]") {
                return a.valueOf() === b.valueOf();
            }

            var prop, aLength = 0, bLength = 0;

            if (aString == "[object Array]" && a.length !== b.length) {
                return false;
            }

            for (prop in a) {
                aLength += 1;

                if (!(prop in b)) {
                    return false;
                }

                if (!deepEqual(a[prop], b[prop])) {
                    return false;
                }
            }

            for (prop in b) {
                bLength += 1;
            }

            return aLength == bLength;
        },

        functionName: function functionName(func) {
            var name = func.displayName || func.name;

            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }

            return name;
        },

        functionToString: function toString() {
            if (this.getCall && this.callCount) {
                var thisValue, prop, i = this.callCount;

                while (i--) {
                    thisValue = this.getCall(i).thisValue;

                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }

            return this.displayName || "sinon fake";
        },

        getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;

            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }

            return config;
        },

        format: function (val) {
            return "" + val;
        },

        defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        },

        timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
                count == 2 && "twice" ||
                count == 3 && "thrice" ||
                (count || 0) + " times";
        },

        calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
                    return false;
                }
            }

            return true;
        },

        orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;

                return aId < bId ? -1 : 1;
            });
        },

        log: function () {},

        logError: function (label, err) {
            var msg = label + " threw exception: ";
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }

            setTimeout(function () {
                err.message = msg + err.message;
                throw err;
            }, 0);
        },

        typeOf: function (value) {
            if (value === null) {
                return "null";
            }
            else if (value === undefined) {
                return "undefined";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        },

        createStubInstance: function (constructor) {
            if (typeof constructor !== "function") {
                throw new TypeError("The constructor should be a function.");
            }
            return sinon.stub(sinon.create(constructor.prototype));
        },

        restore: function (object) {
            if (object !== null && typeof object === "object") {
                for (var prop in object) {
                    if (isRestorable(object[prop])) {
                        object[prop].restore();
                    }
                }
            }
            else if (isRestorable(object)) {
                object.restore();
            }
        }
    };

    var isNode = typeof module !== "undefined" && module.exports && typeof require == "function";
    var isAMD = typeof define === 'function' && typeof define.amd === 'object' && define.amd;

    function makePublicAPI(require, exports, module) {
        module.exports = sinon;
        sinon.spy = require("./sinon/spy");
        sinon.spyCall = require("./sinon/call");
        sinon.behavior = require("./sinon/behavior");
        sinon.stub = require("./sinon/stub");
        sinon.mock = require("./sinon/mock");
        sinon.collection = require("./sinon/collection");
        sinon.assert = require("./sinon/assert");
        sinon.sandbox = require("./sinon/sandbox");
        sinon.test = require("./sinon/test");
        sinon.testCase = require("./sinon/test_case");
        sinon.match = require("./sinon/match");
    }

    if (isAMD) {
        define(makePublicAPI);
    } else if (isNode) {
        try {
            formatio = require("formatio");
        } catch (e) {}
        makePublicAPI(require, exports, module);
    }

    if (formatio) {
        var formatter = formatio.configure({ quoteStrings: false });
        sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
        };
    } else if (isNode) {
        try {
            var util = require("util");
            sinon.format = function (value) {
                return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
        } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
        }
    }

    return sinon;
}(typeof formatio == "object" && formatio));

},{"./sinon/assert":7,"./sinon/behavior":8,"./sinon/call":9,"./sinon/collection":10,"./sinon/match":11,"./sinon/mock":12,"./sinon/sandbox":13,"./sinon/spy":14,"./sinon/stub":15,"./sinon/test":16,"./sinon/test_case":17,"formatio":19,"util":5}],7:[function(require,module,exports){
(function (global){
/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Assertions matching the test spy retrieval interface.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon, global) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
    var slice = Array.prototype.slice;
    var assert;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function verifyIsStub() {
        var method;

        for (var i = 0, l = arguments.length; i < l; ++i) {
            method = arguments[i];

            if (!method) {
                assert.fail("fake is not a spy");
            }

            if (typeof method != "function") {
                assert.fail(method + " is not a function");
            }

            if (typeof method.getCall != "function") {
                assert.fail(method + " is not stubbed");
            }
        }
    }

    function failAssertion(object, msg) {
        object = object || global;
        var failMethod = object.fail || assert.fail;
        failMethod.call(object, msg);
    }

    function mirrorPropAsAssertion(name, method, message) {
        if (arguments.length == 2) {
            message = method;
            method = name;
        }

        assert[name] = function (fake) {
            verifyIsStub(fake);

            var args = slice.call(arguments, 1);
            var failed = false;

            if (typeof method == "function") {
                failed = !method(fake);
            } else {
                failed = typeof fake[method] == "function" ?
                    !fake[method].apply(fake, args) : !fake[method];
            }

            if (failed) {
                failAssertion(this, fake.printf.apply(fake, [message].concat(args)));
            } else {
                assert.pass(name);
            }
        };
    }

    function exposedName(prefix, prop) {
        return !prefix || /^fail/.test(prop) ? prop :
            prefix + prop.slice(0, 1).toUpperCase() + prop.slice(1);
    }

    assert = {
        failException: "AssertError",

        fail: function fail(message) {
            var error = new Error(message);
            error.name = this.failException || assert.failException;

            throw error;
        },

        pass: function pass(assertion) {},

        callOrder: function assertCallOrder() {
            verifyIsStub.apply(null, arguments);
            var expected = "", actual = "";

            if (!sinon.calledInOrder(arguments)) {
                try {
                    expected = [].join.call(arguments, ", ");
                    var calls = slice.call(arguments);
                    var i = calls.length;
                    while (i) {
                        if (!calls[--i].called) {
                            calls.splice(i, 1);
                        }
                    }
                    actual = sinon.orderByFirstCall(calls).join(", ");
                } catch (e) {
                    // If this fails, we'll just fall back to the blank string
                }

                failAssertion(this, "expected " + expected + " to be " +
                              "called in order but were called as " + actual);
            } else {
                assert.pass("callOrder");
            }
        },

        callCount: function assertCallCount(method, count) {
            verifyIsStub(method);

            if (method.callCount != count) {
                var msg = "expected %n to be called " + sinon.timesInWords(count) +
                    " but was called %c%C";
                failAssertion(this, method.printf(msg));
            } else {
                assert.pass("callCount");
            }
        },

        expose: function expose(target, options) {
            if (!target) {
                throw new TypeError("target is null or undefined");
            }

            var o = options || {};
            var prefix = typeof o.prefix == "undefined" && "assert" || o.prefix;
            var includeFail = typeof o.includeFail == "undefined" || !!o.includeFail;

            for (var method in this) {
                if (method != "export" && (includeFail || !/^(fail)/.test(method))) {
                    target[exposedName(prefix, method)] = this[method];
                }
            }

            return target;
        },

        match: function match(actual, expectation) {
            var matcher = sinon.match(expectation);
            if (matcher.test(actual)) {
                assert.pass("match");
            } else {
                var formatted = [
                    "expected value to match",
                    "    expected = " + sinon.format(expectation),
                    "    actual = " + sinon.format(actual)
                ]
                failAssertion(this, formatted.join("\n"));
            }
        }
    };

    mirrorPropAsAssertion("called", "expected %n to have been called at least once but was never called");
    mirrorPropAsAssertion("notCalled", function (spy) { return !spy.called; },
                          "expected %n to not have been called but was called %c%C");
    mirrorPropAsAssertion("calledOnce", "expected %n to be called once but was called %c%C");
    mirrorPropAsAssertion("calledTwice", "expected %n to be called twice but was called %c%C");
    mirrorPropAsAssertion("calledThrice", "expected %n to be called thrice but was called %c%C");
    mirrorPropAsAssertion("calledOn", "expected %n to be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("alwaysCalledOn", "expected %n to always be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("calledWithNew", "expected %n to be called with new");
    mirrorPropAsAssertion("alwaysCalledWithNew", "expected %n to always be called with new");
    mirrorPropAsAssertion("calledWith", "expected %n to be called with arguments %*%C");
    mirrorPropAsAssertion("calledWithMatch", "expected %n to be called with match %*%C");
    mirrorPropAsAssertion("alwaysCalledWith", "expected %n to always be called with arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithMatch", "expected %n to always be called with match %*%C");
    mirrorPropAsAssertion("calledWithExactly", "expected %n to be called with exact arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithExactly", "expected %n to always be called with exact arguments %*%C");
    mirrorPropAsAssertion("neverCalledWith", "expected %n to never be called with arguments %*%C");
    mirrorPropAsAssertion("neverCalledWithMatch", "expected %n to never be called with match %*%C");
    mirrorPropAsAssertion("threw", "%n did not throw exception%C");
    mirrorPropAsAssertion("alwaysThrew", "%n did not always throw exception%C");

    sinon.assert = assert;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = assert; });
    } else if (commonJSModule) {
        module.exports = assert;
    }
}(typeof sinon == "object" && sinon || null, typeof window != "undefined" ? window : (typeof self != "undefined") ? self : global));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../sinon":6}],8:[function(require,module,exports){
(function (process){
/**
 * @depend ../sinon.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon, process, setImmediate, setTimeout*/
/**
 * Stub behavior
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Tim Fischbach (mail@timfischbach.de)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    var slice = Array.prototype.slice;
    var join = Array.prototype.join;
    var proto;

    var nextTick = (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
        } else if (typeof setImmediate === "function") {
            return setImmediate;
        } else {
            return function (callback) {
                setTimeout(callback, 0);
            };
        }
    })();

    function throwsException(error, message) {
        if (typeof error == "string") {
            this.exception = new Error(message || "");
            this.exception.name = error;
        } else if (!error) {
            this.exception = new Error("Error");
        } else {
            this.exception = error;
        }

        return this;
    }

    function getCallback(behavior, args) {
        var callArgAt = behavior.callArgAt;

        if (callArgAt < 0) {
            var callArgProp = behavior.callArgProp;

            for (var i = 0, l = args.length; i < l; ++i) {
                if (!callArgProp && typeof args[i] == "function") {
                    return args[i];
                }

                if (callArgProp && args[i] &&
                    typeof args[i][callArgProp] == "function") {
                    return args[i][callArgProp];
                }
            }

            return null;
        }

        return args[callArgAt];
    }

    function getCallbackError(behavior, func, args) {
        if (behavior.callArgAt < 0) {
            var msg;

            if (behavior.callArgProp) {
                msg = sinon.functionName(behavior.stub) +
                    " expected to yield to '" + behavior.callArgProp +
                    "', but no object with such a property was passed.";
            } else {
                msg = sinon.functionName(behavior.stub) +
                    " expected to yield, but no callback was passed.";
            }

            if (args.length > 0) {
                msg += " Received [" + join.call(args, ", ") + "]";
            }

            return msg;
        }

        return "argument at index " + behavior.callArgAt + " is not a function: " + func;
    }

    function callCallback(behavior, args) {
        if (typeof behavior.callArgAt == "number") {
            var func = getCallback(behavior, args);

            if (typeof func != "function") {
                throw new TypeError(getCallbackError(behavior, func, args));
            }

            if (behavior.callbackAsync) {
                nextTick(function() {
                    func.apply(behavior.callbackContext, behavior.callbackArguments);
                });
            } else {
                func.apply(behavior.callbackContext, behavior.callbackArguments);
            }
        }
    }

    proto = {
        create: function(stub) {
            var behavior = sinon.extend({}, sinon.behavior);
            delete behavior.create;
            behavior.stub = stub;

            return behavior;
        },

        isPresent: function() {
            return (typeof this.callArgAt == 'number' ||
                    this.exception ||
                    typeof this.returnArgAt == 'number' ||
                    this.returnThis ||
                    this.returnValueDefined);
        },

        invoke: function(context, args) {
            callCallback(this, args);

            if (this.exception) {
                throw this.exception;
            } else if (typeof this.returnArgAt == 'number') {
                return args[this.returnArgAt];
            } else if (this.returnThis) {
                return context;
            }

            return this.returnValue;
        },

        onCall: function(index) {
            return this.stub.onCall(index);
        },

        onFirstCall: function() {
            return this.stub.onFirstCall();
        },

        onSecondCall: function() {
            return this.stub.onSecondCall();
        },

        onThirdCall: function() {
            return this.stub.onThirdCall();
        },

        withArgs: function(/* arguments */) {
            throw new Error('Defining a stub by invoking "stub.onCall(...).withArgs(...)" is not supported. ' +
                            'Use "stub.withArgs(...).onCall(...)" to define sequential behavior for calls with certain arguments.');
        },

        callsArg: function callsArg(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.callArgAt = pos;
            this.callbackArguments = [];
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgOn: function callsArgOn(pos, context) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = pos;
            this.callbackArguments = [];
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgWith: function callsArgWith(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.callArgAt = pos;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgOnWith: function callsArgWith(pos, context) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = pos;
            this.callbackArguments = slice.call(arguments, 2);
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yields: function () {
            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 0);
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yieldsOn: function (context) {
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yieldsTo: function (prop) {
            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = undefined;
            this.callArgProp = prop;
            this.callbackAsync = false;

            return this;
        },

        yieldsToOn: function (prop, context) {
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 2);
            this.callbackContext = context;
            this.callArgProp = prop;
            this.callbackAsync = false;

            return this;
        },


        "throws": throwsException,
        throwsException: throwsException,

        returns: function returns(value) {
            this.returnValue = value;
            this.returnValueDefined = true;

            return this;
        },

        returnsArg: function returnsArg(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.returnArgAt = pos;

            return this;
        },

        returnsThis: function returnsThis() {
            this.returnThis = true;

            return this;
        }
    };

    // create asynchronous versions of callsArg* and yields* methods
    for (var method in proto) {
        // need to avoid creating anotherasync versions of the newly added async methods
        if (proto.hasOwnProperty(method) &&
            method.match(/^(callsArg|yields)/) &&
            !method.match(/Async/)) {
            proto[method + 'Async'] = (function (syncFnName) {
                return function () {
                    var result = this[syncFnName].apply(this, arguments);
                    this.callbackAsync = true;
                    return result;
                };
            })(method);
        }
    }

    sinon.behavior = proto;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = proto; });
    } else if (commonJSModule) {
        module.exports = proto;
    }
}(typeof sinon == "object" && sinon || null));

}).call(this,require("JkpR2F"))
},{"../sinon":6,"JkpR2F":3}],9:[function(require,module,exports){
/**
  * @depend ../sinon.js
  * @depend match.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy calls
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @author Maximilian Antoni (mail@maxantoni.de)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  * Copyright (c) 2013 Maximilian Antoni
  */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function throwYieldError(proxy, text, args) {
        var msg = sinon.functionName(proxy) + text;
        if (args.length) {
            msg += " Received [" + slice.call(args).join(", ") + "]";
        }
        throw new Error(msg);
    }

    var slice = Array.prototype.slice;

    var callProto = {
        calledOn: function calledOn(thisValue) {
            if (sinon.match && sinon.match.isMatcher(thisValue)) {
                return thisValue.test(this.thisValue);
            }
            return this.thisValue === thisValue;
        },

        calledWith: function calledWith() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
                if (!sinon.deepEqual(arguments[i], this.args[i])) {
                    return false;
                }
            }

            return true;
        },

        calledWithMatch: function calledWithMatch() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
                var actual = this.args[i];
                var expectation = arguments[i];
                if (!sinon.match || !sinon.match(expectation).test(actual)) {
                    return false;
                }
            }
            return true;
        },

        calledWithExactly: function calledWithExactly() {
            return arguments.length == this.args.length &&
                this.calledWith.apply(this, arguments);
        },

        notCalledWith: function notCalledWith() {
            return !this.calledWith.apply(this, arguments);
        },

        notCalledWithMatch: function notCalledWithMatch() {
            return !this.calledWithMatch.apply(this, arguments);
        },

        returned: function returned(value) {
            return sinon.deepEqual(value, this.returnValue);
        },

        threw: function threw(error) {
            if (typeof error === "undefined" || !this.exception) {
                return !!this.exception;
            }

            return this.exception === error || this.exception.name === error;
        },

        calledWithNew: function calledWithNew() {
            return this.proxy.prototype && this.thisValue instanceof this.proxy;
        },

        calledBefore: function (other) {
            return this.callId < other.callId;
        },

        calledAfter: function (other) {
            return this.callId > other.callId;
        },

        callArg: function (pos) {
            this.args[pos]();
        },

        callArgOn: function (pos, thisValue) {
            this.args[pos].apply(thisValue);
        },

        callArgWith: function (pos) {
            this.callArgOnWith.apply(this, [pos, null].concat(slice.call(arguments, 1)));
        },

        callArgOnWith: function (pos, thisValue) {
            var args = slice.call(arguments, 2);
            this.args[pos].apply(thisValue, args);
        },

        "yield": function () {
            this.yieldOn.apply(this, [null].concat(slice.call(arguments, 0)));
        },

        yieldOn: function (thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
                if (typeof args[i] === "function") {
                    args[i].apply(thisValue, slice.call(arguments, 1));
                    return;
                }
            }
            throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
        },

        yieldTo: function (prop) {
            this.yieldToOn.apply(this, [prop, null].concat(slice.call(arguments, 1)));
        },

        yieldToOn: function (prop, thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
                if (args[i] && typeof args[i][prop] === "function") {
                    args[i][prop].apply(thisValue, slice.call(arguments, 2));
                    return;
                }
            }
            throwYieldError(this.proxy, " cannot yield to '" + prop +
                "' since no callback was passed.", args);
        },

        toString: function () {
            var callStr = this.proxy.toString() + "(";
            var args = [];

            for (var i = 0, l = this.args.length; i < l; ++i) {
                args.push(sinon.format(this.args[i]));
            }

            callStr = callStr + args.join(", ") + ")";

            if (typeof this.returnValue != "undefined") {
                callStr += " => " + sinon.format(this.returnValue);
            }

            if (this.exception) {
                callStr += " !" + this.exception.name;

                if (this.exception.message) {
                    callStr += "(" + this.exception.message + ")";
                }
            }

            return callStr;
        }
    };

    callProto.invokeCallback = callProto.yield;

    function createSpyCall(spy, thisValue, args, returnValue, exception, id) {
        if (typeof id !== "number") {
            throw new TypeError("Call id is not a number");
        }
        var proxyCall = sinon.create(callProto);
        proxyCall.proxy = spy;
        proxyCall.thisValue = thisValue;
        proxyCall.args = args;
        proxyCall.returnValue = returnValue;
        proxyCall.exception = exception;
        proxyCall.callId = id;

        return proxyCall;
    }
    createSpyCall.toString = callProto.toString; // used by mocks

    sinon.spyCall = createSpyCall;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = createSpyCall; });
    } else if (commonJSModule) {
        module.exports = createSpyCall;
    }
}(typeof sinon == "object" && sinon || null));


},{"../sinon":6}],10:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true*/
/*global module, require, sinon*/
/**
 * Collections of stubs, spies and mocks.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
    var push = [].push;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function getFakes(fakeCollection) {
        if (!fakeCollection.fakes) {
            fakeCollection.fakes = [];
        }

        return fakeCollection.fakes;
    }

    function each(fakeCollection, method) {
        var fakes = getFakes(fakeCollection);

        for (var i = 0, l = fakes.length; i < l; i += 1) {
            if (typeof fakes[i][method] == "function") {
                fakes[i][method]();
            }
        }
    }

    function compact(fakeCollection) {
        var fakes = getFakes(fakeCollection);
        var i = 0;
        while (i < fakes.length) {
          fakes.splice(i, 1);
        }
    }

    var collection = {
        verify: function resolve() {
            each(this, "verify");
        },

        restore: function restore() {
            each(this, "restore");
            compact(this);
        },

        verifyAndRestore: function verifyAndRestore() {
            var exception;

            try {
                this.verify();
            } catch (e) {
                exception = e;
            }

            this.restore();

            if (exception) {
                throw exception;
            }
        },

        add: function add(fake) {
            push.call(getFakes(this), fake);
            return fake;
        },

        spy: function spy() {
            return this.add(sinon.spy.apply(sinon, arguments));
        },

        stub: function stub(object, property, value) {
            if (property) {
                var original = object[property];

                if (typeof original != "function") {
                    if (!hasOwnProperty.call(object, property)) {
                        throw new TypeError("Cannot stub non-existent own property " + property);
                    }

                    object[property] = value;

                    return this.add({
                        restore: function () {
                            object[property] = original;
                        }
                    });
                }
            }
            if (!property && !!object && typeof object == "object") {
                var stubbedObj = sinon.stub.apply(sinon, arguments);

                for (var prop in stubbedObj) {
                    if (typeof stubbedObj[prop] === "function") {
                        this.add(stubbedObj[prop]);
                    }
                }

                return stubbedObj;
            }

            return this.add(sinon.stub.apply(sinon, arguments));
        },

        mock: function mock() {
            return this.add(sinon.mock.apply(sinon, arguments));
        },

        inject: function inject(obj) {
            var col = this;

            obj.spy = function () {
                return col.spy.apply(col, arguments);
            };

            obj.stub = function () {
                return col.stub.apply(col, arguments);
            };

            obj.mock = function () {
                return col.mock.apply(col, arguments);
            };

            return obj;
        }
    };

    sinon.collection = collection;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = collection; });
    } else if (commonJSModule) {
        module.exports = collection;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6}],11:[function(require,module,exports){
/* @depend ../sinon.js */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Match functions
 *
 * @author Maximilian Antoni (mail@maxantoni.de)
 * @license BSD
 *
 * Copyright (c) 2012 Maximilian Antoni
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function assertType(value, type, name) {
        var actual = sinon.typeOf(value);
        if (actual !== type) {
            throw new TypeError("Expected type of " + name + " to be " +
                type + ", but was " + actual);
        }
    }

    var matcher = {
        toString: function () {
            return this.message;
        }
    };

    function isMatcher(object) {
        return matcher.isPrototypeOf(object);
    }

    function matchObject(expectation, actual) {
        if (actual === null || actual === undefined) {
            return false;
        }
        for (var key in expectation) {
            if (expectation.hasOwnProperty(key)) {
                var exp = expectation[key];
                var act = actual[key];
                if (match.isMatcher(exp)) {
                    if (!exp.test(act)) {
                        return false;
                    }
                } else if (sinon.typeOf(exp) === "object") {
                    if (!matchObject(exp, act)) {
                        return false;
                    }
                } else if (!sinon.deepEqual(exp, act)) {
                    return false;
                }
            }
        }
        return true;
    }

    matcher.or = function (m2) {
        if (!arguments.length) {
            throw new TypeError("Matcher expected");
        } else if (!isMatcher(m2)) {
            m2 = match(m2);
        }
        var m1 = this;
        var or = sinon.create(matcher);
        or.test = function (actual) {
            return m1.test(actual) || m2.test(actual);
        };
        or.message = m1.message + ".or(" + m2.message + ")";
        return or;
    };

    matcher.and = function (m2) {
        if (!arguments.length) {
            throw new TypeError("Matcher expected");
        } else if (!isMatcher(m2)) {
            m2 = match(m2);
        }
        var m1 = this;
        var and = sinon.create(matcher);
        and.test = function (actual) {
            return m1.test(actual) && m2.test(actual);
        };
        and.message = m1.message + ".and(" + m2.message + ")";
        return and;
    };

    var match = function (expectation, message) {
        var m = sinon.create(matcher);
        var type = sinon.typeOf(expectation);
        switch (type) {
        case "object":
            if (typeof expectation.test === "function") {
                m.test = function (actual) {
                    return expectation.test(actual) === true;
                };
                m.message = "match(" + sinon.functionName(expectation.test) + ")";
                return m;
            }
            var str = [];
            for (var key in expectation) {
                if (expectation.hasOwnProperty(key)) {
                    str.push(key + ": " + expectation[key]);
                }
            }
            m.test = function (actual) {
                return matchObject(expectation, actual);
            };
            m.message = "match(" + str.join(", ") + ")";
            break;
        case "number":
            m.test = function (actual) {
                return expectation == actual;
            };
            break;
        case "string":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return actual.indexOf(expectation) !== -1;
            };
            m.message = "match(\"" + expectation + "\")";
            break;
        case "regexp":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return expectation.test(actual);
            };
            break;
        case "function":
            m.test = expectation;
            if (message) {
                m.message = message;
            } else {
                m.message = "match(" + sinon.functionName(expectation) + ")";
            }
            break;
        default:
            m.test = function (actual) {
              return sinon.deepEqual(expectation, actual);
            };
        }
        if (!m.message) {
            m.message = "match(" + expectation + ")";
        }
        return m;
    };

    match.isMatcher = isMatcher;

    match.any = match(function () {
        return true;
    }, "any");

    match.defined = match(function (actual) {
        return actual !== null && actual !== undefined;
    }, "defined");

    match.truthy = match(function (actual) {
        return !!actual;
    }, "truthy");

    match.falsy = match(function (actual) {
        return !actual;
    }, "falsy");

    match.same = function (expectation) {
        return match(function (actual) {
            return expectation === actual;
        }, "same(" + expectation + ")");
    };

    match.typeOf = function (type) {
        assertType(type, "string", "type");
        return match(function (actual) {
            return sinon.typeOf(actual) === type;
        }, "typeOf(\"" + type + "\")");
    };

    match.instanceOf = function (type) {
        assertType(type, "function", "type");
        return match(function (actual) {
            return actual instanceof type;
        }, "instanceOf(" + sinon.functionName(type) + ")");
    };

    function createPropertyMatcher(propertyTest, messagePrefix) {
        return function (property, value) {
            assertType(property, "string", "property");
            var onlyProperty = arguments.length === 1;
            var message = messagePrefix + "(\"" + property + "\"";
            if (!onlyProperty) {
                message += ", " + value;
            }
            message += ")";
            return match(function (actual) {
                if (actual === undefined || actual === null ||
                        !propertyTest(actual, property)) {
                    return false;
                }
                return onlyProperty || sinon.deepEqual(value, actual[property]);
            }, message);
        };
    }

    match.has = createPropertyMatcher(function (actual, property) {
        if (typeof actual === "object") {
            return property in actual;
        }
        return actual[property] !== undefined;
    }, "has");

    match.hasOwn = createPropertyMatcher(function (actual, property) {
        return actual.hasOwnProperty(property);
    }, "hasOwn");

    match.bool = match.typeOf("boolean");
    match.number = match.typeOf("number");
    match.string = match.typeOf("string");
    match.object = match.typeOf("object");
    match.func = match.typeOf("function");
    match.array = match.typeOf("array");
    match.regexp = match.typeOf("regexp");
    match.date = match.typeOf("date");

    sinon.match = match;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = match; });
    } else if (commonJSModule) {
        module.exports = match;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6}],12:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false*/
/*global module, require, sinon*/
/**
 * Mock functions.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
    var push = [].push;
    var match;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    match = sinon.match;

    if (!match && commonJSModule) {
        match = require("./match");
    }

    function mock(object) {
        if (!object) {
            return sinon.expectation.create("Anonymous mock");
        }

        return mock.create(object);
    }

    sinon.mock = mock;

    sinon.extend(mock, (function () {
        function each(collection, callback) {
            if (!collection) {
                return;
            }

            for (var i = 0, l = collection.length; i < l; i += 1) {
                callback(collection[i]);
            }
        }

        return {
            create: function create(object) {
                if (!object) {
                    throw new TypeError("object is null");
                }

                var mockObject = sinon.extend({}, mock);
                mockObject.object = object;
                delete mockObject.create;

                return mockObject;
            },

            expects: function expects(method) {
                if (!method) {
                    throw new TypeError("method is falsy");
                }

                if (!this.expectations) {
                    this.expectations = {};
                    this.proxies = [];
                }

                if (!this.expectations[method]) {
                    this.expectations[method] = [];
                    var mockObject = this;

                    sinon.wrapMethod(this.object, method, function () {
                        return mockObject.invokeMethod(method, this, arguments);
                    });

                    push.call(this.proxies, method);
                }

                var expectation = sinon.expectation.create(method);
                push.call(this.expectations[method], expectation);

                return expectation;
            },

            restore: function restore() {
                var object = this.object;

                each(this.proxies, function (proxy) {
                    if (typeof object[proxy].restore == "function") {
                        object[proxy].restore();
                    }
                });
            },

            verify: function verify() {
                var expectations = this.expectations || {};
                var messages = [], met = [];

                each(this.proxies, function (proxy) {
                    each(expectations[proxy], function (expectation) {
                        if (!expectation.met()) {
                            push.call(messages, expectation.toString());
                        } else {
                            push.call(met, expectation.toString());
                        }
                    });
                });

                this.restore();

                if (messages.length > 0) {
                    sinon.expectation.fail(messages.concat(met).join("\n"));
                } else {
                    sinon.expectation.pass(messages.concat(met).join("\n"));
                }

                return true;
            },

            invokeMethod: function invokeMethod(method, thisValue, args) {
                var expectations = this.expectations && this.expectations[method];
                var length = expectations && expectations.length || 0, i;

                for (i = 0; i < length; i += 1) {
                    if (!expectations[i].met() &&
                        expectations[i].allowsCall(thisValue, args)) {
                        return expectations[i].apply(thisValue, args);
                    }
                }

                var messages = [], available, exhausted = 0;

                for (i = 0; i < length; i += 1) {
                    if (expectations[i].allowsCall(thisValue, args)) {
                        available = available || expectations[i];
                    } else {
                        exhausted += 1;
                    }
                    push.call(messages, "    " + expectations[i].toString());
                }

                if (exhausted === 0) {
                    return available.apply(thisValue, args);
                }

                messages.unshift("Unexpected call: " + sinon.spyCall.toString.call({
                    proxy: method,
                    args: args
                }));

                sinon.expectation.fail(messages.join("\n"));
            }
        };
    }()));

    var times = sinon.timesInWords;

    sinon.expectation = (function () {
        var slice = Array.prototype.slice;
        var _invoke = sinon.spy.invoke;

        function callCountInWords(callCount) {
            if (callCount == 0) {
                return "never called";
            } else {
                return "called " + times(callCount);
            }
        }

        function expectedCallCountInWords(expectation) {
            var min = expectation.minCalls;
            var max = expectation.maxCalls;

            if (typeof min == "number" && typeof max == "number") {
                var str = times(min);

                if (min != max) {
                    str = "at least " + str + " and at most " + times(max);
                }

                return str;
            }

            if (typeof min == "number") {
                return "at least " + times(min);
            }

            return "at most " + times(max);
        }

        function receivedMinCalls(expectation) {
            var hasMinLimit = typeof expectation.minCalls == "number";
            return !hasMinLimit || expectation.callCount >= expectation.minCalls;
        }

        function receivedMaxCalls(expectation) {
            if (typeof expectation.maxCalls != "number") {
                return false;
            }

            return expectation.callCount == expectation.maxCalls;
        }

        function verifyMatcher(possibleMatcher, arg){
            if (match && match.isMatcher(possibleMatcher)) {
                return possibleMatcher.test(arg);
            } else {
                return true;
            }
        }

        return {
            minCalls: 1,
            maxCalls: 1,

            create: function create(methodName) {
                var expectation = sinon.extend(sinon.stub.create(), sinon.expectation);
                delete expectation.create;
                expectation.method = methodName;

                return expectation;
            },

            invoke: function invoke(func, thisValue, args) {
                this.verifyCallAllowed(thisValue, args);

                return _invoke.apply(this, arguments);
            },

            atLeast: function atLeast(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.maxCalls = null;
                    this.limitsSet = true;
                }

                this.minCalls = num;

                return this;
            },

            atMost: function atMost(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.minCalls = null;
                    this.limitsSet = true;
                }

                this.maxCalls = num;

                return this;
            },

            never: function never() {
                return this.exactly(0);
            },

            once: function once() {
                return this.exactly(1);
            },

            twice: function twice() {
                return this.exactly(2);
            },

            thrice: function thrice() {
                return this.exactly(3);
            },

            exactly: function exactly(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not a number");
                }

                this.atLeast(num);
                return this.atMost(num);
            },

            met: function met() {
                return !this.failed && receivedMinCalls(this);
            },

            verifyCallAllowed: function verifyCallAllowed(thisValue, args) {
                if (receivedMaxCalls(this)) {
                    this.failed = true;
                    sinon.expectation.fail(this.method + " already called " + times(this.maxCalls));
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    sinon.expectation.fail(this.method + " called with " + thisValue + " as thisValue, expected " +
                        this.expectedThis);
                }

                if (!("expectedArguments" in this)) {
                    return;
                }

                if (!args) {
                    sinon.expectation.fail(this.method + " received no arguments, expected " +
                        sinon.format(this.expectedArguments));
                }

                if (args.length < this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too few arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too many arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {

                    if (!verifyMatcher(this.expectedArguments[i],args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", didn't match " + this.expectedArguments.toString());
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", expected " + sinon.format(this.expectedArguments));
                    }
                }
            },

            allowsCall: function allowsCall(thisValue, args) {
                if (this.met() && receivedMaxCalls(this)) {
                    return false;
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    return false;
                }

                if (!("expectedArguments" in this)) {
                    return true;
                }

                args = args || [];

                if (args.length < this.expectedArguments.length) {
                    return false;
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    return false;
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!verifyMatcher(this.expectedArguments[i],args[i])) {
                        return false;
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        return false;
                    }
                }

                return true;
            },

            withArgs: function withArgs() {
                this.expectedArguments = slice.call(arguments);
                return this;
            },

            withExactArgs: function withExactArgs() {
                this.withArgs.apply(this, arguments);
                this.expectsExactArgCount = true;
                return this;
            },

            on: function on(thisValue) {
                this.expectedThis = thisValue;
                return this;
            },

            toString: function () {
                var args = (this.expectedArguments || []).slice();

                if (!this.expectsExactArgCount) {
                    push.call(args, "[...]");
                }

                var callStr = sinon.spyCall.toString.call({
                    proxy: this.method || "anonymous mock expectation",
                    args: args
                });

                var message = callStr.replace(", [...", "[, ...") + " " +
                    expectedCallCountInWords(this);

                if (this.met()) {
                    return "Expectation met: " + message;
                }

                return "Expected " + message + " (" +
                    callCountInWords(this.callCount) + ")";
            },

            verify: function verify() {
                if (!this.met()) {
                    sinon.expectation.fail(this.toString());
                } else {
                    sinon.expectation.pass(this.toString());
                }

                return true;
            },

            pass: function(message) {
              sinon.assert.pass(message);
            },
            fail: function (message) {
                var exception = new Error(message);
                exception.name = "ExpectationError";

                throw exception;
            }
        };
    }());

    sinon.mock = mock;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = mock; });
    } else if (commonJSModule) {
        module.exports = mock;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6,"./match":11}],13:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend collection.js
 * @depend util/fake_timers.js
 * @depend util/fake_server_with_clock.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global require, module*/
/**
 * Manages fake collections as well as fake utilities such as Sinon's
 * timers and fake XHR implementation in one convenient object.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

if (typeof module !== "undefined" && module.exports && typeof require == "function") {
    var sinon = require("../sinon");
    sinon.extend(sinon, require("./util/fake_timers"));
}

(function () {
    var push = [].push;

    function exposeValue(sandbox, config, key, value) {
        if (!value) {
            return;
        }

        if (config.injectInto && !(key in config.injectInto)) {
            config.injectInto[key] = value;
            sandbox.injectedKeys.push(key);
        } else {
            push.call(sandbox.args, value);
        }
    }

    function prepareSandboxFromConfig(config) {
        var sandbox = sinon.create(sinon.sandbox);

        if (config.useFakeServer) {
            if (typeof config.useFakeServer == "object") {
                sandbox.serverPrototype = config.useFakeServer;
            }

            sandbox.useFakeServer();
        }

        if (config.useFakeTimers) {
            if (typeof config.useFakeTimers == "object") {
                sandbox.useFakeTimers.apply(sandbox, config.useFakeTimers);
            } else {
                sandbox.useFakeTimers();
            }
        }

        return sandbox;
    }

    sinon.sandbox = sinon.extend(sinon.create(sinon.collection), {
        useFakeTimers: function useFakeTimers() {
            this.clock = sinon.useFakeTimers.apply(sinon, arguments);

            return this.add(this.clock);
        },

        serverPrototype: sinon.fakeServer,

        useFakeServer: function useFakeServer() {
            var proto = this.serverPrototype || sinon.fakeServer;

            if (!proto || !proto.create) {
                return null;
            }

            this.server = proto.create();
            return this.add(this.server);
        },

        inject: function (obj) {
            sinon.collection.inject.call(this, obj);

            if (this.clock) {
                obj.clock = this.clock;
            }

            if (this.server) {
                obj.server = this.server;
                obj.requests = this.server.requests;
            }

            return obj;
        },

        restore: function () {
            sinon.collection.restore.apply(this, arguments);
            this.restoreContext();
        },

        restoreContext: function () {
            if (this.injectedKeys) {
                for (var i = 0, j = this.injectedKeys.length; i < j; i++) {
                    delete this.injectInto[this.injectedKeys[i]];
                }
                this.injectedKeys = [];
            }
        },

        create: function (config) {
            if (!config) {
                return sinon.create(sinon.sandbox);
            }

            var sandbox = prepareSandboxFromConfig(config);
            sandbox.args = sandbox.args || [];
            sandbox.injectedKeys = [];
            sandbox.injectInto = config.injectInto;
            var prop, value, exposed = sandbox.inject({});

            if (config.properties) {
                for (var i = 0, l = config.properties.length; i < l; i++) {
                    prop = config.properties[i];
                    value = exposed[prop] || prop == "sandbox" && sandbox;
                    exposeValue(sandbox, config, prop, value);
                }
            } else {
                exposeValue(sandbox, config, "sandbox", value);
            }

            return sandbox;
        }
    });

    sinon.sandbox.useFakeXMLHttpRequest = sinon.sandbox.useFakeServer;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = sinon.sandbox; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = sinon.sandbox;
    }
}());

},{"../sinon":6,"./util/fake_timers":18}],14:[function(require,module,exports){
/**
  * @depend ../sinon.js
  * @depend call.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy functions
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
    var push = Array.prototype.push;
    var slice = Array.prototype.slice;
    var callId = 0;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function spy(object, property) {
        if (!property && typeof object == "function") {
            return spy.create(object);
        }

        if (!object && !property) {
            return spy.create(function () { });
        }

        var method = object[property];
        return sinon.wrapMethod(object, property, spy.create(method));
    }

    function matchingFake(fakes, args, strict) {
        if (!fakes) {
            return;
        }

        for (var i = 0, l = fakes.length; i < l; i++) {
            if (fakes[i].matches(args, strict)) {
                return fakes[i];
            }
        }
    }

    function incrementCallCount() {
        this.called = true;
        this.callCount += 1;
        this.notCalled = false;
        this.calledOnce = this.callCount == 1;
        this.calledTwice = this.callCount == 2;
        this.calledThrice = this.callCount == 3;
    }

    function createCallProperties() {
        this.firstCall = this.getCall(0);
        this.secondCall = this.getCall(1);
        this.thirdCall = this.getCall(2);
        this.lastCall = this.getCall(this.callCount - 1);
    }

    var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
    function createProxy(func) {
        // Retain the function length:
        var p;
        if (func.length) {
            eval("p = (function proxy(" + vars.substring(0, func.length * 2 - 1) +
                ") { return p.invoke(func, this, slice.call(arguments)); });");
        }
        else {
            p = function proxy() {
                return p.invoke(func, this, slice.call(arguments));
            };
        }
        return p;
    }

    var uuid = 0;

    // Public API
    var spyApi = {
        reset: function () {
            this.called = false;
            this.notCalled = true;
            this.calledOnce = false;
            this.calledTwice = false;
            this.calledThrice = false;
            this.callCount = 0;
            this.firstCall = null;
            this.secondCall = null;
            this.thirdCall = null;
            this.lastCall = null;
            this.args = [];
            this.returnValues = [];
            this.thisValues = [];
            this.exceptions = [];
            this.callIds = [];
            if (this.fakes) {
                for (var i = 0; i < this.fakes.length; i++) {
                    this.fakes[i].reset();
                }
            }
        },

        create: function create(func) {
            var name;

            if (typeof func != "function") {
                func = function () { };
            } else {
                name = sinon.functionName(func);
            }

            var proxy = createProxy(func);

            sinon.extend(proxy, spy);
            delete proxy.create;
            sinon.extend(proxy, func);

            proxy.reset();
            proxy.prototype = func.prototype;
            proxy.displayName = name || "spy";
            proxy.toString = sinon.functionToString;
            proxy._create = sinon.spy.create;
            proxy.id = "spy#" + uuid++;

            return proxy;
        },

        invoke: function invoke(func, thisValue, args) {
            var matching = matchingFake(this.fakes, args);
            var exception, returnValue;

            incrementCallCount.call(this);
            push.call(this.thisValues, thisValue);
            push.call(this.args, args);
            push.call(this.callIds, callId++);

            // Make call properties available from within the spied function:
            createCallProperties.call(this);

            try {
                if (matching) {
                    returnValue = matching.invoke(func, thisValue, args);
                } else {
                    returnValue = (this.func || func).apply(thisValue, args);
                }

                var thisCall = this.getCall(this.callCount - 1);
                if (thisCall.calledWithNew() && typeof returnValue !== 'object') {
                    returnValue = thisValue;
                }
            } catch (e) {
                exception = e;
            }

            push.call(this.exceptions, exception);
            push.call(this.returnValues, returnValue);

            // Make return value and exception available in the calls:
            createCallProperties.call(this);

            if (exception !== undefined) {
                throw exception;
            }

            return returnValue;
        },

        named: function named(name) {
            this.displayName = name;
            return this;
        },

        getCall: function getCall(i) {
            if (i < 0 || i >= this.callCount) {
                return null;
            }

            return sinon.spyCall(this, this.thisValues[i], this.args[i],
                                    this.returnValues[i], this.exceptions[i],
                                    this.callIds[i]);
        },

        getCalls: function () {
            var calls = [];
            var i;

            for (i = 0; i < this.callCount; i++) {
                calls.push(this.getCall(i));
            }

            return calls;
        },

        calledBefore: function calledBefore(spyFn) {
            if (!this.called) {
                return false;
            }

            if (!spyFn.called) {
                return true;
            }

            return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
        },

        calledAfter: function calledAfter(spyFn) {
            if (!this.called || !spyFn.called) {
                return false;
            }

            return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
        },

        withArgs: function () {
            var args = slice.call(arguments);

            if (this.fakes) {
                var match = matchingFake(this.fakes, args, true);

                if (match) {
                    return match;
                }
            } else {
                this.fakes = [];
            }

            var original = this;
            var fake = this._create();
            fake.matchingAguments = args;
            fake.parent = this;
            push.call(this.fakes, fake);

            fake.withArgs = function () {
                return original.withArgs.apply(original, arguments);
            };

            for (var i = 0; i < this.args.length; i++) {
                if (fake.matches(this.args[i])) {
                    incrementCallCount.call(fake);
                    push.call(fake.thisValues, this.thisValues[i]);
                    push.call(fake.args, this.args[i]);
                    push.call(fake.returnValues, this.returnValues[i]);
                    push.call(fake.exceptions, this.exceptions[i]);
                    push.call(fake.callIds, this.callIds[i]);
                }
            }
            createCallProperties.call(fake);

            return fake;
        },

        matches: function (args, strict) {
            var margs = this.matchingAguments;

            if (margs.length <= args.length &&
                sinon.deepEqual(margs, args.slice(0, margs.length))) {
                return !strict || margs.length == args.length;
            }
        },

        printf: function (format) {
            var spy = this;
            var args = slice.call(arguments, 1);
            var formatter;

            return (format || "").replace(/%(.)/g, function (match, specifyer) {
                formatter = spyApi.formatters[specifyer];

                if (typeof formatter == "function") {
                    return formatter.call(null, spy, args);
                } else if (!isNaN(parseInt(specifyer, 10))) {
                    return sinon.format(args[specifyer - 1]);
                }

                return "%" + specifyer;
            });
        }
    };

    function delegateToCalls(method, matchAny, actual, notCalled) {
        spyApi[method] = function () {
            if (!this.called) {
                if (notCalled) {
                    return notCalled.apply(this, arguments);
                }
                return false;
            }

            var currentCall;
            var matches = 0;

            for (var i = 0, l = this.callCount; i < l; i += 1) {
                currentCall = this.getCall(i);

                if (currentCall[actual || method].apply(currentCall, arguments)) {
                    matches += 1;

                    if (matchAny) {
                        return true;
                    }
                }
            }

            return matches === this.callCount;
        };
    }

    delegateToCalls("calledOn", true);
    delegateToCalls("alwaysCalledOn", false, "calledOn");
    delegateToCalls("calledWith", true);
    delegateToCalls("calledWithMatch", true);
    delegateToCalls("alwaysCalledWith", false, "calledWith");
    delegateToCalls("alwaysCalledWithMatch", false, "calledWithMatch");
    delegateToCalls("calledWithExactly", true);
    delegateToCalls("alwaysCalledWithExactly", false, "calledWithExactly");
    delegateToCalls("neverCalledWith", false, "notCalledWith",
        function () { return true; });
    delegateToCalls("neverCalledWithMatch", false, "notCalledWithMatch",
        function () { return true; });
    delegateToCalls("threw", true);
    delegateToCalls("alwaysThrew", false, "threw");
    delegateToCalls("returned", true);
    delegateToCalls("alwaysReturned", false, "returned");
    delegateToCalls("calledWithNew", true);
    delegateToCalls("alwaysCalledWithNew", false, "calledWithNew");
    delegateToCalls("callArg", false, "callArgWith", function () {
        throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
    });
    spyApi.callArgWith = spyApi.callArg;
    delegateToCalls("callArgOn", false, "callArgOnWith", function () {
        throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
    });
    spyApi.callArgOnWith = spyApi.callArgOn;
    delegateToCalls("yield", false, "yield", function () {
        throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
    });
    // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
    spyApi.invokeCallback = spyApi.yield;
    delegateToCalls("yieldOn", false, "yieldOn", function () {
        throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
    });
    delegateToCalls("yieldTo", false, "yieldTo", function (property) {
        throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
    });
    delegateToCalls("yieldToOn", false, "yieldToOn", function (property) {
        throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
    });

    spyApi.formatters = {
        "c": function (spy) {
            return sinon.timesInWords(spy.callCount);
        },

        "n": function (spy) {
            return spy.toString();
        },

        "C": function (spy) {
            var calls = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
                var stringifiedCall = "    " + spy.getCall(i).toString();
                if (/\n/.test(calls[i - 1])) {
                    stringifiedCall = "\n" + stringifiedCall;
                }
                push.call(calls, stringifiedCall);
            }

            return calls.length > 0 ? "\n" + calls.join("\n") : "";
        },

        "t": function (spy) {
            var objects = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
                push.call(objects, sinon.format(spy.thisValues[i]));
            }

            return objects.join(", ");
        },

        "*": function (spy, args) {
            var formatted = [];

            for (var i = 0, l = args.length; i < l; ++i) {
                push.call(formatted, sinon.format(args[i]));
            }

            return formatted.join(", ");
        }
    };

    sinon.extend(spy, spyApi);

    spy.spyCall = sinon.spyCall;
    sinon.spy = spy;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = spy; });
    } else if (commonJSModule) {
        module.exports = spy;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6}],15:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend spy.js
 * @depend behavior.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon*/
/**
 * Stub functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function stub(object, property, func) {
        if (!!func && typeof func != "function") {
            throw new TypeError("Custom stub should be function");
        }

        var wrapper;

        if (func) {
            wrapper = sinon.spy && sinon.spy.create ? sinon.spy.create(func) : func;
        } else {
            wrapper = stub.create();
        }

        if (!object && typeof property === "undefined") {
            return sinon.stub.create();
        }

        if (typeof property === "undefined" && typeof object == "object") {
            for (var prop in object) {
                if (typeof object[prop] === "function") {
                    stub(object, prop);
                }
            }

            return object;
        }

        return sinon.wrapMethod(object, property, wrapper);
    }

    function getDefaultBehavior(stub) {
        return stub.defaultBehavior || getParentBehaviour(stub) || sinon.behavior.create(stub);
    }

    function getParentBehaviour(stub) {
        return (stub.parent && getCurrentBehavior(stub.parent));
    }

    function getCurrentBehavior(stub) {
        var behavior = stub.behaviors[stub.callCount - 1];
        return behavior && behavior.isPresent() ? behavior : getDefaultBehavior(stub);
    }

    var uuid = 0;

    sinon.extend(stub, (function () {
        var proto = {
            create: function create() {
                var functionStub = function () {
                    return getCurrentBehavior(functionStub).invoke(this, arguments);
                };

                functionStub.id = "stub#" + uuid++;
                var orig = functionStub;
                functionStub = sinon.spy.create(functionStub);
                functionStub.func = orig;

                sinon.extend(functionStub, stub);
                functionStub._create = sinon.stub.create;
                functionStub.displayName = "stub";
                functionStub.toString = sinon.functionToString;

                functionStub.defaultBehavior = null;
                functionStub.behaviors = [];

                return functionStub;
            },

            resetBehavior: function () {
                var i;

                this.defaultBehavior = null;
                this.behaviors = [];

                delete this.returnValue;
                delete this.returnArgAt;
                this.returnThis = false;

                if (this.fakes) {
                    for (i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].resetBehavior();
                    }
                }
            },

            onCall: function(index) {
                if (!this.behaviors[index]) {
                    this.behaviors[index] = sinon.behavior.create(this);
                }

                return this.behaviors[index];
            },

            onFirstCall: function() {
                return this.onCall(0);
            },

            onSecondCall: function() {
                return this.onCall(1);
            },

            onThirdCall: function() {
                return this.onCall(2);
            }
        };

        for (var method in sinon.behavior) {
            if (sinon.behavior.hasOwnProperty(method) &&
                !proto.hasOwnProperty(method) &&
                method != 'create' &&
                method != 'withArgs' &&
                method != 'invoke') {
                proto[method] = (function(behaviorMethod) {
                    return function() {
                        this.defaultBehavior = this.defaultBehavior || sinon.behavior.create(this);
                        this.defaultBehavior[behaviorMethod].apply(this.defaultBehavior, arguments);
                        return this;
                    };
                }(method));
            }
        }

        return proto;
    }()));

    sinon.stub = stub;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = stub; });
    } else if (commonJSModule) {
        module.exports = stub;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6}],16:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 * @depend sandbox.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true, plusplus: false*/
/*global module, require, sinon*/
/**
 * Test function, sandboxes fakes
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function test(callback) {
        var type = typeof callback;

        if (type != "function") {
            throw new TypeError("sinon.test needs to wrap a test function, got " + type);
        }

        function sinonSandboxedTest() {
            var config = sinon.getConfig(sinon.config);
            config.injectInto = config.injectIntoThis && this || config.injectInto;
            var sandbox = sinon.sandbox.create(config);
            var exception, result;
            var args = Array.prototype.slice.call(arguments).concat(sandbox.args);

            try {
                result = callback.apply(this, args);
            } catch (e) {
                exception = e;
            }

            if (typeof exception !== "undefined") {
                sandbox.restore();
                throw exception;
            }
            else {
                sandbox.verifyAndRestore();
            }

            return result;
        };

        if (callback.length) {
            return function sinonAsyncSandboxedTest(callback) {
                return sinonSandboxedTest.apply(this, arguments);
            };
        }

        return sinonSandboxedTest;
    }

    test.config = {
        injectIntoThis: true,
        injectInto: null,
        properties: ["spy", "stub", "mock", "clock", "server", "requests"],
        useFakeTimers: true,
        useFakeServer: true
    };

    sinon.test = test;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = test; });
    } else if (commonJSModule) {
        module.exports = test;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6}],17:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend test.js
 */
/*jslint eqeqeq: false, onevar: false, eqeqeq: false*/
/*global module, require, sinon*/
/**
 * Test case, sandboxes all test functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon || !Object.prototype.hasOwnProperty) {
        return;
    }

    function createTest(property, setUp, tearDown) {
        return function () {
            if (setUp) {
                setUp.apply(this, arguments);
            }

            var exception, result;

            try {
                result = property.apply(this, arguments);
            } catch (e) {
                exception = e;
            }

            if (tearDown) {
                tearDown.apply(this, arguments);
            }

            if (exception) {
                throw exception;
            }

            return result;
        };
    }

    function testCase(tests, prefix) {
        /*jsl:ignore*/
        if (!tests || typeof tests != "object") {
            throw new TypeError("sinon.testCase needs an object with test functions");
        }
        /*jsl:end*/

        prefix = prefix || "test";
        var rPrefix = new RegExp("^" + prefix);
        var methods = {}, testName, property, method;
        var setUp = tests.setUp;
        var tearDown = tests.tearDown;

        for (testName in tests) {
            if (tests.hasOwnProperty(testName)) {
                property = tests[testName];

                if (/^(setUp|tearDown)$/.test(testName)) {
                    continue;
                }

                if (typeof property == "function" && rPrefix.test(testName)) {
                    method = property;

                    if (setUp || tearDown) {
                        method = createTest(property, setUp, tearDown);
                    }

                    methods[testName] = sinon.test(method);
                } else {
                    methods[testName] = tests[testName];
                }
            }
        }

        return methods;
    }

    sinon.testCase = testCase;

    if (typeof define === "function" && define.amd) {
        define(["module"], function(module) { module.exports = testCase; });
    } else if (commonJSModule) {
        module.exports = testCase;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":6}],18:[function(require,module,exports){
(function (global){
/*jslint eqeqeq: false, plusplus: false, evil: true, onevar: false, browser: true, forin: false*/
/*global module, require, window*/
/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

if (typeof sinon == "undefined") {
    var sinon = {};
}

(function (global) {
    // node expects setTimeout/setInterval to return a fn object w/ .ref()/.unref()
    // browsers, a number.
    // see https://github.com/cjohansen/Sinon.JS/pull/436
    var timeoutResult = setTimeout(function() {}, 0);
    var addTimerReturnsObject = typeof timeoutResult === 'object';
    clearTimeout(timeoutResult);

    var id = 1;

    function addTimer(args, recurring) {
        if (args.length === 0) {
            throw new Error("Function requires at least 1 parameter");
        }

        if (typeof args[0] === "undefined") {
            throw new Error("Callback must be provided to timer calls");
        }

        var toId = id++;
        var delay = args[1] || 0;

        if (!this.timeouts) {
            this.timeouts = {};
        }

        this.timeouts[toId] = {
            id: toId,
            func: args[0],
            callAt: this.now + delay,
            invokeArgs: Array.prototype.slice.call(args, 2)
        };

        if (recurring === true) {
            this.timeouts[toId].interval = delay;
        }

        if (addTimerReturnsObject) {
            return {
                id: toId,
                ref: function() {},
                unref: function() {}
            };
        }
        else {
            return toId;
        }
    }

    function parseTime(str) {
        if (!str) {
            return 0;
        }

        var strings = str.split(":");
        var l = strings.length, i = l;
        var ms = 0, parsed;

        if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
            throw new Error("tick only understands numbers and 'h:m:s'");
        }

        while (i--) {
            parsed = parseInt(strings[i], 10);

            if (parsed >= 60) {
                throw new Error("Invalid time " + str);
            }

            ms += parsed * Math.pow(60, (l - i - 1));
        }

        return ms * 1000;
    }

    function createObject(object) {
        var newObject;

        if (Object.create) {
            newObject = Object.create(object);
        } else {
            var F = function () {};
            F.prototype = object;
            newObject = new F();
        }

        newObject.Date.clock = newObject;
        return newObject;
    }

    sinon.clock = {
        now: 0,

        create: function create(now) {
            var clock = createObject(this);

            if (typeof now == "number") {
                clock.now = now;
            }

            if (!!now && typeof now == "object") {
                throw new TypeError("now should be milliseconds since UNIX epoch");
            }

            return clock;
        },

        setTimeout: function setTimeout(callback, timeout) {
            return addTimer.call(this, arguments, false);
        },

        clearTimeout: function clearTimeout(timerId) {
            if (!timerId) {
                // null appears to be allowed in most browsers, and appears to be relied upon by some libraries, like Bootstrap carousel
                return;
            }
            if (!this.timeouts) {
                this.timeouts = [];
            }
            // in Node, timerId is an object with .ref()/.unref(), and
            // its .id field is the actual timer id.
            if (typeof timerId === 'object') {
              timerId = timerId.id
            }
            if (timerId in this.timeouts) {
                delete this.timeouts[timerId];
            }
        },

        setInterval: function setInterval(callback, timeout) {
            return addTimer.call(this, arguments, true);
        },

        clearInterval: function clearInterval(timerId) {
            this.clearTimeout(timerId);
        },

        setImmediate: function setImmediate(callback) {
            var passThruArgs = Array.prototype.slice.call(arguments, 1);

            return addTimer.call(this, [callback, 0].concat(passThruArgs), false);
        },

        clearImmediate: function clearImmediate(timerId) {
            this.clearTimeout(timerId);
        },

        tick: function tick(ms) {
            ms = typeof ms == "number" ? ms : parseTime(ms);
            var tickFrom = this.now, tickTo = this.now + ms, previous = this.now;
            var timer = this.firstTimerInRange(tickFrom, tickTo);

            var firstException;
            while (timer && tickFrom <= tickTo) {
                if (this.timeouts[timer.id]) {
                    tickFrom = this.now = timer.callAt;
                    try {
                      this.callTimer(timer);
                    } catch (e) {
                      firstException = firstException || e;
                    }
                }

                timer = this.firstTimerInRange(previous, tickTo);
                previous = tickFrom;
            }

            this.now = tickTo;

            if (firstException) {
              throw firstException;
            }

            return this.now;
        },

        firstTimerInRange: function (from, to) {
            var timer, smallest = null, originalTimer;

            for (var id in this.timeouts) {
                if (this.timeouts.hasOwnProperty(id)) {
                    if (this.timeouts[id].callAt < from || this.timeouts[id].callAt > to) {
                        continue;
                    }

                    if (smallest === null || this.timeouts[id].callAt < smallest) {
                        originalTimer = this.timeouts[id];
                        smallest = this.timeouts[id].callAt;

                        timer = {
                            func: this.timeouts[id].func,
                            callAt: this.timeouts[id].callAt,
                            interval: this.timeouts[id].interval,
                            id: this.timeouts[id].id,
                            invokeArgs: this.timeouts[id].invokeArgs
                        };
                    }
                }
            }

            return timer || null;
        },

        callTimer: function (timer) {
            if (typeof timer.interval == "number") {
                this.timeouts[timer.id].callAt += timer.interval;
            } else {
                delete this.timeouts[timer.id];
            }

            try {
                if (typeof timer.func == "function") {
                    timer.func.apply(null, timer.invokeArgs);
                } else {
                    eval(timer.func);
                }
            } catch (e) {
              var exception = e;
            }

            if (!this.timeouts[timer.id]) {
                if (exception) {
                  throw exception;
                }
                return;
            }

            if (exception) {
              throw exception;
            }
        },

        reset: function reset() {
            this.timeouts = {};
        },

        Date: (function () {
            var NativeDate = Date;

            function ClockDate(year, month, date, hour, minute, second, ms) {
                // Defensive and verbose to avoid potential harm in passing
                // explicit undefined when user does not pass argument
                switch (arguments.length) {
                case 0:
                    return new NativeDate(ClockDate.clock.now);
                case 1:
                    return new NativeDate(year);
                case 2:
                    return new NativeDate(year, month);
                case 3:
                    return new NativeDate(year, month, date);
                case 4:
                    return new NativeDate(year, month, date, hour);
                case 5:
                    return new NativeDate(year, month, date, hour, minute);
                case 6:
                    return new NativeDate(year, month, date, hour, minute, second);
                default:
                    return new NativeDate(year, month, date, hour, minute, second, ms);
                }
            }

            return mirrorDateProperties(ClockDate, NativeDate);
        }())
    };

    function mirrorDateProperties(target, source) {
        if (source.now) {
            target.now = function now() {
                return target.clock.now;
            };
        } else {
            delete target.now;
        }

        if (source.toSource) {
            target.toSource = function toSource() {
                return source.toSource();
            };
        } else {
            delete target.toSource;
        }

        target.toString = function toString() {
            return source.toString();
        };

        target.prototype = source.prototype;
        target.parse = source.parse;
        target.UTC = source.UTC;
        target.prototype.toUTCString = source.prototype.toUTCString;

        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }

        return target;
    }

    var methods = ["Date", "setTimeout", "setInterval",
                   "clearTimeout", "clearInterval"];

    if (typeof global.setImmediate !== "undefined") {
        methods.push("setImmediate");
    }

    if (typeof global.clearImmediate !== "undefined") {
        methods.push("clearImmediate");
    }

    function restore() {
        var method;

        for (var i = 0, l = this.methods.length; i < l; i++) {
            method = this.methods[i];

            if (global[method].hadOwnProperty) {
                global[method] = this["_" + method];
            } else {
                try {
                    delete global[method];
                } catch (e) {}
            }
        }

        // Prevent multiple executions which will completely remove these props
        this.methods = [];
    }

    function stubGlobal(method, clock) {
        clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(global, method);
        clock["_" + method] = global[method];

        if (method == "Date") {
            var date = mirrorDateProperties(clock[method], global[method]);
            global[method] = date;
        } else {
            global[method] = function () {
                return clock[method].apply(clock, arguments);
            };

            for (var prop in clock[method]) {
                if (clock[method].hasOwnProperty(prop)) {
                    global[method][prop] = clock[method][prop];
                }
            }
        }

        global[method].clock = clock;
    }

    sinon.useFakeTimers = function useFakeTimers(now) {
        var clock = sinon.clock.create(now);
        clock.restore = restore;
        clock.methods = Array.prototype.slice.call(arguments,
                                                   typeof now == "number" ? 1 : 0);

        if (clock.methods.length === 0) {
            clock.methods = methods;
        }

        for (var i = 0, l = clock.methods.length; i < l; i++) {
            stubGlobal(clock.methods[i], clock);
        }

        return clock;
    };
}(typeof global != "undefined" && typeof global !== "function" ? global : this));

sinon.timers = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setImmediate: (typeof setImmediate !== "undefined" ? setImmediate : undefined),
    clearImmediate: (typeof clearImmediate !== "undefined" ? clearImmediate: undefined),
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sinon;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],19:[function(require,module,exports){
(function (global){
((typeof define === "function" && define.amd && function (m) {
    define("formatio", ["samsam"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("samsam"));
}) || function (m) { this.formatio = m(this.samsam); }
)(function (samsam) {
    "use strict";

    var formatio = {
        excludeConstructors: ["Object", /^.$/],
        quoteStrings: true
    };

    var hasOwn = Object.prototype.hasOwnProperty;

    var specialObjects = [];
    if (typeof global !== "undefined") {
        specialObjects.push({ object: global, value: "[object global]" });
    }
    if (typeof document !== "undefined") {
        specialObjects.push({
            object: document,
            value: "[object HTMLDocument]"
        });
    }
    if (typeof window !== "undefined") {
        specialObjects.push({ object: window, value: "[object Window]" });
    }

    function functionName(func) {
        if (!func) { return ""; }
        if (func.displayName) { return func.displayName; }
        if (func.name) { return func.name; }
        var matches = func.toString().match(/function\s+([^\(]+)/m);
        return (matches && matches[1]) || "";
    }

    function constructorName(f, object) {
        var name = functionName(object && object.constructor);
        var excludes = f.excludeConstructors ||
                formatio.excludeConstructors || [];

        var i, l;
        for (i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] === "string" && excludes[i] === name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    }

    function isCircular(object, objects) {
        if (typeof object !== "object") { return false; }
        var i, l;
        for (i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) { return true; }
        }
        return false;
    }

    function ascii(f, object, processed, indent) {
        if (typeof object === "string") {
            var qs = f.quoteStrings;
            var quote = typeof qs !== "boolean" || qs;
            return processed || quote ? '"' + object + '"' : object;
        }

        if (typeof object === "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) { return "[Circular]"; }

        if (Object.prototype.toString.call(object) === "[object Array]") {
            return ascii.array.call(f, object, processed);
        }

        if (!object) { return String((1/object) === -Infinity ? "-0" : object); }
        if (samsam.isElement(object)) { return ascii.element(object); }

        if (typeof object.toString === "function" &&
                object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        var i, l;
        for (i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].object) {
                return specialObjects[i].value;
            }
        }

        return ascii.object.call(f, object, processed, indent);
    }

    ascii.func = function (func) {
        return "function " + functionName(func) + "() {}";
    };

    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var i, l, pieces = [];
        for (i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii(this, array[i], processed));
        }
        return "[" + pieces.join(", ") + "]";
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = samsam.keys(object).sort();
        var length = 3;
        var prop, str, obj, i, l;

        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = constructorName(this, object);
        var prefix = cons ? "[" + cons + "] " : "";
        var is = "";
        for (i = 0, l = indent; i < l; ++i) { is += " "; }

        if (length + indent > 80) {
            return prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" +
                is + "}";
        }
        return prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attr, pairs = [], attrName, i, l, val;

        for (i = 0, l = attrs.length; i < l; ++i) {
            attr = attrs.item(i);
            attrName = attr.nodeName.toLowerCase().replace("html:", "");
            val = attr.nodeValue;
            if (attrName !== "contenteditable" || val !== "inherit") {
                if (!!val) { pairs.push(attrName + "=\"" + val + "\""); }
            }
        }

        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;

        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }

        var res = formatted + pairs.join(" ") + ">" + content +
                "</" + tagName + ">";

        return res.replace(/ contentEditable="inherit"/, "");
    };

    function Formatio(options) {
        for (var opt in options) {
            this[opt] = options[opt];
        }
    }

    Formatio.prototype = {
        functionName: functionName,

        configure: function (options) {
            return new Formatio(options);
        },

        constructorName: function (object) {
            return constructorName(this, object);
        },

        ascii: function (object, processed, indent) {
            return ascii(this, object, processed, indent);
        }
    };

    return Formatio.prototype;
});

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"samsam":20}],20:[function(require,module,exports){
((typeof define === "function" && define.amd && function (m) { define("samsam", m); }) ||
 (typeof module === "object" &&
      function (m) { module.exports = m(); }) || // Node
 function (m) { this.samsam = m(); } // Browser globals
)(function () {
    var o = Object.prototype;
    var div = typeof document !== "undefined" && document.createElement("div");

    function isNaN(value) {
        // Unlike global isNaN, this avoids type coercion
        // typeof check avoids IE host object issues, hat tip to
        // lodash
        var val = value; // JsLint thinks value !== value is "weird"
        return typeof value === "number" && value !== val;
    }

    function getClass(value) {
        // Returns the internal [[Class]] by calling Object.prototype.toString
        // with the provided value as this. Return value is a string, naming the
        // internal class, e.g. "Array"
        return o.toString.call(value).split(/[ \]]/)[1];
    }

    /**
     * @name samsam.isArguments
     * @param Object object
     *
     * Returns ``true`` if ``object`` is an ``arguments`` object,
     * ``false`` otherwise.
     */
    function isArguments(object) {
        if (getClass(object) === 'Arguments') { return true; }
        if (typeof object !== "object" || typeof object.length !== "number" ||
                getClass(object) === "Array") {
            return false;
        }
        if (typeof object.callee == "function") { return true; }
        try {
            object[object.length] = 6;
            delete object[object.length];
        } catch (e) {
            return true;
        }
        return false;
    }

    /**
     * @name samsam.isElement
     * @param Object object
     *
     * Returns ``true`` if ``object`` is a DOM element node. Unlike
     * Underscore.js/lodash, this function will return ``false`` if ``object``
     * is an *element-like* object, i.e. a regular object with a ``nodeType``
     * property that holds the value ``1``.
     */
    function isElement(object) {
        if (!object || object.nodeType !== 1 || !div) { return false; }
        try {
            object.appendChild(div);
            object.removeChild(div);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @name samsam.keys
     * @param Object object
     *
     * Return an array of own property names.
     */
    function keys(object) {
        var ks = [], prop;
        for (prop in object) {
            if (o.hasOwnProperty.call(object, prop)) { ks.push(prop); }
        }
        return ks;
    }

    /**
     * @name samsam.isDate
     * @param Object value
     *
     * Returns true if the object is a ``Date``, or *date-like*. Duck typing
     * of date objects work by checking that the object has a ``getTime``
     * function whose return value equals the return value from the object's
     * ``valueOf``.
     */
    function isDate(value) {
        return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
    }

    /**
     * @name samsam.isNegZero
     * @param Object value
     *
     * Returns ``true`` if ``value`` is ``-0``.
     */
    function isNegZero(value) {
        return value === 0 && 1 / value === -Infinity;
    }

    /**
     * @name samsam.equal
     * @param Object obj1
     * @param Object obj2
     *
     * Returns ``true`` if two objects are strictly equal. Compared to
     * ``===`` there are two exceptions:
     *
     *   - NaN is considered equal to NaN
     *   - -0 and +0 are not considered equal
     */
    function identical(obj1, obj2) {
        if (obj1 === obj2 || (isNaN(obj1) && isNaN(obj2))) {
            return obj1 !== 0 || isNegZero(obj1) === isNegZero(obj2);
        }
    }


    /**
     * @name samsam.deepEqual
     * @param Object obj1
     * @param Object obj2
     *
     * Deep equal comparison. Two values are "deep equal" if:
     *
     *   - They are equal, according to samsam.identical
     *   - They are both date objects representing the same time
     *   - They are both arrays containing elements that are all deepEqual
     *   - They are objects with the same set of properties, and each property
     *     in ``obj1`` is deepEqual to the corresponding property in ``obj2``
     *
     * Supports cyclic objects.
     */
    function deepEqualCyclic(obj1, obj2) {

        // used for cyclic comparison
        // contain already visited objects
        var objects1 = [],
            objects2 = [],
        // contain pathes (position in the object structure)
        // of the already visited objects
        // indexes same as in objects arrays
            paths1 = [],
            paths2 = [],
        // contains combinations of already compared objects
        // in the manner: { "$1['ref']$2['ref']": true }
            compared = {};

        /**
         * used to check, if the value of a property is an object
         * (cyclic logic is only needed for objects)
         * only needed for cyclic logic
         */
        function isObject(value) {

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

                return true;
            }

            return false;
        }

        /**
         * returns the index of the given object in the
         * given objects array, -1 if not contained
         * only needed for cyclic logic
         */
        function getIndex(objects, obj) {

            var i;
            for (i = 0; i < objects.length; i++) {
                if (objects[i] === obj) {
                    return i;
                }
            }

            return -1;
        }

        // does the recursion for the deep equal check
        return (function deepEqual(obj1, obj2, path1, path2) {
            var type1 = typeof obj1;
            var type2 = typeof obj2;

            // == null also matches undefined
            if (obj1 === obj2 ||
                    isNaN(obj1) || isNaN(obj2) ||
                    obj1 == null || obj2 == null ||
                    type1 !== "object" || type2 !== "object") {

                return identical(obj1, obj2);
            }

            // Elements are only equal if identical(expected, actual)
            if (isElement(obj1) || isElement(obj2)) { return false; }

            var isDate1 = isDate(obj1), isDate2 = isDate(obj2);
            if (isDate1 || isDate2) {
                if (!isDate1 || !isDate2 || obj1.getTime() !== obj2.getTime()) {
                    return false;
                }
            }

            if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
                if (obj1.toString() !== obj2.toString()) { return false; }
            }

            var class1 = getClass(obj1);
            var class2 = getClass(obj2);
            var keys1 = keys(obj1);
            var keys2 = keys(obj2);

            if (isArguments(obj1) || isArguments(obj2)) {
                if (obj1.length !== obj2.length) { return false; }
            } else {
                if (type1 !== type2 || class1 !== class2 ||
                        keys1.length !== keys2.length) {
                    return false;
                }
            }

            var key, i, l,
                // following vars are used for the cyclic logic
                value1, value2,
                isObject1, isObject2,
                index1, index2,
                newPath1, newPath2;

            for (i = 0, l = keys1.length; i < l; i++) {
                key = keys1[i];
                if (!o.hasOwnProperty.call(obj2, key)) {
                    return false;
                }

                // Start of the cyclic logic

                value1 = obj1[key];
                value2 = obj2[key];

                isObject1 = isObject(value1);
                isObject2 = isObject(value2);

                // determine, if the objects were already visited
                // (it's faster to check for isObject first, than to
                // get -1 from getIndex for non objects)
                index1 = isObject1 ? getIndex(objects1, value1) : -1;
                index2 = isObject2 ? getIndex(objects2, value2) : -1;

                // determine the new pathes of the objects
                // - for non cyclic objects the current path will be extended
                //   by current property name
                // - for cyclic objects the stored path is taken
                newPath1 = index1 !== -1
                    ? paths1[index1]
                    : path1 + '[' + JSON.stringify(key) + ']';
                newPath2 = index2 !== -1
                    ? paths2[index2]
                    : path2 + '[' + JSON.stringify(key) + ']';

                // stop recursion if current objects are already compared
                if (compared[newPath1 + newPath2]) {
                    return true;
                }

                // remember the current objects and their pathes
                if (index1 === -1 && isObject1) {
                    objects1.push(value1);
                    paths1.push(newPath1);
                }
                if (index2 === -1 && isObject2) {
                    objects2.push(value2);
                    paths2.push(newPath2);
                }

                // remember that the current objects are already compared
                if (isObject1 && isObject2) {
                    compared[newPath1 + newPath2] = true;
                }

                // End of cyclic logic

                // neither value1 nor value2 is a cycle
                // continue with next level
                if (!deepEqual(value1, value2, newPath1, newPath2)) {
                    return false;
                }
            }

            return true;

        }(obj1, obj2, '$1', '$2'));
    }

    var match;

    function arrayContains(array, subset) {
        if (subset.length === 0) { return true; }
        var i, l, j, k;
        for (i = 0, l = array.length; i < l; ++i) {
            if (match(array[i], subset[0])) {
                for (j = 0, k = subset.length; j < k; ++j) {
                    if (!match(array[i + j], subset[j])) { return false; }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * @name samsam.match
     * @param Object object
     * @param Object matcher
     *
     * Compare arbitrary value ``object`` with matcher.
     */
    match = function match(object, matcher) {
        if (matcher && typeof matcher.test === "function") {
            return matcher.test(object);
        }

        if (typeof matcher === "function") {
            return matcher(object) === true;
        }

        if (typeof matcher === "string") {
            matcher = matcher.toLowerCase();
            var notNull = typeof object === "string" || !!object;
            return notNull &&
                (String(object)).toLowerCase().indexOf(matcher) >= 0;
        }

        if (typeof matcher === "number") {
            return matcher === object;
        }

        if (typeof matcher === "boolean") {
            return matcher === object;
        }

        if (getClass(object) === "Array" && getClass(matcher) === "Array") {
            return arrayContains(object, matcher);
        }

        if (matcher && typeof matcher === "object") {
            var prop;
            for (prop in matcher) {
                var value = object[prop];
                if (typeof value === "undefined" &&
                        typeof object.getAttribute === "function") {
                    value = object.getAttribute(prop);
                }
                if (typeof value === "undefined" || !match(value, matcher[prop])) {
                    return false;
                }
            }
            return true;
        }

        throw new Error("Matcher was not a string, a number, a " +
                        "function, a boolean or an object");
    };

    return {
        isArguments: isArguments,
        isElement: isElement,
        isDate: isDate,
        isNegZero: isNegZero,
        identical: identical,
        deepEqual: deepEqualCyclic,
        match: match,
        keys: keys
    };
});

},{}],21:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('changes', function() {
  describe('stream', function() {
    return it('should not have .changes method', function() {
      return expect(stream().changes).toBe(void 0);
    });
  });
  return describe('property', function() {
    it('should return stream', function() {
      return expect(prop().changes()).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.changes()).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).changes()).toEmit(['<end:current>']);
    });
    return it('should handle events and current', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.changes()).toEmit([2, 3, '<end>'], function() {
        return send(a, [2, 3, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],22:[function(require,module,exports){
var Kefir, prop, send, stream, _ref,
  __slice = [].slice;

Kefir = require('kefir');

_ref = require('../test-helpers.coffee'), stream = _ref.stream, prop = _ref.prop, send = _ref.send;

describe('combine', function() {
  it('should return property', function() {
    expect(Kefir.combine([])).toBeProperty();
    expect(Kefir.combine([stream(), prop()])).toBeProperty();
    expect(stream().combine(stream())).toBeProperty();
    return expect(prop().combine(prop())).toBeProperty();
  });
  it('should be ended if empty array provided', function() {
    return expect(Kefir.combine([])).toEmit(['<end:current>']);
  });
  it('should be ended if array of ended observables provided', function() {
    var a, b, c;
    a = send(stream(), ['<end>']);
    b = send(prop(), ['<end>']);
    c = send(stream(), ['<end>']);
    expect(Kefir.combine([a, b, c])).toEmit(['<end:current>']);
    return expect(a.combine(b)).toEmit(['<end:current>']);
  });
  it('should be ended and has current if array of ended properties provided and each of them has current', function() {
    var a, b, c;
    a = send(prop(), [1, '<end>']);
    b = send(prop(), [2, '<end>']);
    c = send(prop(), [3, '<end>']);
    expect(Kefir.combine([a, b, c])).toEmit([
      {
        current: [1, 2, 3]
      }, '<end:current>'
    ]);
    return expect(a.combine(b)).toEmit([
      {
        current: [1, 2]
      }, '<end:current>'
    ]);
  });
  it('should activate sources', function() {
    var a, b, c;
    a = stream();
    b = prop();
    c = stream();
    expect(Kefir.combine([a, b, c])).toActivate(a, b, c);
    return expect(a.combine(b)).toActivate(a, b);
  });
  it('should handle events and current from observables', function() {
    var a, b, c;
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    expect(Kefir.combine([a, b, c])).toEmit([[1, 0, 2], [1, 3, 2], [1, 4, 2], [1, 4, 5], [1, 4, 6], '<end>'], function() {
      send(a, [1]);
      send(c, [2]);
      send(b, [3]);
      send(a, ['<end>']);
      send(b, [4, '<end>']);
      return send(c, [5, 6, '<end>']);
    });
    a = stream();
    b = send(prop(), [0]);
    return expect(a.combine(b)).toEmit([[1, 0], [1, 2], [1, 3], '<end>'], function() {
      send(a, [1]);
      send(b, [2]);
      send(a, ['<end>']);
      return send(b, [3, '<end>']);
    });
  });
  return it('should accept optional combinator function', function() {
    var a, b, c, join;
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    join = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return args.join('+');
    };
    expect(Kefir.combine([a, b, c], join)).toEmit(['1+0+2', '1+3+2', '1+4+2', '1+4+5', '1+4+6', '<end>'], function() {
      send(a, [1]);
      send(c, [2]);
      send(b, [3]);
      send(a, ['<end>']);
      send(b, [4, '<end>']);
      return send(c, [5, 6, '<end>']);
    });
    a = stream();
    b = send(prop(), [0]);
    return expect(a.combine(b, join)).toEmit(['1+0', '1+2', '1+3', '<end>'], function() {
      send(a, [1]);
      send(b, [2]);
      send(a, ['<end>']);
      return send(b, [3, '<end>']);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],23:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('constant', function() {
  it('should return property', function() {
    return expect(Kefir.constant(1)).toBeProperty();
  });
  return it('should be ended and has current', function() {
    return expect(Kefir.constant(1)).toEmit([
      {
        current: 1
      }, '<end:current>'
    ]);
  });
});



},{"kefir":54}],24:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('delay', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().delay(100)).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.delay(100)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).delay(100)).toEmit(['<end:current>']);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.delay(100)).toEmitInTime([[100, 1], [150, 2], [250, '<end>']], function(tick) {
        send(a, [1]);
        tick(50);
        send(a, [2]);
        tick(100);
        return send(a, ['<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().delay(100)).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.delay(100)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).delay(100)).toEmit(['<end:current>']);
    });
    return it('should handle events and current', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.delay(100)).toEmitInTime([
        [
          0, {
            current: 1
          }
        ], [100, 2], [150, 3], [250, '<end>']
      ], function(tick) {
        send(a, [2]);
        tick(50);
        send(a, [3]);
        tick(100);
        return send(a, ['<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],25:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('diff', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().diff(0, function() {})).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.diff(0, function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).diff(0, function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.diff(0, function(prev, next) {
        return prev - next;
      })).toEmit([-1, -2, '<end>'], function() {
        return send(a, [1, 3, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().diff(0, function() {})).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.diff(0, function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).diff(0, function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events and current', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.diff(0, function(prev, next) {
        return prev - next;
      })).toEmit([
        {
          current: -1
        }, -2, -3, '<end>'
      ], function() {
        return send(a, [3, 6, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],26:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('emitter', function() {
  it('should return stream', function() {
    return expect(Kefir.emitter()).toBeStream();
  });
  it('should not be ended', function() {
    return expect(Kefir.emitter()).toEmit([]);
  });
  return it('should emit values and end', function() {
    var a;
    a = Kefir.emitter();
    return expect(a).toEmit([1, 2, 3, '<end>'], function() {
      a.emit(1);
      a.emit(2);
      a.emit(3);
      return a.end();
    });
  });
});



},{"kefir":54}],27:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('empty', function() {
  it('should return stream', function() {
    return expect(Kefir.empty()).toBeStream();
  });
  return it('should be ended', function() {
    return expect(Kefir.empty()).toEmit(['<end:current>']);
  });
});



},{"kefir":54}],28:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('filter', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().filter(function() {})).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.filter(function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).filter(function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.filter(function(x) {
        return x > 3;
      })).toEmit([4, 5, 6, '<end>'], function() {
        return send(a, [1, 2, 4, 5, 0, 6, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().filter(function() {})).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.filter(function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).filter(function() {})).toEmit(['<end:current>']);
    });
    it('should handle events and current', function() {
      var a;
      a = send(prop(), [5]);
      return expect(a.filter(function(x) {
        return x > 2;
      })).toEmit([
        {
          current: 5
        }, 4, 3, '<end>'
      ], function() {
        return send(a, [4, 3, 2, 1, '<end>']);
      });
    });
    return it('should handle current (not pass)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.filter(function(x) {
        return x > 2;
      })).toEmit([]);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],29:[function(require,module,exports){
var Kefir, activate, deactivate, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send, activate = helpers.activate, deactivate = helpers.deactivate;

describe('flatMap', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().flatMap()).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.flatMap()).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).flatMap()).toEmit(['<end:current>']);
    });
    it('should handle events', function() {
      var a, b, c;
      a = stream();
      b = stream();
      c = send(prop(), [0]);
      return expect(a.flatMap()).toEmit([
        1, 2, {
          current: 0
        }, 3, 4, '<end>'
      ], function() {
        send(b, [0]);
        send(a, [b]);
        send(b, [1, 2]);
        send(a, [c, '<end>']);
        send(b, [3, '<end>']);
        return send(c, [4, '<end>']);
      });
    });
    it('should activate sub-sources', function() {
      var a, b, c, map;
      a = stream();
      b = stream();
      c = send(prop(), [0]);
      map = a.flatMap();
      activate(map);
      send(a, [b, c]);
      deactivate(map);
      return expect(map).toActivate(b, c);
    });
    return it('should accept optional map fn', function() {
      var a, b;
      a = stream();
      b = stream();
      return expect(a.flatMap(function(x) {
        return x.obs;
      })).toEmit([1, 2, '<end>'], function() {
        send(b, [0]);
        send(a, [
          {
            obs: b
          }, '<end>'
        ]);
        return send(b, [1, 2, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return stream', function() {
      return expect(prop().flatMap()).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.flatMap()).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).flatMap()).toEmit(['<end:current>']);
    });
    it('should handle current value', function() {
      var a, b;
      a = send(prop(), [0]);
      b = send(prop(), [a]);
      return expect(b.flatMap()).toEmit([
        {
          current: 0
        }
      ]);
    });
    return it('should costantly adding current value on each activation (documented bug)', function() {
      var a, b, map;
      a = send(prop(), [0]);
      b = send(prop(), [a]);
      map = b.flatMap();
      activate(map);
      deactivate(map);
      activate(map);
      deactivate(map);
      return expect(map).toEmit([
        {
          current: 0
        }, {
          current: 0
        }, {
          current: 0
        }
      ]);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],30:[function(require,module,exports){
var Kefir, activate, deactivate, _ref;

Kefir = require('kefir');

_ref = require('../test-helpers.coffee'), activate = _ref.activate, deactivate = _ref.deactivate;

describe('fromBinder', function() {
  it('should return stream', function() {
    return expect(Kefir.fromBinder(function() {})).toBeStream();
  });
  it('should not be ended', function() {
    return expect(Kefir.fromBinder(function() {})).toEmit([]);
  });
  it('should emit values and end', function() {
    var a, send;
    send = null;
    a = Kefir.fromBinder(function(s) {
      send = s;
      return null;
    });
    return expect(a).toEmit([1, 2, 3, '<end>'], function() {
      send('value', 1);
      send('value', 2);
      send('value', 3);
      return send('end');
    });
  });
  return it('should call `subscribe` / `unsubscribe` on activation / deactivation', function() {
    var a, subCount, unsubCount;
    subCount = 0;
    unsubCount = 0;
    a = Kefir.fromBinder(function() {
      subCount++;
      return function() {
        return unsubCount++;
      };
    });
    expect(subCount).toBe(0);
    expect(unsubCount).toBe(0);
    activate(a);
    expect(subCount).toBe(1);
    activate(a);
    expect(subCount).toBe(1);
    deactivate(a);
    expect(unsubCount).toBe(0);
    deactivate(a);
    expect(unsubCount).toBe(1);
    expect(subCount).toBe(1);
    activate(a);
    expect(subCount).toBe(2);
    expect(unsubCount).toBe(1);
    deactivate(a);
    return expect(unsubCount).toBe(2);
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],31:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('fromPoll', function() {
  it('should return stream', function() {
    return expect(Kefir.fromPoll(100, function() {})).toBeStream();
  });
  return it('should emit whatever fn returns at certain time', function() {
    var i;
    i = 0;
    return expect(Kefir.fromPoll(100, function() {
      return ++i;
    })).toEmitInTime([[100, 1], [200, 2], [300, 3]], null, 350);
  });
});



},{"kefir":54}],32:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('interval', function() {
  it('should return stream', function() {
    return expect(Kefir.interval(100, 1)).toBeStream();
  });
  return it('should repeat same value at certain time', function() {
    return expect(Kefir.interval(100, 1)).toEmitInTime([[100, 1], [200, 1], [300, 1]], null, 350);
  });
});



},{"kefir":54}],33:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('later', function() {
  it('should return stream', function() {
    return expect(Kefir.later(100, 1)).toBeStream();
  });
  return it('should emmit value after interval then end', function() {
    return expect(Kefir.later(100, 1)).toEmitInTime([[100, 1], [100, '<end>']]);
  });
});



},{"kefir":54}],34:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('map', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().map(function() {})).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.map(function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).map(function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.map(function(x) {
        return x * 2;
      })).toEmit([2, 4, '<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().map(function() {})).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.map(function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).map(function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events and current', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.map(function(x) {
        return x * 2;
      })).toEmit([
        {
          current: 2
        }, 4, 6, '<end>'
      ], function() {
        return send(a, [2, 3, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],35:[function(require,module,exports){
var Kefir, activate, deactivate, prop, send, stream, _ref;

Kefir = require('kefir');

_ref = require('../test-helpers.coffee'), stream = _ref.stream, prop = _ref.prop, send = _ref.send, activate = _ref.activate, deactivate = _ref.deactivate;

describe('merge', function() {
  it('should return stream', function() {
    expect(Kefir.merge([])).toBeStream();
    expect(Kefir.merge([stream(), prop()])).toBeStream();
    expect(stream().merge(stream())).toBeStream();
    return expect(prop().merge(prop())).toBeStream();
  });
  it('should be ended if empty array provided', function() {
    return expect(Kefir.merge([])).toEmit(['<end:current>']);
  });
  it('should be ended if array of ended observables provided', function() {
    var a, b, c;
    a = send(stream(), ['<end>']);
    b = send(prop(), ['<end>']);
    c = send(stream(), ['<end>']);
    expect(Kefir.merge([a, b, c])).toEmit(['<end:current>']);
    return expect(a.merge(b)).toEmit(['<end:current>']);
  });
  it('should activate sources', function() {
    var a, b, c;
    a = stream();
    b = prop();
    c = stream();
    expect(Kefir.merge([a, b, c])).toActivate(a, b, c);
    return expect(a.merge(b)).toActivate(a, b);
  });
  it('should deliver events from observables, then end when all of them end', function() {
    var a, b, c;
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    expect(Kefir.merge([a, b, c])).toEmit([
      {
        current: 0
      }, 1, 2, 3, 4, 5, 6, '<end>'
    ], function() {
      send(a, [1]);
      send(b, [2]);
      send(c, [3]);
      send(a, ['<end>']);
      send(b, [4, '<end>']);
      return send(c, [5, 6, '<end>']);
    });
    a = stream();
    b = send(prop(), [0]);
    return expect(a.merge(b)).toEmit([
      {
        current: 0
      }, 1, 2, 3, '<end>'
    ], function() {
      send(a, [1]);
      send(b, [2]);
      send(a, ['<end>']);
      return send(b, [3, '<end>']);
    });
  });
  return it('should deliver currents from all source properties, but only to first subscriber on each activation', function() {
    var a, b, c, merge;
    a = send(prop(), [0]);
    b = send(prop(), [1]);
    c = send(prop(), [2]);
    merge = Kefir.merge([a, b, c]);
    expect(merge).toEmit([
      {
        current: 0
      }, {
        current: 1
      }, {
        current: 2
      }
    ]);
    merge = Kefir.merge([a, b, c]);
    activate(merge);
    expect(merge).toEmit([]);
    merge = Kefir.merge([a, b, c]);
    activate(merge);
    deactivate(merge);
    return expect(merge).toEmit([
      {
        current: 0
      }, {
        current: 1
      }, {
        current: 2
      }
    ]);
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],36:[function(require,module,exports){
var Kefir, activate, deactivate, prop, send, stream, _ref;

Kefir = require('kefir');

_ref = require('../test-helpers.coffee'), stream = _ref.stream, prop = _ref.prop, send = _ref.send, activate = _ref.activate, deactivate = _ref.deactivate;

describe('pool', function() {
  it('should return stream', function() {
    return expect(Kefir.pool()).toBeStream();
  });
  it('should activate sources', function() {
    var a, b, c, pool;
    a = stream();
    b = prop();
    c = stream();
    pool = Kefir.pool().add(a).add(b).add(c);
    expect(pool).toActivate(a, b, c);
    pool.remove(b);
    expect(pool).toActivate(a, c);
    return expect(pool).not.toActivate(b);
  });
  it('should deliver events from observables', function() {
    var a, b, c, pool;
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    pool = Kefir.pool().add(a).add(b).add(c);
    return expect(pool).toEmit([
      {
        current: 0
      }, 1, 2, 3, 4, 5, 6
    ], function() {
      send(a, [1]);
      send(b, [2]);
      send(c, [3]);
      send(a, ['<end>']);
      send(b, [4, '<end>']);
      return send(c, [5, 6, '<end>']);
    });
  });
  it('should deliver currents from all source properties, but only to first subscriber on each activation', function() {
    var a, b, c, pool;
    a = send(prop(), [0]);
    b = send(prop(), [1]);
    c = send(prop(), [2]);
    pool = Kefir.pool().add(a).add(b).add(c);
    expect(pool).toEmit([
      {
        current: 0
      }, {
        current: 1
      }, {
        current: 2
      }
    ]);
    pool = Kefir.pool().add(a).add(b).add(c);
    activate(pool);
    expect(pool).toEmit([]);
    pool = Kefir.pool().add(a).add(b).add(c);
    activate(pool);
    deactivate(pool);
    return expect(pool).toEmit([
      {
        current: 0
      }, {
        current: 1
      }, {
        current: 2
      }
    ]);
  });
  return it('should not deliver events from removed sources', function() {
    var a, b, c, pool;
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    pool = Kefir.pool().add(a).add(b).add(c).remove(b);
    return expect(pool).toEmit([1, 3, 5, 6], function() {
      send(a, [1]);
      send(b, [2]);
      send(c, [3]);
      send(a, ['<end>']);
      send(b, [4, '<end>']);
      return send(c, [5, 6, '<end>']);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],37:[function(require,module,exports){
var Kefir, activate, helpers, prop, send;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

prop = helpers.prop, send = helpers.send, activate = helpers.activate;

describe('Property', function() {
  describe('new', function() {
    it('should create a Property', function() {
      expect(prop()).toBeProperty();
      return expect(new Kefir.Property()).toBeProperty();
    });
    it('should not be ended', function() {
      return expect(prop()).toEmit([]);
    });
    return it('should not be active', function() {
      return expect(prop()).not.toBeActive();
    });
  });
  describe('end', function() {
    it('should end when `end` sent', function() {
      var s;
      s = prop();
      return expect(s).toEmit(['<end>'], function() {
        return send(s, ['<end>']);
      });
    });
    it('should call `end` subscribers', function() {
      var log, s;
      s = prop();
      log = [];
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 1]);
      });
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 2]);
      });
      expect(log).toEqual([]);
      send(s, ['<end>']);
      return expect(log).toEqual([[void 0, false, 1], [void 0, false, 2]]);
    });
    it('should call `end` subscribers on already ended property', function() {
      var log, s;
      s = prop();
      send(s, ['<end>']);
      log = [];
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 1]);
      });
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 2]);
      });
      return expect(log).toEqual([[void 0, true, 1], [void 0, true, 2]]);
    });
    it('should deactivate on end', function() {
      var s;
      s = prop();
      activate(s);
      expect(s).toBeActive();
      send(s, ['<end>']);
      return expect(s).not.toBeActive();
    });
    return it('should stop deliver new values after end', function() {
      var s;
      s = prop();
      return expect(s).toEmit([1, 2, '<end>'], function() {
        return send(s, [1, 2, '<end>', 3]);
      });
    });
  });
  describe('active state', function() {
    it('should activate when first subscriber added (value)', function() {
      var s;
      s = prop();
      s.on('value', function() {});
      return expect(s).toBeActive();
    });
    it('should activate when first subscriber added (end)', function() {
      var s;
      s = prop();
      s.on('end', function() {});
      return expect(s).toBeActive();
    });
    it('should activate when first subscriber added (any)', function() {
      var s;
      s = prop();
      s.on('any', function() {});
      return expect(s).toBeActive();
    });
    return it('should deactivate when all subscribers removed', function() {
      var any1, any2, end1, end2, s, value1, value2;
      s = prop();
      s.on('any', (any1 = function() {}));
      s.on('any', (any2 = function() {}));
      s.on('value', (value1 = function() {}));
      s.on('value', (value2 = function() {}));
      s.on('end', (end1 = function() {}));
      s.on('end', (end2 = function() {}));
      s.off('value', value1);
      s.off('value', value2);
      s.off('any', any1);
      s.off('any', any2);
      s.off('end', end1);
      expect(s).toBeActive();
      s.off('end', end2);
      return expect(s).not.toBeActive();
    });
  });
  return describe('subscribers', function() {
    return it('should deliver values and current', function() {
      var s;
      s = send(prop(), [0]);
      return expect(s).toEmit([
        {
          current: 0
        }, 1, 2
      ], function() {
        return send(s, [1, 2]);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],38:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('reduce', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().reduce(0, function() {})).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.reduce(0, function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).reduce(0, function() {})).toEmit([
        {
          current: 0
        }, '<end:current>'
      ]);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.reduce(0, function(prev, next) {
        return prev - next;
      })).toEmit([-4, '<end>'], function() {
        return send(a, [1, 3, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().reduce(0, function() {})).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.reduce(0, function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).reduce(0, function() {})).toEmit([
        {
          current: 0
        }, '<end:current>'
      ]);
    });
    return it('should handle events and current', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.reduce(0, function(prev, next) {
        return prev - next;
      })).toEmit([-10, '<end>'], function() {
        return send(a, [3, 6, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],39:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('repeatedly', function() {
  it('should return stream', function() {
    return expect(Kefir.repeatedly(100, [1, 2, 3])).toBeStream();
  });
  it('should emmit nothing if empty array provided', function() {
    return expect(Kefir.repeatedly(100, [])).toEmitInTime([], null, 750);
  });
  return it('should repeat values from array at certain time', function() {
    return expect(Kefir.repeatedly(100, [1, 2, 3])).toEmitInTime([[100, 1], [200, 2], [300, 3], [400, 1], [500, 2], [600, 3], [700, 1]], null, 750);
  });
});



},{"kefir":54}],40:[function(require,module,exports){
var Kefir, prop, send, stream, _ref,
  __slice = [].slice;

Kefir = require('kefir');

_ref = require('../test-helpers.coffee'), stream = _ref.stream, prop = _ref.prop, send = _ref.send;

describe('sampledBy', function() {
  it('should return stream', function() {
    expect(Kefir.sampledBy([], [])).toBeStream();
    expect(Kefir.sampledBy([stream(), prop()], [stream(), prop()])).toBeStream();
    expect(prop().sampledBy(stream())).toBeStream();
    return expect(stream().sampledBy(prop())).toBeStream();
  });
  it('should be ended if empty array provided', function() {
    expect(Kefir.sampledBy([stream(), prop()], [])).toEmit(['<end:current>']);
    return expect(Kefir.sampledBy([], [stream(), prop()])).toEmit([]);
  });
  it('should be ended if array of ended observables provided', function() {
    var a, b, c;
    a = send(stream(), ['<end>']);
    b = send(prop(), ['<end>']);
    c = send(stream(), ['<end>']);
    expect(Kefir.sampledBy([stream(), prop()], [a, b, c])).toEmit(['<end:current>']);
    return expect(prop().sampledBy(a)).toEmit(['<end:current>']);
  });
  it('should be ended and emmit current (once) if array of ended properties provided and each of them has current', function() {
    var a, b, c, s1, s2;
    a = send(prop(), [1, '<end>']);
    b = send(prop(), [2, '<end>']);
    c = send(prop(), [3, '<end>']);
    s1 = Kefir.sampledBy([a], [b, c]);
    s2 = a.sampledBy(b);
    expect(s1).toEmit([
      {
        current: [1, 2, 3]
      }, '<end:current>'
    ]);
    expect(s2).toEmit([
      {
        current: [1, 2]
      }, '<end:current>'
    ]);
    expect(s1).toEmit(['<end:current>']);
    return expect(s2).toEmit(['<end:current>']);
  });
  it('should activate sources', function() {
    var a, b, c;
    a = stream();
    b = prop();
    c = stream();
    expect(Kefir.sampledBy([a], [b, c])).toActivate(a, b, c);
    return expect(a.sampledBy(b)).toActivate(a, b);
  });
  it('should handle events and current from observables', function() {
    var a, b, c, d;
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    d = stream();
    expect(Kefir.sampledBy([a, b], [c, d])).toEmit([[1, 0, 2, 3], [1, 4, 5, 3], [1, 4, 6, 3], [1, 4, 6, 7], '<end>'], function() {
      send(a, [1]);
      send(c, [2]);
      send(d, [3]);
      send(b, [4, '<end>']);
      send(c, [5, 6, '<end>']);
      return send(d, [7, '<end>']);
    });
    a = stream();
    b = send(prop(), [0]);
    return expect(a.sampledBy(b)).toEmit([[2, 3], [4, 5], [4, 6], '<end>'], function() {
      send(b, [1]);
      send(a, [2]);
      send(b, [3]);
      send(a, [4]);
      return send(b, [5, 6, '<end>']);
    });
  });
  return it('should accept optional combinator function', function() {
    var a, b, c, d, join;
    join = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return args.join('+');
    };
    a = stream();
    b = send(prop(), [0]);
    c = stream();
    d = stream();
    expect(Kefir.sampledBy([a, b], [c, d], join)).toEmit(['1+0+2+3', '1+4+5+3', '1+4+6+3', '1+4+6+7', '<end>'], function() {
      send(a, [1]);
      send(c, [2]);
      send(d, [3]);
      send(b, [4, '<end>']);
      send(c, [5, 6, '<end>']);
      return send(d, [7, '<end>']);
    });
    a = stream();
    b = send(prop(), [0]);
    return expect(a.sampledBy(b, join)).toEmit(['2+3', '4+5', '4+6', '<end>'], function() {
      send(b, [1]);
      send(a, [2]);
      send(b, [3]);
      send(a, [4]);
      return send(b, [5, 6, '<end>']);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],41:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('scan', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().scan(0, function() {})).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.scan(0, function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).scan(0, function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.scan(0, function(prev, next) {
        return prev - next;
      })).toEmit([-1, -4, '<end>'], function() {
        return send(a, [1, 3, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().scan(0, function() {})).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.scan(0, function() {})).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).scan(0, function() {})).toEmit(['<end:current>']);
    });
    return it('should handle events and current', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.scan(0, function(prev, next) {
        return prev - next;
      })).toEmit([
        {
          current: -1
        }, -4, -10, '<end>'
      ], function() {
        return send(a, [3, 6, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],42:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('sequentially', function() {
  it('should return stream', function() {
    return expect(Kefir.sequentially(100, [1, 2, 3])).toBeStream();
  });
  it('should be ended if empty array provided', function() {
    return expect(Kefir.sequentially(100, [])).toEmitInTime([[0, '<end:current>']]);
  });
  return it('should emmit values at certain time then end', function() {
    return expect(Kefir.sequentially(100, [1, 2, 3])).toEmitInTime([[100, 1], [200, 2], [300, 3], [300, '<end>']]);
  });
});



},{"kefir":54}],43:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('skipDuplicates', function() {
  var roundlyEqual;
  roundlyEqual = function(a, b) {
    return Math.round(a) === Math.round(b);
  };
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().skipDuplicates()).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.skipDuplicates()).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).skipDuplicates()).toEmit(['<end:current>']);
    });
    it('should handle events (default comparator)', function() {
      var a;
      a = stream();
      return expect(a.skipDuplicates()).toEmit([1, 2, 3, '<end>'], function() {
        return send(a, [1, 1, 2, 3, 3, '<end>']);
      });
    });
    return it('should handle events (custom comparator)', function() {
      var a;
      a = stream();
      return expect(a.skipDuplicates(roundlyEqual)).toEmit([1, 2, 3.8, '<end>'], function() {
        return send(a, [1, 1.1, 2, 3.8, 4, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().skipDuplicates()).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.skipDuplicates()).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).skipDuplicates()).toEmit(['<end:current>']);
    });
    it('should handle events and current (default comparator)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skipDuplicates()).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [1, 1, 2, 3, 3, '<end>']);
      });
    });
    return it('should handle events and current (custom comparator)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skipDuplicates(roundlyEqual)).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [1.1, 1.2, 2, 3, 3.2, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],44:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('skipWhile', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().skipWhile(function() {
        return false;
      })).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.skipWhile(function() {
        return false;
      })).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).skipWhile(function() {
        return false;
      })).toEmit(['<end:current>']);
    });
    it('should handle events (`-> true`)', function() {
      var a;
      a = stream();
      return expect(a.skipWhile(function() {
        return true;
      })).toEmit(['<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
    it('should handle events (`-> false`)', function() {
      var a;
      a = stream();
      return expect(a.skipWhile(function() {
        return false;
      })).toEmit([1, 2, 3, '<end>'], function() {
        return send(a, [1, 2, 3, '<end>']);
      });
    });
    return it('should handle events (`(x) -> x < 3`)', function() {
      var a;
      a = stream();
      return expect(a.skipWhile(function(x) {
        return x < 3;
      })).toEmit([3, 4, 5, '<end>'], function() {
        return send(a, [1, 2, 3, 4, 5, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().skipWhile(function() {
        return false;
      })).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.skipWhile(function() {
        return false;
      })).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).skipWhile(function() {
        return false;
      })).toEmit(['<end:current>']);
    });
    it('should handle events and current (`-> true`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skipWhile(function() {
        return true;
      })).toEmit(['<end>'], function() {
        return send(a, [2, '<end>']);
      });
    });
    it('should handle events and current (`-> false`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skipWhile(function() {
        return false;
      })).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [2, 3, '<end>']);
      });
    });
    return it('should handle events and current (`(x) -> x < 3`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skipWhile(function(x) {
        return x < 3;
      })).toEmit([3, 4, 5, '<end>'], function() {
        return send(a, [2, 3, 4, 5, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],45:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('skip', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().skip(3)).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.skip(3)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).skip(3)).toEmit(['<end:current>']);
    });
    it('should handle events (less than `n`)', function() {
      var a;
      a = stream();
      return expect(a.skip(3)).toEmit(['<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
    it('should handle events (more than `n`)', function() {
      var a;
      a = stream();
      return expect(a.skip(3)).toEmit([4, 5, '<end>'], function() {
        return send(a, [1, 2, 3, 4, 5, '<end>']);
      });
    });
    it('should handle events (n == 0)', function() {
      var a;
      a = stream();
      return expect(a.skip(0)).toEmit([1, 2, 3, '<end>'], function() {
        return send(a, [1, 2, 3, '<end>']);
      });
    });
    return it('should handle events (n == -1)', function() {
      var a;
      a = stream();
      return expect(a.skip(-1)).toEmit([1, 2, 3, '<end>'], function() {
        return send(a, [1, 2, 3, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().skip(3)).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.skip(3)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).skip(3)).toEmit(['<end:current>']);
    });
    it('should handle events and current (less than `n`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skip(3)).toEmit(['<end>'], function() {
        return send(a, [2, '<end>']);
      });
    });
    it('should handle events and current (more than `n`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skip(3)).toEmit([4, 5, '<end>'], function() {
        return send(a, [2, 3, 4, 5, '<end>']);
      });
    });
    it('should handle events and current (n == 0)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skip(0)).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [2, 3, '<end>']);
      });
    });
    return it('should handle events and current (n == -1)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.skip(-1)).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [2, 3, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],46:[function(require,module,exports){
var Kefir, activate, helpers, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, send = helpers.send, activate = helpers.activate;

describe('Stream', function() {
  describe('new', function() {
    it('should create a Stream', function() {
      expect(stream()).toBeStream();
      return expect(new Kefir.Stream()).toBeStream();
    });
    it('should not be ended', function() {
      return expect(stream()).toEmit([]);
    });
    return it('should not be active', function() {
      return expect(stream()).not.toBeActive();
    });
  });
  describe('end', function() {
    it('should end when `end` sent', function() {
      var s;
      s = stream();
      return expect(s).toEmit(['<end>'], function() {
        return send(s, ['<end>']);
      });
    });
    it('should call `end` subscribers', function() {
      var log, s;
      s = stream();
      log = [];
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 1]);
      });
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 2]);
      });
      expect(log).toEqual([]);
      send(s, ['<end>']);
      return expect(log).toEqual([[void 0, false, 1], [void 0, false, 2]]);
    });
    it('should call `end` subscribers on already ended stream', function() {
      var log, s;
      s = stream();
      send(s, ['<end>']);
      log = [];
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 1]);
      });
      s.on('end', function(x, isCurrent) {
        return log.push([x, isCurrent, 2]);
      });
      return expect(log).toEqual([[void 0, true, 1], [void 0, true, 2]]);
    });
    it('should deactivate on end', function() {
      var s;
      s = stream();
      activate(s);
      expect(s).toBeActive();
      send(s, ['<end>']);
      return expect(s).not.toBeActive();
    });
    return it('should stop deliver new values after end', function() {
      var s;
      s = stream();
      return expect(s).toEmit([1, 2, '<end>'], function() {
        return send(s, [1, 2, '<end>', 3]);
      });
    });
  });
  describe('active state', function() {
    it('should activate when first subscriber added (value)', function() {
      var s;
      s = stream();
      s.on('value', function() {});
      return expect(s).toBeActive();
    });
    it('should activate when first subscriber added (end)', function() {
      var s;
      s = stream();
      s.on('end', function() {});
      return expect(s).toBeActive();
    });
    it('should activate when first subscriber added (any)', function() {
      var s;
      s = stream();
      s.on('any', function() {});
      return expect(s).toBeActive();
    });
    return it('should deactivate when all subscribers removed', function() {
      var any1, any2, end1, end2, s, value1, value2;
      s = stream();
      s.on('any', (any1 = function() {}));
      s.on('any', (any2 = function() {}));
      s.on('value', (value1 = function() {}));
      s.on('value', (value2 = function() {}));
      s.on('end', (end1 = function() {}));
      s.on('end', (end2 = function() {}));
      s.off('value', value1);
      s.off('value', value2);
      s.off('any', any1);
      s.off('any', any2);
      s.off('end', end1);
      expect(s).toBeActive();
      s.off('end', end2);
      return expect(s).not.toBeActive();
    });
  });
  describe('subscribers', function() {
    return it('should deliver values', function() {
      var s;
      s = stream();
      return expect(s).toEmit([1, 2], function() {
        return send(s, [1, 2]);
      });
    });
  });
  return describe('listener with context and/or args', function() {
    it('listener should be called with specified context', function() {
      var log, obj, s;
      s = stream();
      log = [];
      obj = {
        name: 'foo',
        getName: function() {
          return log.push(this.name);
        }
      };
      s.on('value', [obj.getName, obj]);
      send(s, [1]);
      return expect(log).toEqual(['foo']);
    });
    it('listener should be called with specified args', function() {
      var log, obj, s;
      s = stream();
      log = [];
      obj = {
        name: 'foo',
        getName: function(a, b, c) {
          return log.push(this.name + a + b + c);
        }
      };
      s.on('value', [obj.getName, obj, 'b', 'a']);
      send(s, ['r']);
      return expect(log).toEqual(['foobar']);
    });
    return it('fn can be passed as string (name of method in context)', function() {
      var log, obj, s;
      s = stream();
      log = [];
      obj = {
        name: 'foo',
        getName: function() {
          return log.push(this.name);
        }
      };
      s.on('value', ['getName', obj]);
      send(s, [1]);
      return expect(log).toEqual(['foo']);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],47:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('takeWhile', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().takeWhile(function() {
        return true;
      })).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.takeWhile(function() {
        return true;
      })).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).takeWhile(function() {
        return true;
      })).toEmit(['<end:current>']);
    });
    it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.takeWhile(function(x) {
        return x < 4;
      })).toEmit([1, 2, 3, '<end>'], function() {
        return send(a, [1, 2, 3, 4, 5, '<end>']);
      });
    });
    it('should handle events (natural end)', function() {
      var a;
      a = stream();
      return expect(a.takeWhile(function(x) {
        return x < 4;
      })).toEmit([1, 2, '<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
    return it('should handle events (with `-> false`)', function() {
      var a;
      a = stream();
      return expect(a.takeWhile(function() {
        return false;
      })).toEmit(['<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().takeWhile(function() {
        return true;
      })).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.takeWhile(function() {
        return true;
      })).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).takeWhile(function() {
        return true;
      })).toEmit(['<end:current>']);
    });
    it('should be ended if calback was `-> false` and source has a current', function() {
      return expect(send(prop(), [1]).takeWhile(function() {
        return false;
      })).toEmit(['<end:current>']);
    });
    it('should handle events', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.takeWhile(function(x) {
        return x < 4;
      })).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [2, 3, 4, 5, '<end>']);
      });
    });
    it('should handle events (natural end)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.takeWhile(function(x) {
        return x < 4;
      })).toEmit([
        {
          current: 1
        }, 2, '<end>'
      ], function() {
        return send(a, [2, '<end>']);
      });
    });
    return it('should handle events (with `-> false`)', function() {
      var a;
      a = prop();
      return expect(a.takeWhile(function() {
        return false;
      })).toEmit(['<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],48:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('take', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().take(3)).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.take(3)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).take(3)).toEmit(['<end:current>']);
    });
    it('should be ended if `n` is 0', function() {
      return expect(stream().take(0)).toEmit(['<end:current>']);
    });
    it('should handle events (less than `n`)', function() {
      var a;
      a = stream();
      return expect(a.take(3)).toEmit([1, 2, '<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
    return it('should handle events (more than `n`)', function() {
      var a;
      a = stream();
      return expect(a.take(3)).toEmit([1, 2, 3, '<end>'], function() {
        return send(a, [1, 2, 3, 4, 5, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().take(3)).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.take(3)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).take(3)).toEmit(['<end:current>']);
    });
    it('should be ended if `n` is 0', function() {
      return expect(prop().take(0)).toEmit(['<end:current>']);
    });
    it('should handle events and current (less than `n`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.take(3)).toEmit([
        {
          current: 1
        }, 2, '<end>'
      ], function() {
        return send(a, [2, '<end>']);
      });
    });
    return it('should handle events and current (more than `n`)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.take(3)).toEmit([
        {
          current: 1
        }, 2, 3, '<end>'
      ], function() {
        return send(a, [2, 3, 4, 5, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],49:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('throttle', function() {
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().throttle(100)).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.throttle(100)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).throttle(100)).toEmit(['<end:current>']);
    });
    it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.throttle(100)).toEmitInTime([[0, 1], [100, 4], [200, 5], [320, 6], [520, 7], [620, 9], [620, '<end>']], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
    it('should handle events {trailing: false}', function() {
      var a;
      a = stream();
      return expect(a.throttle(100, {
        trailing: false
      })).toEmitInTime([[0, 1], [120, 5], [320, 6], [520, 7], [610, '<end>']], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
    it('should handle events {leading: false}', function() {
      var a;
      a = stream();
      return expect(a.throttle(100, {
        leading: false
      })).toEmitInTime([[100, 4], [220, 5], [420, 6], [620, 9], [620, '<end>']], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
    return it('should handle events {leading: false, trailing: false}', function() {
      var a;
      a = stream();
      return expect(a.throttle(100, {
        leading: false,
        trailing: false
      })).toEmitInTime([[120, 5], [320, 6], [520, 7], [610, '<end>']], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().throttle(100)).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.throttle(100)).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(prop(), ['<end>']).throttle(100)).toEmit(['<end:current>']);
    });
    it('should handle events', function() {
      var a;
      a = send(prop(), [0]);
      return expect(a.throttle(100)).toEmitInTime([
        [
          0, {
            current: 0
          }
        ], [0, 1], [100, 4], [200, 5], [320, 6], [520, 7], [620, 9], [620, '<end>']
      ], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
    it('should handle events {trailing: false}', function() {
      var a;
      a = send(prop(), [0]);
      return expect(a.throttle(100, {
        trailing: false
      })).toEmitInTime([
        [
          0, {
            current: 0
          }
        ], [0, 1], [120, 5], [320, 6], [520, 7], [610, '<end>']
      ], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
    it('should handle events {leading: false}', function() {
      var a;
      a = send(prop(), [0]);
      return expect(a.throttle(100, {
        leading: false
      })).toEmitInTime([
        [
          0, {
            current: 0
          }
        ], [100, 4], [220, 5], [420, 6], [620, 9], [620, '<end>']
      ], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
    return it('should handle events {leading: false, trailing: false}', function() {
      var a;
      a = send(prop(), [0]);
      return expect(a.throttle(100, {
        leading: false,
        trailing: false
      })).toEmitInTime([
        [
          0, {
            current: 0
          }
        ], [120, 5], [320, 6], [520, 7], [610, '<end>']
      ], function(tick) {
        send(a, [1]);
        tick(30);
        send(a, [2]);
        tick(30);
        send(a, [3]);
        tick(30);
        send(a, [4]);
        tick(30);
        send(a, [5]);
        tick(200);
        send(a, [6]);
        tick(200);
        send(a, [7]);
        tick(30);
        send(a, [8]);
        tick(30);
        send(a, [9]);
        tick(30);
        return send(a, ['<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],50:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('toProperty', function() {
  describe('stream', function() {
    it('should return property', function() {
      return expect(stream().toProperty()).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.toProperty()).toActivate(a);
    });
    it('should be ended if source was ended', function() {
      return expect(send(stream(), ['<end>']).toProperty()).toEmit(['<end:current>']);
    });
    it('should be ended if source was ended (with current)', function() {
      return expect(send(stream(), ['<end>']).toProperty(0)).toEmit([
        {
          current: 0
        }, '<end:current>'
      ]);
    });
    return it('should handle events', function() {
      var a;
      a = stream();
      return expect(a.toProperty(0)).toEmit([
        {
          current: 0
        }, 1, 2, '<end>'
      ], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
  });
  return describe('property', function() {
    return it('should not have .toProperty method', function() {
      return expect(prop().toProperty).toBe(void 0);
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],51:[function(require,module,exports){
var Kefir, helpers, prop, send, stream;

Kefir = require('kefir');

helpers = require('../test-helpers.coffee');

stream = helpers.stream, prop = helpers.prop, send = helpers.send;

describe('withHandler', function() {
  var duplicate, mirror;
  mirror = function(send, type, x, isCurrent) {
    return send(type, x, isCurrent);
  };
  duplicate = function(send, type, x, isCurrent) {
    send(type, x, isCurrent);
    if (type === 'value' && !isCurrent) {
      return send(type, x);
    }
  };
  describe('stream', function() {
    it('should return stream', function() {
      return expect(stream().withHandler(function() {})).toBeStream();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = stream();
      return expect(a.withHandler(function() {})).toActivate(a);
    });
    it('should not be ended if source was ended (by default)', function() {
      return expect(send(stream(), ['<end>']).withHandler(function() {})).toEmit([]);
    });
    it('should be ended if source was ended (with `mirror` handler)', function() {
      return expect(send(stream(), ['<end>']).withHandler(mirror)).toEmit(['<end:current>']);
    });
    return it('should handle events (with `duplicate` handler)', function() {
      var a;
      a = stream();
      return expect(a.withHandler(duplicate)).toEmit([1, 1, 2, 2, '<end>'], function() {
        return send(a, [1, 2, '<end>']);
      });
    });
  });
  return describe('property', function() {
    it('should return property', function() {
      return expect(prop().withHandler(function() {})).toBeProperty();
    });
    it('should activate/deactivate source', function() {
      var a;
      a = prop();
      return expect(a.withHandler(function() {})).toActivate(a);
    });
    it('should not be ended if source was ended (by default)', function() {
      return expect(send(prop(), ['<end>']).withHandler(function() {})).toEmit([]);
    });
    it('should be ended if source was ended (with `mirror` handler)', function() {
      return expect(send(prop(), ['<end>']).withHandler(mirror)).toEmit(['<end:current>']);
    });
    return it('should handle events and current (with `duplicate` handler)', function() {
      var a;
      a = send(prop(), [1]);
      return expect(a.withHandler(duplicate)).toEmit([
        {
          current: 1
        }, 2, 2, 3, 3, '<end>'
      ], function() {
        return send(a, [2, 3, '<end>']);
      });
    });
  });
});



},{"../test-helpers.coffee":53,"kefir":54}],52:[function(require,module,exports){
var Kefir;

Kefir = require('kefir');

describe('withInterval', function() {
  it('should return stream', function() {
    return expect(Kefir.withInterval(100, function() {})).toBeStream();
  });
  return it('should work as expected', function() {
    var fn, i;
    i = 0;
    fn = function(send) {
      i++;
      send('value', i);
      send('value', i * 2);
      if (i === 3) {
        return send('end');
      }
    };
    return expect(Kefir.withInterval(100, fn)).toEmitInTime([[100, 1], [100, 2], [200, 2], [200, 4], [300, 3], [300, 6], [300, '<end>']]);
  });
});



},{"kefir":54}],53:[function(require,module,exports){
var Kefir, getCurrent, logItem, sinon, _activateHelper,
  __slice = [].slice;

Kefir = require("../dist/kefir");

sinon = require('sinon');

logItem = function(type, x, isCurrent) {
  if (type === 'value') {
    if (isCurrent) {
      return {
        current: x
      };
    } else {
      return x;
    }
  } else {
    if (isCurrent) {
      return '<end:current>';
    } else {
      return '<end>';
    }
  }
};

exports.watch = function(obs) {
  var log;
  log = [];
  obs.on('any', function(type, x, isCurrent) {
    return log.push(logItem(type, x, isCurrent));
  });
  return log;
};

exports.watchWithTime = function(obs) {
  var log, startTime;
  startTime = new Date();
  log = [];
  obs.on('any', function(type, x, isCurrent) {
    return log.push([new Date() - startTime, logItem(type, x, isCurrent)]);
  });
  return log;
};

exports.send = function(obs, events) {
  var event, _i, _len;
  for (_i = 0, _len = events.length; _i < _len; _i++) {
    event = events[_i];
    if (event === '<end>') {
      obs._send('end');
    } else {
      obs._send('value', event);
    }
  }
  return obs;
};

_activateHelper = function() {};

exports.activate = function(obs) {
  obs.on('end', _activateHelper);
  return obs;
};

exports.deactivate = function(obs) {
  obs.off('end', _activateHelper);
  return obs;
};

exports.prop = function(initialValue, ended) {
  var prop;
  prop = new Kefir.Property();
  if (initialValue != null) {
    prop._send('value', initialValue);
  }
  if (ended != null) {
    prop._send('end');
  }
  return prop;
};

exports.stream = function() {
  return new Kefir.Stream();
};

exports.withFakeTime = function(cb) {
  var clock;
  clock = sinon.useFakeTimers(10000);
  cb(function(t) {
    return clock.tick(t);
  });
  return clock.restore();
};

exports.inBrowser = (typeof window !== "undefined" && window !== null) && (typeof document !== "undefined" && document !== null);

exports.withDOM = function(cb) {
  var div;
  div = document.createElement('div');
  document.body.appendChild(div);
  cb(div);
  return document.body.removeChild(div);
};

getCurrent = function(prop) {
  var save, val;
  val = getCurrent.NOTHING;
  save = function(x, isCurrent) {
    if (isCurrent) {
      return val = x;
    }
  };
  prop.on('value', save);
  prop.off('value', save);
  return val;
};

getCurrent.NOTHING = ['<getCurrent.NOTHING>'];

beforeEach(function() {
  return this.addMatchers({
    toBeProperty: function() {
      return this.actual instanceof Kefir.Property;
    },
    toBeStream: function() {
      return this.actual instanceof Kefir.Stream;
    },
    toBeActive: function() {
      return this.actual._active;
    },
    toEmit: function(expectedLog, cb) {
      var log;
      log = exports.watch(this.actual);
      if (typeof cb === "function") {
        cb();
      }
      this.message = function() {
        return "Expected to emit " + (jasmine.pp(expectedLog)) + ", actually emitted " + (jasmine.pp(log));
      };
      return this.env.equals_(expectedLog, log);
    },
    toEmitInTime: function(expectedLog, cb, timeLimit) {
      var log;
      if (timeLimit == null) {
        timeLimit = 100000000000;
      }
      log = null;
      exports.withFakeTime((function(_this) {
        return function(tick) {
          log = exports.watchWithTime(_this.actual);
          if (typeof cb === "function") {
            cb(tick);
          }
          return tick(timeLimit);
        };
      })(this));
      this.message = function() {
        return "Expected to emit " + (jasmine.pp(expectedLog)) + ", actually emitted " + (jasmine.pp(log));
      };
      return this.env.equals_(expectedLog, log);
    },
    toHasNoCurrent: function() {
      return getCurrent(this.actual) === getCurrent.NOTHING;
    },
    toHasCurrent: function(x) {
      return getCurrent(this.actual) === x;
    },
    toHasEqualCurrent: function(x) {
      return this.env.equals_(x, getCurrent(this.actual));
    },
    toActivate: function() {
      var allTrue, condition, conditions, obs, obss, _i, _len;
      obss = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      conditions = [];
      conditions.push.apply(conditions, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = obss.length; _i < _len; _i++) {
          obs = obss[_i];
          _results.push(!obs._active);
        }
        return _results;
      })());
      exports.activate(this.actual);
      conditions.push.apply(conditions, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = obss.length; _i < _len; _i++) {
          obs = obss[_i];
          _results.push(obs._active);
        }
        return _results;
      })());
      exports.deactivate(this.actual);
      conditions.push.apply(conditions, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = obss.length; _i < _len; _i++) {
          obs = obss[_i];
          _results.push(!obs._active);
        }
        return _results;
      })());
      exports.activate(this.actual);
      conditions.push.apply(conditions, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = obss.length; _i < _len; _i++) {
          obs = obss[_i];
          _results.push(obs._active);
        }
        return _results;
      })());
      exports.deactivate(this.actual);
      conditions.push.apply(conditions, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = obss.length; _i < _len; _i++) {
          obs = obss[_i];
          _results.push(!obs._active);
        }
        return _results;
      })());
      allTrue = true;
      for (_i = 0, _len = conditions.length; _i < _len; _i++) {
        condition = conditions[_i];
        allTrue = allTrue && condition;
      }
      this.message = function() {
        var obssString;
        obssString = ((function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = obss.length; _j < _len1; _j++) {
            obs = obss[_j];
            _results.push(obs.toString());
          }
          return _results;
        })()).join(', ');
        return "Expected " + (this.actual.toString()) + " to activate " + obssString + " (results: " + (jasmine.pp(conditions)) + ")";
      };
      return allTrue;
    }
  });
});



},{"../dist/kefir":1,"sinon":6}],54:[function(require,module,exports){
module.exports=require(1)
},{}]},{},[21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52]);