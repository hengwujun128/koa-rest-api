const topicModel = require('../models/topic')
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

    const topic = await topicModel
      .findById(context.params.id)
      .select(selectFields)
    context.body = topic
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
    const topic = await topicModel.findByIdAndUpdate(
      context.params.id,
      context.request.body
    )
    context.body = topic
  }
}
module.exports = new TopicsCtl()
