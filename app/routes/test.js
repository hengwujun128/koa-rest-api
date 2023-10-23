const Router = require('koa-router')
const router = new Router({ prefix: '/test' })

const { index, search } = require('../controllers/test')

router.get('/', index)
router.get('/search', search)

module.exports = router
