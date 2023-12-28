const usersModel = require('../models/users')
const questionModel = require('../models/questions')
// 引入答案模型: 因为在点赞和取消时候,需要更新答案模型的投票数
const answerModel = require('../models/answers')

const jsonwebtoken = require('jsonwebtoken')
const { secret } = require('../config')
class UsersCtl {
  async find(context) {
    const userList = await usersModel.find()
    context.body = userList
  }
  async findById(context) {
    // koa-router 中间件context有 params 参数
    const { fields = '' } = context.query
    const selectFields = fields
      ? fields
          .split(';')
          .filter((f) => f)
          .map((f) => '+' + f)
          .join(' ')
      : ''
    // populate 方法显示类型引用的完整对象,populate 也需要动态生成
    let populateStr = fields
      .split(';')
      .filter((f) => f)
      .map((f) => {
        if (f === 'employments') {
          return 'employments.company employments.job'
        }
        if (f === 'educations') {
          return 'educations.school educations.major'
        }
        return f
      })
      .join(' ')
    const user = await usersModel.findById(context.params.id).select(selectFields).populate(populateStr)
    if (!user) context.throw(404, '用户不存在')
    context.body = user
  }
  async create(context) {
    //
    context.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
      age: { type: 'number', required: false },
    })
    const { name } = context.request.body
    const isRegistered = await usersModel.findOne({ name })
    if (isRegistered) {
      context.throw(409, '用户名已存在!')
    }
    const user = await new usersModel(context.request.body).save()

    context.body = user
  }
  async update(context) {
    // 先校验
    context.verifyParams({
      name: { type: 'string', required: false },
      password: { type: 'string', required: false },
      age: { type: 'number', required: false },
      avatar_url: { type: 'string', required: false },
      gender: { type: 'string', required: false },
      headline: { type: 'string', required: false },
      locations: { type: 'array', itemType: 'string', required: false },
      business: { type: 'string', required: false },
      employments: { type: 'array', itemType: 'object', required: false },
      educations: { type: 'array', itemType: 'object', required: false },
    })
    // console.log(context.request.body)
    const user = await usersModel.findByIdAndUpdate(context.params.id, context.request.body)
    //id 判断
    if (!user) {
      context.throw(404, '用户不存在')
    }
    context.body = user
  }
  async delete(context) {
    const user = await usersModel.findByIdAndRemove(context.params.id)
    if (!user) {
      context.throw(404, '用户不存在')
    }
    context.status = 204
  }

  async login(context) {
    // 先校验 必填
    context.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
    })
    // 校验 合法性
    const user = await usersModel.findOne(context.request.body)
    if (!user) {
      context.throw(401, '用户名密码不正确')
    }
    let { _id, name } = user
    // 生成 token :jsonwebtoken:使用秘钥对用户名进行签名,生成 token
    let token = jsonwebtoken.sign({ _id, name }, secret, { expiresIn: '1d' })
    context.body = { token }
  }
  /* 用户授权 */
  async checkOwner(context, next) {
    if (context.params.id !== context.state.user._id) {
      context.throw(403, '没有该操作权限')
    }
    await next()
  }
  /* 查询某个用户的关注列表
    1:根据用户 id 获取用户的 following属性:是个数组,数组中元素是用户 id
    2.populate() 返回的也是数组,但是元素是个用户对象 
   */
  async listFollowing(context) {
    const user = await usersModel.findById(context.params.id).select('+following').populate('following')
    if (!user) {
      context.throw(404)
    } else {
      //
      context.body = user.following
    }
  }

  /* 
    查询某个用户的粉丝列表
   */
  async listFollowers(context) {
    // following 是个数组:中应该包含context.params.id,这里不用写包含逻辑
    const users = await usersModel.find({ following: context.params.id })
    context.body = users
  }
  /* 
  关注某人
   */
  async follow(context) {
    const me = await usersModel.findById(context.state.user._id).select('+following')
    // following 是 mongo 自带的数据类型,这里需要批量转成字符串

    if (!me.following.map((id) => id.toString()).includes(context.params.id)) {
      me.following.push(context.params.id)
      me.save() // 注意:添加关注之后还要保存到数据库
    }
    context.status = 204
  }

  /* 
  取消关注
   */
  async unfollow(context) {
    const me = await usersModel.findById(context.state.user._id).select('+following')
    // 获取 要取消用户的索引
    const index = me.following.map((id) => id.toString()).indexOf(context.params.id)
    if (index > -1) {
      me.following.splice(index, 1)
      me.save() // 注意:取消关注之后还要保存到数据库
    }
    context.status = 204
  }

  // ---------------------------用户关注 Topic和取消 Topic start----------------------
  /* 
  关注 Topic
   */
  async followTopic(context) {
    const me = await usersModel.findById(context.state.user._id).select('+followingTopics')
    // following 是 mongo 自带的数据类型,这里需要批量转成字符串

    if (!me.followingTopics.map((id) => id.toString()).includes(context.params.id)) {
      me.followingTopics.push(context.params.id)
      me.save() // 注意:添加关注之后还要保存到数据库
    }
    context.status = 204
  }

  /* 
  取消关注 Topic
   */
  async unfollowTopic(context) {
    const me = await usersModel.findById(context.state.user._id).select('+followingTopics')
    // 获取 要取消用户的索引
    const index = me.followingTopics.map((id) => id.toString()).indexOf(context.params.id)
    if (index > -1) {
      me.followingTopics.splice(index, 1)
      me.save() // 注意:取消关注之后还要保存到数据库
    }
    context.status = 204
  }
  /*
  获取用户关注的 topics
   */
  async listFollowingTopics(context) {
    const user = await usersModel.findById(context.params.id).select('+followingTopics').populate('followingTopics')
    if (!user) {
      context.throw(404, '用户不存在')
    } else {
      //
      context.body = user.followingTopics
    }
  }
  // ---------------------------用户关注 Topic和取消 Topic end------------------------
  // --------------------------用户点赞和取消点赞逻辑 start----------------------------------
  /*
   * 用户点赞:点赞之后还要修改答案的投票数
   */
  async likeAnswer(context, next) {
    const me = await usersModel.findById(context.state.user._id).select('+likingAnswers')
    // following 是 mongo 自带的数据类型,这里需要批量转成字符串
    // 判断用户点赞属性列表中是否有某个答案,没有就 push 进去
    if (!me.likingAnswers.map((id) => id.toString()).includes(context.params.id)) {
      me.likingAnswers.push(context.params.id)
      me.save() // 注意:添加点赞 之后还要保存到数据库
      // 修改答案的投票数+1,mongoose 中为某个属性值+-1,increment
      await answerModel.findByIdAndUpdate(context.params.id, {
        $inc: { voteCount: 1 },
      })
    }
    context.status = 204
    await next()
  }

  /*
   * 用户取消点赞:首先也是获取用户的点赞列表
   */
  async unLikeAnswer(context) {
    const me = await usersModel.findById(context.state.user._id).select('+likingAnswers')
    // 获取 要取消用户的索引
    const index = me.likingAnswers.map((id) => id.toString()).indexOf(context.params.id)

    if (index > -1) {
      me.likingAnswers.splice(index, 1)
      me.save() // 注意:取消关注之后还要保存到数据库
      // 更新某个答案的点赞数
      await answerModel.findByIdAndUpdate(context.params.id, {
        $inc: { voteCount: -1 },
      })
    }
    context.status = 204
  }
  /*
   * 获取用户点赞列表:因为是引用,想拿到具体信息,所以需要 populate一下
   */
  async listLinkingAnswers(context) {
    const user = await usersModel.findById(context.params.id).select('+likingAnswers').populate('likingAnswers')
    if (!user) {
      context.throw(404, '用户不存在')
    } else {
      // 用户点赞列表
      context.body = user.likingAnswers
    }
  }
  // --------------------------用户点赞和取消点赞逻辑 end------------------------------------

  // --------------------------用户踩和取消踩逻辑 start----------------------------------
  /*
   * 用户踩:
   */
  async disLikeAnswer(context, next) {
    const me = await usersModel.findById(context.state.user._id).select('+disLikingAnswers')
    // following 是 mongo 自带的数据类型,这里需要批量转成字符串
    // 判断用户点赞属性列表中是否有某个答案,没有就 push 进去
    if (!me.disLikingAnswers.map((id) => id.toString()).includes(context.params.id)) {
      me.disLikingAnswers.push(context.params.id)
      me.save() // 注意:添加点赞 之后还要保存到数据库
    }
    context.status = 204
    await next()
  }

  /*
   * 用户取消点踩:首先也是获取用户的踩列表
   */
  async unDisLikeAnswer(context) {
    const me = await usersModel.findById(context.state.user._id).select('+disLikingAnswers')
    // 获取 要取消用户的索引
    const index = me.disLikingAnswers.map((id) => id.toString()).indexOf(context.params.id)

    if (index > -1) {
      me.disLikingAnswers.splice(index, 1)
      me.save() // 注意:取消关注之后还要保存到数据库
    }
    context.status = 204
  }
  /*
   * 获取用户踩列表:因为是引用,想拿到具体信息,所以需要 populate一下
   */
  async listDisLinkingAnswers(context) {
    const user = await usersModel.findById(context.params.id).select('+disLikingAnswers').populate('disLikingAnswers')
    if (!user) {
      context.throw(404, '用户不存在')
    } else {
      // 用户踩列表
      context.body = user.disLikingAnswers
    }
  }
  // --------------------------用户踩和取消踩逻辑 end------------------------------------
  // --------------------------用户收藏答案和取消收藏答案列表  start----------------------------
  /*
   * 用户收藏答案:指当前登录用户收藏某个答案
   * router.put('/collectingAnswers/:id', Auth2, checkAnswerExist, collectAnswer)
   */
  async collectAnswer(context, next) {
    const me = await usersModel.findById(context.state.user._id).select('+collectingAnswers')
    // following 是 mongo 自带的数据类型,这里需要批量转成字符串
    // 判断用户点赞属性列表中是否有某个答案,没有就 push 进去
    if (!me.collectingAnswers.map((id) => id.toString()).includes(context.params.id)) {
      me.collectingAnswers.push(context.params.id)
      me.save()
    }
    context.status = 204
    await next()
  }

  /*
   * 用户取消收藏答案:同样是当前登录用户取消收藏答案
   router.delete('/collectingAnswers/:id',Auth2,checkAnswerExist,unCollectAnswer)
   */
  async unCollectAnswer(context) {
    const me = await usersModel.findById(context.state.user._id).select('+collectingAnswers')
    // 获取 要取消用户的索引
    const index = me.collectingAnswers.map((id) => id.toString()).indexOf(context.params.id)

    if (index > -1) {
      me.collectingAnswers.splice(index, 1)
      me.save() // 注意:取消关注之后还要保存到数据库
    }
    context.status = 204
  }
  /*
   * 获取用户收藏答案列表:因为是引用,想拿到具体信息,所以需要 populate一下
   * 注意:用户搜藏答案列表是某个用户,不是当前登录用户,因此要传递用户 Id
   * router.get('/:id/collectingAnswers', listDisLinkingAnswers)
   */
  async listCollectingAnswers(context) {
    const user = await usersModel.findById(context.params.id).select('+collectingAnswers').populate('collectingAnswers')
    if (!user) {
      context.throw(404, '用户不存在')
    } else {
      // 用户搜藏答案列表
      context.body = user.collectingAnswers
    }
  }
  // --------------------------用户收藏答案和取消收藏答案列表  end------------------------------

  async checkUserExist(context, next) {
    const user = await usersModel.findById(context.params.id)
    if (!user) {
      context.throw(404, '用户不存在')
    }
    await next() // 这里必须要等待下个中间件执行完毕
  }
  async listQuestions(context) {
    const questions = await questionModel.find({
      questioner: context.params.id,
    })
    context.body = questions
  }
}
module.exports = new UsersCtl()
