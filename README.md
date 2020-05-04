# evqueue

evQueue is an open source job scheduler and queueing engine.

This is the web (react JS) interface to [evQueue core](https://github.com/coldsource/evqueue-core).
It allows you to create workflows (a chain of tasks), schedule tasks and workflows, and monitor everything.

For documentation and download, visit [the official website](http://www.evqueue.net/)!

### Packages

If you are looking for pre-compiled packages, see [our debian repository](https://packagecloud.io/coldsource/evqueue).

### Build

```
$ npm install
$ npm run build
```

Or if you want to continuously watch changes :

```
$ npm run watch
```

### Package for production

```
$ npm install
$ npm run build
$ npm run pack
```

Edit index.html and switch to production configuration in the bottom of the file.
