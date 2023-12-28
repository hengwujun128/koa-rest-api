const commentModel = require('../models/comments')
const usersModel = require('../models/users')
const { secret } = require('../config')
class CommentsCtl {
  /* 搜索答案列表:是根据 specific questionId 进行搜索答案,而不是搜索所有的答案,这个要理清楚 */
  /* 搜索comments列表:是根据 specific questionId 和answerId 进行搜索评论,而不是搜索所有的评论,这个要理清楚 */
  /* 接口不仅可以显示一级评论,还可以显示二级评论;用一个参数 rootComment来确定是否显示二级评论 */
  async find(context) {
    const currentPage = Math.max(context.query.currentPage * 1, 1)
    const pageSize = Math.max(context.query.pageSize * 1, 1)
    const startOffset = (currentPage - 1) * pageSize
    // content 是否满足某个关键字
    const q = new RegExp(context.query.q)
    const { questionId, answerId } = context.params
    // 是否显示二级评论,可选
    const rootCommentId = context.query.rootCommentId
    //这里和 answerer 不同的是,需要返回commentator 的头像,不仅仅是 Id,所以使用 populate
    context.body = await commentModel
      .find({
        content: q,
        questionId: context.params.questionId,
        rootCommentId,
      })
      .limit(pageSize)
      .skip(startOffset)
      .populate('commentator replyTo')
  }
  /* Comment 详情:因为使用了引用,所以需要 populate() */
  async findById(context) {
    const { fields = '' } = context.query
    const selectFields = fields
      .split(';')
      .filter((f) => f)
      .map((f) => '+' + f)
      .join(' ')
    //这里写死了commentator ,只引用评论者相关信息
    const Comment = await commentModel.findById(context.params.id).select(selectFields).populate('commentator')
    context.body = Comment
  }
  /* create Comment:
    创建 answer 和 question 有点区别 ,需要 questionId
    创建 comment 和 answer 又有点区别,不仅需要questionId,还需要 answerId
   */
  async create(context) {
    //创建一级评论,只传 comment;创建二级评论只需多传递 2 个参数
    context.verifyParams({
      content: { type: 'string', required: true },
      rootCommentId: { type: 'string', required: false },
      replyTo: { type: 'string', required: false },
    })
    const { questionId, answerId } = context.params
    const commentator = context.state.user._id
    const Comment = await new commentModel({
      ...context.request.body,
      commentator,
      questionId,
      answerId,
    }).save()
    context.body = Comment
  }
  /* update Comment
   1. 这里有个优化点:更新时候使用了 findById 查询了 modal
   2. update 依赖上个中间件 findById,可以使用中间件中结果进行判断,不需要 findByIdAndUpdate()
   3. 评论的更新 只能是评论的人才能更新
  */
  async update(context) {
    context.verifyParams({
      content: { type: 'string', required: false },
    })
    // 注意这是更新前的 Comment,如果想返回更新后的 Comment 可以合并一下
    // const Comment = await commentModel.findByIdAndUpdate(
    //   context.params.id,
    //   context.request.body
    // )
    //注意:一个二级评论 如果是属于一个一级评论,则不能更改,不能改外一级评论,因此只允许更改 content 属性
    const { content } = context.request.body
    await context.state.Comment.update({ content })
    context.body = context.state.Comment
  }
  /* 检查回答者:主要是用在更改和删除,当前登录人不评论者的没有权利  */
  async checkCommentator(context, next) {
    const { Comment } = context.state
    if (Comment.commentator.toString() !== context.state.user._id) {
      context.throw(403, '没有权限')
    }
    await next()
  }

  /* 
    delete Comment
   */
  async delete(context) {
    await commentModel.findByIdAndRemove(context.params.id)
    context.status = 204
  }
  /* 判断 Comment 是否存在和判断 question 是否存在有些区别
    还要判断,当前Comment的所在的 questionId 是否和传入的 questionId 是否匹配,因为一个Comment只能属于一个 question
    同理要判断当前 comment 的 answerId 是否和传入的是否一致
   */
  async checkCommentExist(context, next) {
    // 要把提答案加上
    const Comment = await commentModel.findById(context.params.id).select('+commentator')
    if (!Comment) {
      context.throw(404, '评论不存在')
    }
    // context.params.questionId: 参数中有 questionId ,即只有在删,改,查答案才进行判断,赞和踩不检查
    if (context.params.questionId && Comment.questionId.toString() !== context.params.questionId) {
      context.throw(404, '该问题下没有此评论')
    }
    if (context.params.answerId && Comment.answerId.toString() !== context.params.answerId) {
      context.throw(404, '该答案下没有此评论')
    }
    context.state.Comment = Comment // 存入 Comment 到 state
    await next() // 这里必须要等待下个中间件执行完毕
  }
}
module.exports = new CommentsCtl()
