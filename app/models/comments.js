const mongoose = require('mongoose')
// mongoose.set('useFindAndModify', false)

/* 
1.先定义scheme,在生成 model
2. scheme 就是 doc 的结构,即 record 
3. 把定义的 scheme 传入到 model内在导出
 */
const { Schema, model } = mongoose // Scheme 是个类
const commentSchema = new Schema(
  {
    //select:false,是为了查询的时候不显示该字段
    __v: { type: Number, select: false },
    content: { type: String, required: true },
    // commentator 评论者
    commentator: {
      type: Schema.Types.ObjectId,
      ref: 'usersModel',
      required: true,
      select: false, // 列表中不想出现该字段
    },
    // 因为一个 comment 只从属于一个 question
    questionId: {
      type: String,
      required: true,
    },
    // 每个评论 会从属某个答案下的
    answerId: {
      type: String,
      required: true,
    },
    // 区别一级评论和二级评论,不是必选的,因为一级评论没有这个属性
    rootCommentId: {
      type: String,
    },
    //
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'usersModel',
      required: false,
      select: false, // 列表中不想出现该字段
    },
  },
  { timestamps: true },
)
// 导出的 model 也是个类
module.exports = model('Comment', commentSchema)
