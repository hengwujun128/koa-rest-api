const Koa = require('koa')
const app = new Koa()
//  this is a middleware
const router = require('koa-router')
router.get('/', (context) => {
  context.body = 'this is home page'
})

//任何中间件都需要用 use 方法,注册到 APP 之中
app.use(router.routes())
app.listen(3000)
