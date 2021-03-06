const {expect} = require('chai')
const R = require('ramda')
const moment = require('moment')
const MicroEvent = require('microevent2')

describe('MicroEvent2: 並列実行テスト', function () {
  this.timeout(0)
  describe('ベンチマーク', () => {
    const num = 1000 * 1000
    const state = {
      count: 0,
      last: 0,
      time: 0
    }
    before((done) => {
      // MicroEvent2の準備
      const started = moment()
      const store = new MicroEvent()
      const subscriber = (current) => {
        state.last = current
        state.count = state.count + 1
      }
      store.on('add', subscriber)

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          store.emit('add', req)
          resolve(`${req}の結果`)
        })
      const promise = R.pipe(
        R.range(1),
        R.map(asyncGet),
        R.bind(Promise.all, Promise),
        it => it.then(() => {
          state.time = Math.abs(started.diff(moment())).toLocaleString()
          done()
        })
      )(num + 1)
    })
    it(`state.count is ${num.toLocaleString()}`, () =>
      expect(state.count).to.equal(num)
    )
    it('state to log', () => {
      console.log(state)
    })
  })
  describe('リクエスト整合性', () => {
    const num = 1000 * 1000
    const state = {
      count: 0,
      requests: [],
      time: 0
    }
    before((done) => {
      // EventEmitterの準備
      const started = moment()
      const store = new MicroEvent()
      const add_request = (it, cb) => {
        state.requests = R.append(it, state.requests)
        cb()
      }
      const remove_request = (it, cb) => {
        const len = state.requests.length
        state.requests = R.reject(req => it === req, state.requests)
        state.count = state.count + (len - state.requests.length)
        cb()
      }
      store.on('add', add_request)
      store.on('remove', remove_request)

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve =>
          store.emit('add', req, () =>
            store.emit('remove', req, () =>
              resolve(req)
            )
          )
        )
      const promise = R.pipe(
        R.range(1),
        R.map(asyncGet),
        R.bind(Promise.all, Promise),
        it => it.then(() => {
          state.time = Math.abs(started.diff(moment())).toLocaleString()
          done()
        })
      )(num + 1)
    })
    it(`state.count is ${num.toLocaleString()}`, () =>
      expect(state.count).to.equal(num)
    )
    it('state to log', () => {
      console.log(state)
    })
  })
})
