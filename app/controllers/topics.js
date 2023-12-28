const topicModel = require('../models/topic')
const usersModel = require('../models/users')
const questionsModel = require('../models/questions')
const { secret } = require('../config')
class TopicsCtl {
  async find(context) {
    const currentPage = Math.max(context.query.currentPage * 1, 1)
    const pageSize = Math.max(context.query.pageSize * 1, 1)
    const startOffset = (currentPage - 1) * pageSize
    context.body = await topicModel
      .find({ name: new RegExp(context.query.q) })
      .limit(pageSize)
      .skip(startOffset)
  }

  async findById(context) {
    const { fields = '' } = context.query
    const selectFields = fields
      .split(';')
      .filter((f) => f)
      .map((f) => '+' + f)
      .join(' ')

    const topic = await topicModel.findById(context.params.id).select(selectFields)
    context.body = topic
  }

  /* 列出topic 下的问题列表 */
  async listQuestions(context) {
    const questions = await questionsModel.find({ topics: context.params.id })
    context.body = questions
  }
  async create(context) {
    context.verifyParams({
      name: { type: 'string', required: true },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false },
    })
    const topic = await new topicModel(context.request.body).save()
    context.body = topic
  }

  async update(context) {
    context.verifyParams({
      name: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false },
    })
    // 注意这是更新前的 topic,如果想返回更新后的 topic 可以合并一下
    const topic = await topicModel.findByIdAndUpdate(context.params.id, context.request.body)
    context.body = topic
  }
  /* 
  topic 被多少用户关注
   */
  async listFollowers(context) {
    // following 是个数组:中应该包含context.params.id,这里不用写包含逻辑
    const users = await usersModel.find({ followingTopics: context.params.id })
    context.body = users
  }
  /* 判断 topic 是否存在
   */

  async checkTopicExist(context, next) {
    const user = await topicModel.findById(context.params.id)
    if (!user) {
      context.throw(404, 'topic不存在')
    }
    await next() // 这里必须要等待下个中间件执行完毕
  }
}
module.exports = new TopicsCtl()
