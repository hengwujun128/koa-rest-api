const Router = require('koa-router')
const router = new Router({ prefix: '/downloads' })

const { index, download } = require('../controllers/download')

router.get('/', index)
router.get('/sampleDownload', download)

module.exports = router
