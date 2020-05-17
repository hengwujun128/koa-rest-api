// const jsonwebtoken = require('jsonwebtoken') 自己编写中间件需要借助此 jsonwebtoken
const jwt = require('koa-jwt') // 就不需要 jsonwebtoken
const Router = require('koa-router')
const router = new Router({ prefix: '/users' })
const { secret } = require('../config')

const {
  find,
  findById,
  create,
  update,
  delete: del,
  login,
  checkOwner,
  listFollowing,
  listFollowingTopics,
  listFollowers,
  follow,
  unfollow,
  checkUserExist,
  followTopic,
  unfollowTopic,
  listQuestions,
  //赞
  likeAnswer,
  unLikeAnswer,
  listLinkingAnswers,
  // 踩
  disLikeAnswer,
  unDisLikeAnswer,
  listDisLinkingAnswers,
} = require('../controllers/users')
// 引入 topic控制器使用中间件判断 topic 是否存在
const { checkTopicExist } = require('../controllers/topics')
// 引入 answers 控制器,使用中间件判断答案是否存在
const { checkAnswerExist } = require('../controllers/answers')
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
router.post('/', create)
router.delete('/:id', Auth2, checkOwner, del)
router.patch('/:id', Auth2, checkOwner, update) // part update
router.get('/:id', findById)
router.post('/login', login)
router.get('/:id/following', listFollowing) // 某个用户关注,是个嵌套关系,id 是必须的
router.get('/:id/listFollowers', listFollowers) // 某个用户的粉丝列表
// 关注和取消关注的接口一致
router.put('/following/:id', Auth2, checkUserExist, follow) // 关注某人:是向当前登录用户following 属性
router.delete('/following/:id', Auth2, checkUserExist, unfollow) // 取消关注

// 用户关注topic和取消关注 topic
router.put('/followingTopics/:id', Auth2, checkTopicExist, followTopic) // 关注Topic:是向当前登录用户followingTopic 属性添加 某topic id
router.delete('/followingTopics/:id', Auth2, checkTopicExist, unfollowTopic) // 取消关注Topic
// 用户关注的 topics 列表
router.get('/:id/followingTopic', listFollowingTopics) // 某个用户关注,是个嵌套关系,id 是必须的
// 用户的问题列表
router.get('/:id/questions', listQuestions) // 某个用户的粉丝列表

/* 用户赞,取消赞,赞列表 */
/* 赞踩互斥:点赞就取消踩,点踩就取消赞 ,likeAnswer 之前需要unDisLikeAnswer 先执行,因此是个likeAnswer是个中间件*/
router.put(
  '/linkAnswers/:id',
  Auth2,
  checkAnswerExist,
  likeAnswer,
  unDisLikeAnswer
)
router.delete('/linkAnswers/:id', Auth2, checkAnswerExist, unLikeAnswer)
router.get('/:id/linkAnswers', listLinkingAnswers)

/* 用户踩,取消踩,踩列表 */
router.put(
  '/dislinkAnswers/:id',
  Auth2,
  checkAnswerExist,
  disLikeAnswer,
  unLikeAnswer
) /* 赞踩互斥:点赞就取消踩,点擦就取消赞 */
router.delete('/dislinkAnswers/:id', Auth2, checkAnswerExist, unDisLikeAnswer)
router.get('/:id/dislinkAnswers', listDisLinkingAnswers)

module.exports = router
