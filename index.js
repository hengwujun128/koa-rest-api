const Koa = require('koa')
const app = new Koa()
//  this is a middleware
const Router = require('koa-router')
const router = new Router()

const auth = async (context, next) => {
  if (context.url !== '/users') {
    context.throw(401)
  } else {
    // 错误前置
    await next()
  }
}

router.get('/', (context) => {
  context.body = 'this is home page'
})
router.get('/users', auth, (context) => {
  context.body = 'this user list'
})
router.post('/users', auth, (context) => {
  context.body = 'create user'
})
router.get('/users/:id', auth, (context) => {
  // koa-router 中间件context有 params 参数
  context.body = `这是用户:${context.params.id}`
})
//任何中间件都需要用 use 方法,注册到 APP 之中
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3000)
