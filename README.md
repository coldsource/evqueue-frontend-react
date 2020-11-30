# evqueue

evQueue is an open source job scheduler and queueing engine.

This is the web (react JS) interface to [evQueue core](https://github.com/coldsource/evqueue-core).
It allows you to create workflows (a chain of tasks), schedule tasks and workflows, and monitor everything.

For documentation and download, visit [the official website](http://www.evqueue.net/)!

This technical documentation is only needed if you want to contribute to the project. If you just want to use the frontend, you should download [Firefox](https://addons.mozilla.org/fr/firefox/addon/evqueue/) / [Chrome](https://chrome.google.com/webstore/detail/evqueue/ioioafegonjmpfegmccmoaehhgddimij) extensions or [pre-built zip files](http://www.evqueue.net/downloads).

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

### Configure

If needed, edit configuration file in **htdocs/conf/cluster.json**.

You can now access interface using default account : admin / admin.

### Package for production

Dependency : zip command

```
$ apt-get install zip
```

This will pack :

* Browser extension
* Browser extension source ZIP
* Frontend dist ZIP

```
$ npm install
$ npm run pack
```

You should then find 3 zip files, namely **evqueue-browser-plugin.zip**, **evqueue-browser-plugin-src.zip** and **evqueue.zip**.
