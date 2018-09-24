# hurp

[![npm](https://img.shields.io/npm/v/hurp.svg?style=flat-square)](https://www.npmjs.com/package/hurp)

A little class lets you design your application as a composition of asynchronous modules.

## Concept

Basically, async module is a class that can be initialized and destroyed asynchronously, e.g. with `async init()` and `async destroy()` methods.

The best example is a http server. It requires to be asynchronously initialized to open a listening port, and to be asynchronously destroyed to close the port and wait for pending requests to be done.

Typical application consist of many modules like http server, database driver, message queue client, business logic models. Some of them requires async initialization or destroying. Some of them depends on the others. We need to start accepting requests after all other modules are ready, and to close a database driver only after all pending requests are done in order to support graceful shutdown.

Hurp is a way to deal with that things.

## Installation

```bash
$ npm install hurp
```

## Usage

You can design your application as a set of independent modules, wiring them together in a single composition root. Modules should depend only on interfaces, implementations gets injected manually in a root class constructor.

Package exports a `Hurp` class. It is a container for async modules. You can add child modules with a `use()` method. Next, when you call its `init()` method, it will sequentially call `init()` method on every child module in that order in which they were added. Its `destroy()` method behaves similarly, but in reverse order.

Because `Hurp` instance has an `async init()` and `async destroy()` method, it is an async module itself. This can be used to build a complex modules tree. But most likely plain root object will be good enough.

So, you can extend the `Hurp` class to make something like `App` class, which will be a composition root of your application. Next, create all the things in its constructor, wire them up and `use()` async modules.

```typescript
import Hurp from 'hurp';
import Foo from './foo';
import Bar from './bar';

export default class App extends Hurp {
  public foo: Foo;
  public bar: Bar;
  
  constructor() {
    super();
    
    const foo = new Foo();
    this.foo = this.use(foo);
    
    const bar = new Bar({ foo });
    this.bar = this.use(bar);
  }
}
```

Now application can be launched with something like this:

```typescript
import App from './app';

async function main() {
  const app = new App();
  
  await app.init();
}

main().catch(err => console.error(`boot failed: ${err.message}`));
```

> Take a look at [hurp-launch](https://github.com/yaroslav-korotaev/hurp-launch) package for a more convenient way to launch hurp-based application

## API

### `Hurp`

```typescript
import Hurp from 'hurp';
```

A class, container for async modules. You may extend it with your composition root implementation.

#### `use<M extends Module>(mod: M): M`

Adds module `mod` to a child module list. Returns `mod`.

#### `async init(): Promise<void>`

Sequentially calls `init()` method on every child module in that order in which they were added.

#### `async destroy(): Promise<void>`

Sequentially calls `destroy()` method on each child module in reverse order to the one in which they were added.
