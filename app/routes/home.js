const Router = require('koa-router')
const router = new Router({
  prefix:'/home'
})


const {
  index,
  upload,
  uploadChunk,
  mergeChunks,
} = require('../controllers/home')

router.get('/', index)
router.post('/upload', upload)
router.post('/uploadChunk', uploadChunk)
router.post('/mergeChunks', mergeChunks)

module.exports = router
