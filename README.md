# hurp

[![npm](https://img.shields.io/npm/v/hurp.svg)](https://www.npmjs.com/package/hurp)

A little framework lets you design your application as a composition of asynchronous modules.

Basically, async module is a class that can be initialized and destroyed asynchronously, e.g. with `async init()` and `async destroy()` methods. Modules can be hierarchically composed. This framework just implements this ideas.

It comes to help when you want to use simple manual dependency injection via constructor in application composed from a set of independent modules, some of which are requires to be asynchronously initialized.

Written in TypeScript, so typings are fully supported.

## Installation

```bash
$ npm install hurp
```

## Usage

Library exports classes `Module` and `App` which are designed to be overridden.

```js
const hurp = require('hurp');

class Foo extends hurp.Module {}
class App extends hurp.App {}
```

### Async Init and Destroy

With `async init()` you can wait for a connection to external service to be established, for some configuration to be loaded, for a listening port to be bound. With `async destroy()` it is possible to wait for a pending requests to be properly handled, for some state to be dumped to some storage.

```js
const hurp = require('hurp');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Foo extends hurp.Module {
  async init() {
    await delay(1000);
    
    console.log('ready to use');
  }
  
  async destroy() {
    await delay(1000);
    
    console.log('destroyed');
  }
}
```

### Composition

Modules can be composed. Just `use()` module in another one. All the child modules will be initialized before the parent in order they were added and destroyed in reverse order after parent. This allows you to group domain-specific parts of large applications.

```js
const hurp = require('hurp');

class Foo extends hurp.Module {}

class Bar extends hurp.Module {
  constructor() {
    super();
    
    const foo = new Foo();
    this.foo = this.use(foo);
  }
}
```

### App

Root module in the hierarchy called an App. It exposes the `async boot()` and `async shutdown()` methods as entry points to the init and destroy chains.

```js
const hurp = require('hurp');

class Foo extends hurp.Module {}

class App extends hurp.App {
  constructor() {
    super();
    
    const foo = new Foo();
    this.foo = this.use(foo);
  }
}

async function main() {
  const app = new App();
  await app.boot();
  
  // Application launched
  
  setTimeout(async () => {
    await app.shutdown();
    
    // Process exit now
  }, 3000);
}

main();
```

### Dependency Injection

Done manually via constructor. No magic. You need to explicitly pass all the module dependencies when creating the instance. This makes things flexible, portable and easy to unit-test.

```js
const hurp = require('hurp');

class Foo extends hurp.Module {
  greet() {
    return 'hello, world';
  }
}

// Module Bar depends on Foo interface
class Bar extends hurp.Module {
  constructor(options) {
    super();
    
    this.foo = options.foo;
  }
  
  hello() {
    const greeting = this.foo.greet();
    console.log(greeting);
  }
}

class App extends hurp.App {
  constructor() {
    super();
    
    const foo = new Foo();
    this.foo = this.use(foo);
    
    const bar = new Bar({
      foo,
    });
    this.bar = this.use(bar);
  }
}

async function main() {
  const app = new App();
  await app.boot();
  
  app.bar.hello();
}

main();
```

### Application Context

Root module becomes the application context. You can access any part of your application where you have an app reference.

```js
const http = require('http');
const hurp = require('hurp');

function bootstrap(app) {
  // Use your favorite web framework here and place the app reference to request context
  
  return async (req, res) => {
    const data = await app.db.get();
    res.end(data);
  };
}

class Database extends hurp.Module {
  async get() {
    return 'foo';
  }
}

class HttpServer extends hurp.Module {
  constructor(options) {
    super();
    
    this.handler = options.handler;
    this.server = http.createServer(this.handler);
  }
  
  async init() {
    await new Promise(resolve => {
      this.server.listen(3000, resolve);
    });
  }
}

class App extends hurp.App {
  constructor() {
    super();
    
    const db = new Database();
    this.db = this.use(db);
    
    const handler = bootstrap(this);
    const server = new HttpServer({
      handler,
    });
    this.server = this.use(server);
  }
}

async function main() {
  const app = new App();
  await app.boot();
}

main();
```

## API

### `Module`

```js
const hurp = require('hurp');

class Foo extends hurp.Module {}

const foo = new Foo();
```

Module base class designed to be overridden. Extends from Node.js EventEmitter class.

#### `constructor()`

You must call `super()` in overridden constructor. Use constructor only to get configuraion and dependencies as arguments and save them to module `this` context. Any initialization should go in `async init()` method.

#### Event: `'init'`

Emitted after the `async init()` is executed.

#### Event: `'destroy'`

Emitted before the `async destroy()` is executed.

#### `traverse(fn)`

Calls the `fn` function on this module and on each child modules recursively.

#### `use(mod)`

Add module `mod` as a child. Returns `mod`. Should be called before the initialization chain of modules tree is executed.

#### `async init()`

Override this function and place any initialization code here.

#### `async destroy()`

Override this function and destroy all the used resources like timers and connections.

### `App`

```js
const hurp = require('hurp');

class App extends hurp.App {}

const app = new App();
```

App base class designed to be overridden and used as root module. Extends from Module class, so all Module methods and events are here.

#### `constructor()`

You must call `super()` in overridden constructor. Use constructor only to get configuraion as arguments and create and `use()` other modules your application built from.

#### Event: `'online'`

Emitted after whole modules tree including App is initialized.

#### Event: `'offline'`

Emitted after whole modules tree including App is destroyed.

#### `async boot()`

Runs the initialization chain of modules tree. Recursively initializes all the modules from children to parent.

#### `async shutdown()`

Runs the destoying chain of modules tree. Recursively destroys all the modules from parent to children.
