const Koa = require('koa')
const app = new Koa()
//  this is a middleware
const Router = require('koa-router')
const router = new Router()

const routes = require('./routes')

// const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')
const Parameter = require('koa-parameter')
const path = require('path')

// 静态资源
const koaStatic = require('koa-static')
const Error = require('koa-json-error')

//任何中间件都需要用 use 方法,注册到 APP 之中

app.use(koaStatic(path.join(__dirname, 'public')))
app.use(
  Error({
    // e,原生的错误信息,使用解构语法解构中间件的 参数对象,提取stack,和剩余参数
    postFormat: (e, { stack, ...rest }) => {
      // 生产环境 不显示 stack,
      return process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
    },
  })
)
// app.use(bodyParser())
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, '/public/uploads'),
      keepExtensions: true, // 保留扩展名
    },
  })
)
// 不仅仅是个中间件,可以在上下文中添加方法
app.use(Parameter(app))
routes(app)
app.listen(process.env.PORT, () => {
  console.log(`应用在 ${process.env.PORT} 端口启动成功...`)
})
