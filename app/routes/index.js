/* 
批量读取目录文件,注册路由文件
 */

const fs = require('fs')
module.exports = (app) => {
  // 读取当前目录下文件
  fs.readdirSync(__dirname).forEach((file) => {
    if (file === 'index.js') return
    const route = require(`./${file}`)
    // route.routes() 是个实例.app.use().use() 是连写语法
    app.use(route.routes()).use(route.allowedMethods())
  })
}
