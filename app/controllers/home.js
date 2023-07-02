/* 
控制器的本质是中间件,中间件的本质是函数

 */
const fsExtra = require('fs-extra')
const fs = require('fs')
const path = require('path')

// const UPLOAD_CHUNKS_DIR = path.join(__dirname, 'public/uploads')
const UPLOAD_CHUNKS_DIR = path.resolve(__dirname, '..', 'public/uploads/chunks') // 注意： public  前面不能有/
const UPLOAD_FILES_DIR = path.resolve(__dirname, '..', 'public/uploads/files')

const streamMergeRecursive = (chunks = [], fileWriteStream, fileHash) => {
  if (!chunks.length) {
    fileWriteStream.end(() => {
      console.log('Stream 合并完成')
      fs.rmdirSync(`${UPLOAD_CHUNKS_DIR}/${fileHash}`)
    })
    // fs.rmdirSync(`${UPLOAD_CHUNKS_DIR}/${fileHash}`)
    return
  }

  const currentFile = path.resolve(
    UPLOAD_CHUNKS_DIR,
    fileHash + '/',
    chunks.shift()
  )
  const currentReadStream = fs.createReadStream(currentFile) // 获取当前的可读流

  currentReadStream.pipe(fileWriteStream, { end: false })
  currentReadStream.on('end', function () {
    streamMergeRecursive(chunks, fileWriteStream, fileHash)
    // delete currentFile
    fs.unlinkSync(currentFile)
  })

  currentReadStream.on('error', function (error) {
    // 监听错误事件，关闭可写流，防止内存泄漏
    console.error(error)
    fileWriteStream.close()
  })
}

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

  // uploadChunk
  async uploadChunk(context) {
    const chunk = context.request.files.chunk
    // console.log('====files:', context.request.files)
    // get fileHash and chuckHash
    const body = context.request.body
    // console.log('====body:', context.request.body)

    const { fileHash, chunkHash, chunk: A } = body
    const chunkIndex = chunkHash.split('-')[1]
    const chunkDir = `${UPLOAD_CHUNKS_DIR}/${fileHash}`
    const chunkPath = `${UPLOAD_CHUNKS_DIR}/${fileHash}/${chunkIndex}`

    if (!fsExtra.existsSync(chunkDir)) {
      await fsExtra.mkdirs(chunkDir)
    }
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

  async mergeChunks1(context) {
    let counter = 0
    const body = context.request.body
    const { fileHash, fileName, chunkSize } = body
    const chunkDir = path.resolve(UPLOAD_CHUNKS_DIR, fileHash)
    // 读取文件夹心所有分片
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

  /**
   * Stream 合并
   * @param { String } sourceFiles 源文件目录名
   * @param { String } targetFile 目标文件
   */
  mergeChunks(context) {
    const body = context.request.body
    const { fileHash, fileName, chunkSize } = body
    const sourceFiles = `${UPLOAD_CHUNKS_DIR}/${fileHash}`
    const targetFile = `${UPLOAD_FILES_DIR}/${fileHash}-${fileName}`

    // const scripts = fs.readdirSync(path.resolve(__dirname, sourceFiles)) // 获取源文件目录下的所有文件
    const chunks = fs.readdirSync(sourceFiles)
    chunks.sort((a, b) => a - b)

    const fileWriteStream = fs.createWriteStream(targetFile)

    streamMergeRecursive(chunks, fileWriteStream, fileHash)
    // todo：
    context.body = {
      status: 200,
      message: 'merge successfully!',
    }
  }
}

module.exports = new HomeCtrl()
