

const fs = require('fs')
const path = require('path')
const UPLOAD_FILES_DIR = path.resolve(__dirname, '..', 'public/uploads/files')


class DownloadsCtrl {
  index(context) {
    context.body = '<h2>this is DownloadsCtrl</h2>'
  }

  async download(context) {
    const file = await fs.readFile(`${UPLOAD_FILES_DIR}/test.mp4`, 'utf-8');
    ctx.set({
      'Content-Disposition': `attachment; filename=test.mp4`,
    });
    ctx.body = file;
  }

}


module.exports = new DownloadsCtrl()