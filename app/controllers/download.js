

const fsExtra = require('fs-extra')

const path = require('path')

const UPLOAD_FILES_DIR = path.resolve(__dirname, '..', 'public/uploads/files')


class DownloadsCtrl {

  index(context) {
    context.body = '<h2>this is DownloadsCtrl</h2>'
  }



  
  async download(context) {
    const file = await fsExtra.readFile(`${UPLOAD_FILES_DIR}/test.mp4`, 'utf8')
    context.set({
        'Content-Disposition': `attachment; filename=test.mp4`,
      });
    context.body = file;
  }

}




module.exports = new DownloadsCtrl()