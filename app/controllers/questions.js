const QuestionModel = require('../models/questions')
const usersModel = require('../models/users')
const { secret } = require('../config')
class QuestionsCtl {
  /* 搜索 */
  async find(context) {
    const currentPage = Math.max(context.query.currentPage * 1, 1)
    const pageSize = Math.max(context.query.pageSize * 1, 1)
    const startOffset = (currentPage - 1) * pageSize
    // 搜索 title 或者 description
    const q = new RegExp(context.query.q)
    context.body = await QuestionModel.find({ title: q, description: q })
      .limit(pageSize)
      .skip(startOffset)
  }
  /* question 详情:因为使用了引用,所以需要 populate() */
  async findById(context) {
    const { fields = '' } = context.query
    const selectFields = fields
      .split(';')
      .filter((f) => f)
      .map((f) => '+' + f)
      .join(' ')

    const Question = await QuestionModel.findById(context.params.id)
      .select(selectFields)
      .populate('questioner topics')
    context.body = Question
  }
  /* create question */
  async create(context) {
    context.verifyParams({
      title: { type: 'string', required: true },
      description: { type: 'string', required: false },
    })
    const Question = await new QuestionModel({
      ...context.request.body,
      questioner: context.state.user._id,
    }).save()
    context.body = Question
  }
  /* update question 
   1. 这里有个优化点:更新时候使用了 findById 查询了 modal
   2. update 依赖上个中间件 findById,可以使用中间件中结果进行判断,不需要 findByIdAndUpdate()
   3. 问题的更新 只用提出问题的人才能更新
  */
  async update(context) {
    context.verifyParams({
      title: { type: 'string', required: false },
      description: { type: 'string', required: false },
    })
    // 注意这是更新前的 Question,如果想返回更新后的 Question 可以合并一下
    // const Question = await QuestionModel.findByIdAndUpdate(
    //   context.params.id,
    //   context.request.body
    // )
    await context.state.question.update(context.request.body)
    context.body = context.state.question
  }
  async checkQuestioner(context, next) {
    const { question } = context.state
    if (question.questioner.toString() !== context.state.user._id) {
      context.throw(403, '没有权限')
    }
    await next()
  }

  /* 
    delete question
   */
  async delete(context) {
    await QuestionModel.findByIdAndRemove(context.params.id)
    context.status = 204
  }
  /* 判断 question 是否存在
   */
  async checkQuestionExist(context, next) {
    // 要把提问题加上
    const question = await QuestionModel.findById(context.params.id).select(
      '+questioner'
    )
    if (!question) {
      context.throw(404, '问题不存在')
    }
    context.state.question = question // 存入 question 到 state
    await next() // 这里必须要等待下个中间件执行完毕
  }
}
module.exports = new QuestionsCtl()
