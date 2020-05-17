const mongoose = require('mongoose')
// mongoose.set('useFindAndModify', false)

/* 
1.先定义scheme,在生成 model
2. scheme 就是 doc 的结构,即 record 
3. 把定义的 scheme 传入到 model内在导出
 */
const { Schema, model } = mongoose // Scheme 是个类
const answerSchema = new Schema({
  //select:false,是为了查询的时候不显示该字段
  __v: { type: Number, select: false },
  content: { type: String, required: true },
  // 提问者,因为一个问题只有一个提问题者,
  answerer: {
    type: Schema.Types.ObjectId,
    ref: 'usersModel',
    required: true,
    select: false, // 列表中不想出现该字段
  },
  // 因为一个 answer 只从属于一个 question
  questionId: {
    type: String,
    required: true,
  },
  // 一个答案的投票数(点赞数)
  voteCount: {
    type: Number,
    required: true,
    default: 0,
  },
})
// 导出的 model 也是个类
module.exports = model('Answer', answerSchema)
