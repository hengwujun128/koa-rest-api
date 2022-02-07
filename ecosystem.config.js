module.exports = {
  apps : [{
    script: 'app/index.js',
    watch: './app'
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
