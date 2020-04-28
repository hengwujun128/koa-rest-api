/* 
控制器的本质是中间件,中间件的本质是函数

 */

class HomeCtrl {
  index(context) {
    context.body = '<h2>this is home page</h2>'
  }
}

module.exports = new HomeCtrl()
