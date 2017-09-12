const {expect} = require('chai')
const R = require('ramda')
const moment = require('moment')
const {observable, autorun, reaction} = require('mobx')

describe('MobX: 並列実行テスト', function () {
  this.timeout(0)
  describe('ベンチマーク', () => {
    const num = 1000 * 1000
    const state = {
      count: 0,
      last: 0,
      time: 0
    }
    before((done) => {
      // MobXの準備
      const started = moment()
      const store = observable({
        num: 0
      })
      reaction(
        () => store.num,
        () => {
          if (store.num === 0) return
          state.last = store.num
          state.count = state.count + 1
        }
      )

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          store.num = req
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
    before(done => {
      // MobXの準備
      const started = moment()
      const store = observable({
        add: 0,
        remove: 0
      })
      reaction(
        () => store.add,
        () => {
          it === store.add
          if (it === 0) return
          state.requests = R.append(it, state.requests)
        }
      )
      reaction(
        () => store.remove,
        () => {
          it === store.remove
          if (it === 0) return
          const len = state.requests.length
          state.requests = R.reject(req => it === req, state.requests)
          state.count = state.count + (len - state.requests.length)
        }
      )

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          store.add = req
          store.remove = req
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
