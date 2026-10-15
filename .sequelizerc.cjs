const path = require('path');

module.exports = {
  'config': path.resolve('src', 'db', 'config.js'),
  'models-path': path.resolve('src', 'db', 'models'),
<<<<<<< HEAD
  'seeders-path': path.resolve('src', 'db', 'seeders'),
  'migrations-path': path.resolve('src', 'db', 'migrations'),
=======
  'migrations-path': path.resolve('src', 'db', 'migrations'),
  'seeders-path': path.resolve('src', 'db', 'seeders')
>>>>>>> upstream/main
}
