const mongoose = require('mongoose')
// mongoose.set('useFindAndModify', false)

/* 
1.先定义scheme,在生成 model
2. scheme 就是 doc 的结构,即 record 
3. 把定义的 scheme 传入到 model内在导出
 */

const { Schema, model } = mongoose // Scheme 是个类

const user = new Schema({
  //select:false,是为了查询的时候不显示该字段
  __v: { type: Number, select: false },
  name: { type: String, required: true },
  password: { type: String, required: true, select: true },
  age: { type: Number, default: 22 },
  avatar_url: { type: String },
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: 'male',
    required: true,
  },
  headline: { type: String },
  // locations: { type: [{ type: String }] }, // ['xx','xxx']字符串数组
  locations: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    select: false,
  },
  business: { type: Schema.Types.ObjectId, ref: 'Topic' },
  employments: {
    // [{company:'xx',job:'xx'}] object Array
    type: [
      {
        company: { type: Schema.Types.ObjectId, ref: 'Topic' },
        job: { type: Schema.Types.ObjectId, ref: 'Topic' },
      },
    ],
    select: false,
  },
  educations: {
    type: [
      {
        school: { type: Schema.Types.ObjectId, ref: 'Topic' },
        major: { type: Schema.Types.ObjectId, ref: 'Topic' },
        diploma: { type: Number, enum: [1, 2, 3, 4, 5] },
        entrance_year: { type: Number },
        graduation_year: { type: Number },
      },
    ],
    select: false,
  },
  // 存储用户的关注 id 列表,ref:代表 model 的引用,这里是usersModel
  // 即通过单独的用户id,就能引用这个 id 所在的 schema
  following: {
    type: [{ type: Schema.Types.ObjectId, ref: 'usersModel' }],
    select: false,
  },
  followingTopics: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    select: false,
  },
})
// 导出的 model 也是个类
module.exports = model('usersModel', user)
