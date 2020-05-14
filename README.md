# evqueue

evQueue is an open source job scheduler and queueing engine.

This is the web (react JS) interface to [evQueue core](https://github.com/coldsource/evqueue-core).
It allows you to create workflows (a chain of tasks), schedule tasks and workflows, and monitor everything.

For documentation and download, visit [the official website](http://www.evqueue.net/)!

This technical documentation is only needed if you want to contribute to the project. If you just want to use the frontend, you should download [Firefox Addon](https://addons.mozilla.org/fr/firefox/addon/evqueue/) or [pre-built zip files](http://www.evqueue.net/downloads).

### Build

First, install dependencies :

```
$ npm install
```

Then build the project :

```
$ npm run build
```

Or if you want to continuously watch changes :

```
$ npm run watch
```

### Package for production

This will pack :

* Browser extension
* Browser extension source ZIP
* Frontend dist ZIP

```
$ npm install
$ npm run pack
```

You should then find 3 zip files, namely **evqueue-browser-plugin.zip**, **evqueue-browser-plugin-src.zip** and **evqueue.zip**.
