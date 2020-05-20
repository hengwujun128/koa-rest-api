const mongoose = require('mongoose')
// mongoose.set('useFindAndModify', false)

/* 
1.先定义scheme,在生成 model
2. scheme 就是 doc 的结构,即 record 
3. 把定义的 scheme 传入到 model内在导出
 */
const { Schema, model } = mongoose // Scheme 是个类
const questionSchema = new Schema(
  {
    //select:false,是为了查询的时候不显示该字段
    __v: { type: Number, select: false },
    title: { type: String, required: true },
    description: { type: String },
    // 提问者,因为一个问题只有一个提问题者,
    questioner: {
      type: Schema.Types.ObjectId,
      ref: 'usersModel',
      required: true,
      select: false, // 列表中不想出现该字段
    },
    topics: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
      select: false, // 不期望在列表中显示 topics 信息,动态选择
    },
  },
  { timestamps: true }
)
// 导出的 model 也是个类
module.exports = model('Question', questionSchema)
