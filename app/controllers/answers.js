const answerModal = require('../models/answers')
const usersModel = require('../models/users')
const { secret } = require('../config')
class AnswersCtl {
  /* 搜索答案列表:是根据 specific questionId 进行搜索答案,而不是搜索所有的答案,这个要理清楚 */
  async find(context) {
    const currentPage = Math.max(context.query.currentPage * 1, 1)
    const pageSize = Math.max(context.query.pageSize * 1, 1)
    const startOffset = (currentPage - 1) * pageSize
    // content 是否满足某个关键字
    const q = new RegExp(context.query.q)
    context.body = await answerModal
      .find({ content: q, questionId: context.params.questionId })
      .limit(pageSize)
      .skip(startOffset)
  }
  /* Answer 详情:因为使用了引用,所以需要 populate() */
  async findById(context) {
    const { fields = '' } = context.query
    const selectFields = fields
      .split(';')
      .filter((f) => f)
      .map((f) => '+' + f)
      .join(' ')

    const Answer = await answerModal
      .findById(context.params.id)
      .select(selectFields)
      .populate('answerer')
    context.body = Answer
  }
  /* create Answer:
    创建 answer 和 question 有点区别 ,需要 questionId
   */
  async create(context) {
    context.verifyParams({
      content: { type: 'string', required: true },
    })
    const Answer = await new answerModal({
      ...context.request.body,
      answerer: context.state.user._id,
      questionId: context.params.questionId,
    }).save()
    context.body = Answer
  }
  /* update Answer 
   1. 这里有个优化点:更新时候使用了 findById 查询了 modal
   2. update 依赖上个中间件 findById,可以使用中间件中结果进行判断,不需要 findByIdAndUpdate()
   3. 答案的更新 只能是回答的人才能更新
  */
  async update(context) {
    context.verifyParams({
      content: { type: 'string', required: false },
    })
    // 注意这是更新前的 Answer,如果想返回更新后的 Answer 可以合并一下
    // const Answer = await answerModal.findByIdAndUpdate(
    //   context.params.id,
    //   context.request.body
    // )
    await context.state.Answer.update(context.request.body)
    context.body = context.state.Answer
  }
  /* 检查回答者:主要是用在更改和删除,当前登录人不是回答者的没有权利  */
  async checkAnswerer(context, next) {
    const { Answer } = context.state
    if (Answer.Answerer.toString() !== context.state.user._id) {
      context.throw(403, '没有权限')
    }
    await next()
  }

  /* 
    delete Answer
   */
  async delete(context) {
    await answerModal.findByIdAndRemove(context.params.id)
    context.status = 204
  }
  /* 判断 Answer 是否存在和判断 question 是否存在有些区别
    还要判断,当前答案的所在的 questionId 是否和传入的 questionId 是否匹配,因为一个答案只能属于一个 question
   */
  async checkAnswerExist(context, next) {
    // 要把提答案加上
    const Answer = await answerModal
      .findById(context.params.id)
      .select('+Answerer')
    if (!Answer) {
      context.throw(404, '答案不存在')
    }
    // context.params.questionId: 参数中有 questionId ,即只有在删,改,查答案才进行判断,赞和踩不检查
    if (
      context.params.questionId &&
      Answer.questionId !== context.params.questionId
    ) {
      context.throw(404, '该问题下没有此答案')
    }
    context.state.Answer = Answer // 存入 Answer 到 state
    await next() // 这里必须要等待下个中间件执行完毕
  }
}
module.exports = new AnswersCtl()
