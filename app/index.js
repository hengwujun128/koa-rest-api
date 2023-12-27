const Koa = require('koa')
const app = new Koa()
//  this is a middleware
const Router = require('koa-router')
const router = new Router()

const routes = require('./routes')

// const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')
const Parameter = require('koa-parameter')
const cors = require('koa2-cors')
const path = require('path')

// 静态资源
const koaStatic = require('koa-static')
const Error = require('koa-json-error')

// const mongoose = require('mongoose')
// const { connectionStr } = require('./config')
// mongoose.connect(
//   connectionStr,
//   {
//     connectTimeoutMS: 2000,
//     useNewUrlParser: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   },
//   () => {
//     console.log('connect  mongoDb succeed')
//   }
// )
// mongoose.connection.on('error', console.error)

//任何中间件都需要用 use 方法,注册到 APP 之中

/* 
自定义捕捉错误的中间件:捕捉自定义错误,捕捉运行时错误
 */
// app.use(async (context, next) => {
//   try {
//     // 先执行后面的中间件,在捕获里面的错误
//     await next()
//   } catch (err) {
//     context.status = err.status || err.statusCode || 500
//     context.body = {
//       message: err.message,
//     }
//   }
// })


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
    multipart: true, //  Parse multipart bodies, default false
    formidable: { // Options to pass to the formidable multipart parser
      uploadDir: path.join(__dirname, '/public/uploads'), //Sets the directory for placing file uploads in
      keepExtensions: true, // 保留扩展名
    },
  })
)

app.use(
  cors({
    origin: function (ctx) {
      if (ctx.url === '/test') {
        return false
      }
      return '*'
    },
    maxAge: 120,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'User-Client'],
  })
)

// add cors

// 不仅仅是个中间件,可以在上下文中添加方法
app.use(Parameter(app))
routes(app)
app.listen(process.env.PORT, () => {
  console.log(`应用在 ${process.env.PORT} 端口启动成功...`)
})
