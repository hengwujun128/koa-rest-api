module.exports = {
  apps : [{
    name: "myAPI",
    script: 'app/index.js',
    watch: 'true', // Restart on file change
    watch_delay: 1000,
    // Specify which folder to ignore 
    ignore_watch : ["node_modules"],
    instances: 2,
    exec_mode: "cluster",
    increment_var : 'PORT', // PM2 will see that i want to increment the PORT variable for each instance;The first instance will have process.env.PORT = 3000 and the second process.env.PORT = 3001
    // default environment
    env: {
      "PORT": 3333, // 这里不能是 3000,因为源代码里面是使用的是 3000
      "NODE_ENV": "development"
    },
    // to use env_production by using pm2 start ecosystem.config.js --env production.
    env_production: {
      "PORT": 4000,
      "NODE_ENV": "production",
    }
  }],

  deploy : {
    production : {
      // key : "/path/to/some.pem", // path to the public key to authenticate
      user : 'ubuntu',
      host : '119.29.68.169',
      ref  : 'origin/master',
      repo : 'git@github.com:hengwujun128/koa-rest-api.git',
      path : '/home/ubuntu/www/api/koa-rest-api',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
