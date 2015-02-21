# node-vagrant
Node js wrapper for vagrant CLI - command line tool.

This is light wrapper around vagrant CLI.
It uses spawn process, and every command requiring user input
such as init and destroy is created with switch --force or -f

Installation
===

```
npm install node-vagrant --save
```

Usage
===

Import node-vagrant
```
var vagrant = require('node-vagrant');
```

Example
===

Example script of a usage is in example/example.js

```
npm run example
```

TODO
===
- reload
- multi-machine
- more detail vagrant file settings
    - firewall
    - networking
- boxing
- provisoning
