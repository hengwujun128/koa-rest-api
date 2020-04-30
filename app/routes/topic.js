// const jsonwebtoken = require('jsonwebtoken') 自己编写中间件需要借助此 jsonwebtoken
const jwt = require('koa-jwt') // 就不需要 jsonwebtoken
const Router = require('koa-router')
const router = new Router({ prefix: '/topics' })
const { secret } = require('../config')

const { find, findById, create, update } = require('../controllers/topics')
/* 
authentication middleware:自己定义的中间件
1. 获取客户端 token
2. 使用 verify 进行 token 校验
3.
 */
const auth = async (context, next) => {
  // 注意 header 把所有的头信息都变成小写
  const { authorization = '' } = context.request.header
  const token = authorization.replace('Bearer ', '')
  try {
    // 如果认证失败,统一 401,不想抛出其他错误
    const user = jsonwebtoken.verify(token, secret)
    // 如果认证成功,就把用户信息保存起来,给他中间件使用
    context.state.user = user
  } catch (error) {
    context.throw(401, error.message)
  }
  // 执行后面的中间件
  await next()
}

/*
使用 jwt 中间 替换自定义 auth 中间件
 */

const Auth2 = jwt({ secret })

router.get('/', find)
router.post('/', Auth2, create)
router.get('/:id', findById)

router.patch('/:id', Auth2, update) // part update

module.exports = router
