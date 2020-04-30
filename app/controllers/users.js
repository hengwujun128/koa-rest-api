const usersModel = require('../models/users')
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
    const user = await usersModel
      .findById(context.params.id)
      .select(selectFields)
      .populate(populateStr)
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
    const user = await usersModel.findByIdAndUpdate(
      context.params.id,
      context.request.body
    )
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
    const user = await usersModel
      .findById(context.params.id)
      .select('+following')
      .populate('following')
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
    const me = await usersModel
      .findById(context.state.user._id)
      .select('+following')
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
    const me = await usersModel
      .findById(context.state.user._id)
      .select('+following')
    // 获取 要取消用户的索引
    const index = me.following
      .map((id) => id.toString())
      .indexOf(context.params.id)
    if (index > -1) {
      me.following.splice(index, 1)
      me.save() // 注意:取消关注之后还要保存到数据库
    }
    context.status = 204
  }

  async checkUserExist(context, next) {
    const user = await usersModel.findById(context.params.id)
    if (!user) {
      context.throw(404, '用户不存在')
    }
    await next() // 这里必须要等待下个中间件执行完毕
  }
}
module.exports = new UsersCtl()
