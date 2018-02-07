# hurp

A little framework lets you design your application as a composition of asyncronous modules.

Basically, async module is a class that can be initialized and destroyed asynchronously, e.g. with `async init()` and `async destroy()` methods. Modules can be hierarchical composed. This framework just implements this ideas and provides some kind of a dependency injection over them.

## Installation

```bash
$ npm install hurp
```

## Usage

Library exports classes `Module` and `App`, that designed to be overriden.

```js
const hurp = require('hurp');

class Foo extends hurp.Module {}
class App extends hurp.App {}
```

### Async init and destroy

With `async init()` you can wait for a connection to external service to be established, for some configuration to be loaded, for a listening port to be bound. With `async destroy()` it is possible to wait for a pending requests to be properly handled, for some state to be dumped to some storage.

Modules are initialized and destroyed in hierarchical order, that is described below.

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

Modules can be composed. Just `use()` one module in another one. All the child modules will be initialized before the parent in order they were used. Parent will be destroyed first, and all it children next, in reverse order.

Next example will output this:

```
init foo 1
init foo 2
init bar
...
destroy bar
destroy foo 2
destroy foo 1
```

```js
const hurp = require('hurp');

class Foo extends hurp.Module {
  constructor(options) {
    super();
    
    this.tag = options.tag;
  }
  
  async init() {
    console.log(`init foo ${this.tag}`);
  }
  
  async destroy() {
    console.log(`destroy foo ${this.tag}`);
  }
}

class Bar extends hurp.Module {
  constructor() {
    super();
    
    const one = new Foo({ tag: '1' });
    this.one = this.use(one);
    
    const two = new Foo({ tag: '2' });
    this.two = this.use(two);
  }
  
  async init() {
    // this.one and this.two are already initialized
    // and can be used from here
    
    console.log('init bar');
  }
  
  async destroy() {
    console.log('destroy bar');
    
    // this.one and this.two will be destroyed
    // after this function execution
  }
}
```

### App

Root module in the hierarchy called an App. It holds a reference to itself (described below) and exposes the `async boot()` and `async shutdown()` methods as entry points to the init and destroy chains.

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

### Dependency injection

All the modules has a reference to the app. Reference becomes available in the `async init()` method and can be used as an application-wide context, where all your subsystems are lives.

> Note: init/destroy order makes it easy to listen for requests after the database are initialized, so our data will be accessible. Also, during shutdown server will be closed before the connection to database are closed, so we safely can complete all the pending requests. Just `use()` database before server.

> Of course, real-life http server module will be a bit more complex than in that example.

```js
const http = require('http');
const hurp = require('hurp');

function bootstrap(app) {
  // You can use your favorite web framework right there,
  // just place the app reference in it requests' context
  
  return async (req, res) => {
    // Load some data from database
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
    
    this.bootstrap = options.bootstrap;
    this.server = null;
  }
  
  async init() {
    // Pass the running application reference into some function
    // that initializes your web framework, so you can access the app
    // from request handlers' context
    const handler = this.bootstrap(this.app);
    
    this.server = http.createServer(handler);
    
    await new Promise(resolve => {
      this.server.listen(3000, resolve);
    });
  }
  
  async destroy() {
    await new Promise(resolve => {
      this.server.once('close', resolve);
      this.server.close();
    });
  }
}

class App extends hurp.App {
  constructor() {
    super();
    
    const db = new Database();
    this.db = this.use(db);
    
    const server = new HttpServer({
      bootstrap,
    });
    this.server = this.use(server);
  }
}
```
