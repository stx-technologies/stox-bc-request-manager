const httpInstance = {
  async get(){
    return Promise.resolve({})
  }
}

module.exports = {
  http() {
    return httpInstance
  }
}