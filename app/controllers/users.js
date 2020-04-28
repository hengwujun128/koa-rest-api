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
    const user = await usersModel.findById(context.params.id)
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
}
module.exports = new UsersCtl()
