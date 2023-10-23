// import { createApi } from 'unsplash-js'
const { createApi } = require('unsplash-js')
// import nodeFetch from 'node-fetch'
const nodeFetch = require('node-fetch')

// on your node server
// const serverApi = createApi({
//   accessKey: 'R8u67PrD85zedWNl3SK82Na8FXoaMOqHHNnYT36sWnw',
//   apiUrl: 'https://mywebsite.com/unsplash-proxy',
// })

class TestController {
  constructor() {
    this.request = createApi({
      // fetch: nodeFetch,
      accessKey: 'R8u67PrD85zedWNl3SK82Na8FXoaMOqHHNnYT36sWnw',
      apiUrl: 'https://mywebsite.com/unsplash-proxy',
    })
  }
  index(context) {
    context.body = '<h2>this is test page</h2>'
  }

  async search(context) {
    const request = createApi({
      fetch: nodeFetch,
      accessKey: 'R8u67PrD85zedWNl3SK82Na8FXoaMOqHHNnYT36sWnw',
    })
    // console.log(request)
    const res = await request.search.getPhotos({
      query: 'cat',
      page: 1,
      perPage: 10,
      orderBy: 'latest',
    })
    context.body = res
  }
}

module.exports = new TestController()
