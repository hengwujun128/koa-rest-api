const mongoose = require('mongoose')
// mongoose.set('useFindAndModify', false)

/* 
1.先定义scheme,在生成 model
2. scheme 就是 doc 的结构,即 record 
3. 把定义的 scheme 传入到 model内在导出
 */

const { Schema, model } = mongoose // Scheme 是个类

const topic = new Schema(
  {
    //select:false,是为了查询的时候不显示该字段
    __v: { type: Number, select: false },
    name: { type: String, required: true },
    avatar_url: { type: String },
    introduction: { type: String, select: false },
  },
  { timestamps: true },
)
// 导出的 model 也是个类
module.exports = model('Topic', topic)
