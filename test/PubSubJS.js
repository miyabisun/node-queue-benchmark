const {expect} = require('chai')
const R = require('ramda')
const moment = require('moment')
const PubSub = require('pubsub-js')

describe('PubSubJS: 並列実行テスト', function () {
  this.timeout(0)
  describe('ベンチマーク', () => {
    const num = 1000 * 1000
    const state = {
      count: 0,
      last: 0,
      time: 0
    }
    before((done) => {
      // PubSubの準備
      const started = moment()
      const subscriber = (msg, current) => {
        state.last = current
        state.count = state.count + 1
      }
      PubSub.subscribe('add', subscriber)

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          PubSub.publish('add', req)
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
      // PubSubの準備
      const started = moment()
      const add_request = (msg, it) => {
        state.requests = R.append(it, state.requests)
      }
      const remove_request = (msg, it) => {
        const len = state.requests.length
        state.requests = R.reject(req => it === req, state.requests)
        state.count = state.count + (len - state.requests.length)
      }

      PubSub.subscribe('add', add_request)
      PubSub.subscribe('remove', remove_request)

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          PubSub.publish('add', req)
          PubSub.publish('remove', req)
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
})
