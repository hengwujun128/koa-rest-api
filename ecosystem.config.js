module.exports = {
  // multiple apps
  apps: [
    {
      name: 'myAPI',
      script: 'app/index.js', // pm2 monit
      watch: 'true', // Restart on file change
      watch_delay: 1000,
      // Specify which folder to ignore
      ignore_watch: ['node_modules'],
      instances: 2,
      exec_mode: 'cluster',
      increment_var: 'PORT', // PM2 will see that i want to increment the PORT variable for each instance;The first instance will have process.env.PORT = 3000 and the second process.env.PORT = 3001
      // default environment
      env: {
        PORT: 3000, // 这里不能是 3000,因为源代码里面是使用的是 3000
        NODE_ENV: 'development',
      },
      // NOTE: to use env_production by using pm2 start ecosystem.config.js --env production.
      env_production: {
        PORT: 4000,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'myJob',
      script: 'job/index.js',
      watch: 'true', // Restart on file change
      ignore_watch: ['node_modules'],
      instances: 1,
      increment_var: 'PORT', // PM2 will see that i want to increment the PORT variable for each instance;The first instance will have process.env.PORT = 3000 and the second process.env.PORT = 3001
      env: {
        PORT: 3100,
        NODE_ENV: 'development',
      },
      // NOTE: to use env_production by using pm2 start ecosystem.config.js --env production.
      env_production: {
        PORT: 4100,
        NODE_ENV: 'production',
      },
    },
  ],
  // Deployment Configuration
  deploy: {
    development: {},
    production: {
      key: '/Users/martin/.ssh/TecentCloud.pem', // path to the public key to authenticate
      user: 'ubuntu',
      host: ['119.29.68.169'], // 可以发布到多台机器
      ref: 'origin/master',
      repo: 'git@github.com:hengwujun128/koa-rest-api.git',

      path: '/home/ubuntu/www/api/koa-rest-api',
      // Deployment Lifecycle
      /* ---------------------------------- setup --------------------------------- */
      'pre-setup': "echo 'commands or local script path to be run on the host before the setup process starts'",
      'post-setup': "echo 'commands or a script path to be run on the host after cloning the repo'",
      /* --------------------------------- deploy --------------------------------- */
      'pre-deploy': 'echo pre-deploy hook ...',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
    },
  },
}
