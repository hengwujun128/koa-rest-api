const Router = require('koa-router')
const router = new Router({ prefix: '/users' })
const jsonwebtoken = require('jsonwebtoken')
const { secret } = require('../config')

const {
  find,
  findById,
  create,
  update,
  delete: del,
  login,
} = require('../controllers/users')
/* 
authentication middleware
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

router.get('/', find)
router.post('/', create)
router.delete('/:id', del)
router.patch('/:id', update) // part update
router.get('/:id', findById)
router.post('/login', login)
module.exports = router
