const Router = require('koa-router')
const router = new Router({ prefix: '/downloads' })


const { index,download} = require('../controllers/downloads')

router.get('/', index)
router.post('/sampleDownload', download)






module.exports = router
