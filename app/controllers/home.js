/* 
控制器的本质是中间件,中间件的本质是函数

 */
const path = require('path')
class HomeCtrl {
  index(context) {
    context.body = '<h2>this is home page</h2>'
  }

  upload(context) {
    const file = context.request.files.file
    const baseName = path.basename(file.path)
    context.body = {
      url: `${context.origin}/uploads/${baseName}`,
    }
  }
}

module.exports = new HomeCtrl()
