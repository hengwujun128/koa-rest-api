const fsExtra = require('fs-extra')
const fs = require('fs')
const path = require('path')

class FileController {
  // const UPLOAD_CHUNKS_DIR = path.join(__dirname, 'public/uploads')
  UPLOAD_CHUNKS_DIR = path.resolve(__dirname, '..', 'public/uploads/chunks') // 注意： public  前面不能有/
  UPLOAD_FILES_DIR = path.resolve(__dirname, '..', 'public/uploads/files')

  index(context) {
    context.body = '<h2>this is file page</h2>'
  }
  // upload single file
  upload(context) {
    const file = context.request.files.file
    const baseName = path.basename(file.path)
    context.body = {
      url: `${context.origin}/uploads/${baseName}`,
    }
  }

  // uploadChunk
  async uploadChunk(context) {
    // NOTE: get chunk
    const chunk = context.request.files.chunk
    // console.log('====files:', context.request.files)
    // get fileHash and chuckHash
    const body = context.request.body
    // console.log('====body:', context.request.body)

    const { fileHash, chunkHash, chunk: A } = body
    const chunkIndex = chunkHash.split('-')[1]
    const chunkDir = `${UPLOAD_CHUNKS_DIR}/${fileHash}`
    const chunkPath = `${UPLOAD_CHUNKS_DIR}/${fileHash}/${chunkIndex}`

    // set chunkDir
    if (!fsExtra.existsSync(chunkDir)) {
      await fsExtra.mkdirs(chunkDir)
    }
    // TODO: remove await lately
    await fsExtra
      .move(chunk.path, path.resolve(chunkDir, chunkIndex), {
        overwrite: true,
      })
      .then(() => {
        console.log('move success', path.resolve(chunkDir, chunkIndex))
        context.body = {
          status: 200,
          message: `upload chunk ---${chunkIndex}--- successfully !`,
        }
      })
      .catch((err) => {
        context.body = {
          status: 0,
          message: 'upload chunks failure !',
        }
      })
    // async function
    // context.body = {
    //   status: 200,
    //   message: 'upload chunks successfully !',
    // }
  }

  // merge chunks
  async mergeChunks(context) {
    let counter = 0
    const body = context.request.body
    const { fileHash, fileName, chunkSize } = body
    // 找到 chunks 所在目录: /public/uploads/chunks/aaaa/0; /public/uploads/chunks/bbb/1;
    const chunkDir = path.resolve(UPLOAD_CHUNKS_DIR, fileHash)
    // 读取chunks 目录下所有分片
    const chunks = await fsExtra.readdir(chunkDir)
    const chunkNumber = chunks.length

    // sort chunks
    chunks.sort((a, b) => a - b)
    chunks.forEach((chunk, index) => {
      const chunkPath = path.resolve(UPLOAD_CHUNKS_DIR, fileHash, chunk)
      // create writeable stream
      const writeableStream = fsExtra.createWriteStream(fileHash + fileName, {
        start: index * chunkSize,
        end: (index + 1) * chunkSize,
      })
      // create readable stream
      const readStream = fsExtra.createReadStream(chunkPath)

      readStream.on('end', () => {
        // delete chunk
        // fsExtra.unlinkSync(chunkPath)
        counter++
        if (counter === chunkNumber) {
          // todo delete chunkDir ,
          // fsExtra.rmdirSync(chunkDir)
          let uploadedFilePath = path.resolve(
            // __dirname,
            // '..',
            fileHash + fileName
          )
          // uploadedFilePath 有问题
          fsExtra.move(
            uploadedFilePath,
            UPLOAD_CHUNKS_DIR + '/' + fileHash + fileName
          )
        }
      })
      readStream.pipe(writeableStream)
    })
    context.body = {
      status: 200,
      message: 'merge successfully!',
    }
  }
}

module.exports = new FileController()
