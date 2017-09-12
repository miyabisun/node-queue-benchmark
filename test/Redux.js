const {expect} = require('chai')
const R = require('ramda')
const moment = require('moment')
const {createStore, combineReducers} = require('redux')

describe('Redux: 並列実行テスト', function () {
  this.timeout(0)
  describe('ベンチマーク', () => {
    const num = 1000 * 1000
    const state = {
      count: 0,
      last: 0,
      time: 0
    }
    before((done) => {
      // reduxの準備
      const started = moment()
      const store = createStore((state, action) => {
        switch (action.type) {
          case 'add':
            return action.num
          default:
            return state
        }
      })
      store.subscribe(() => {
        const current = store.getState()
        if (state.last === current) return
        state.last = current
        state.count = state.count + 1
      })
      const to = num => ({type: 'add', num})

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          store.dispatch(to(req))
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
      // reduxの準備
      const started = moment()
      const store = createStore(combineReducers({
        add: (state = 0, action) => action.type === 'add' ? action.num : state,
        remove: (state = 0, action) => action.type === 'remove' ? action.num : state
      }))
      store.subscribe(() => {
        const it = store.getState().add
        if (state.last_add === it) return
        state.last_add = it
        state.requests = R.append(it, state.requests)
      })
      store.subscribe(() => {
        const it = store.getState().remove
        if (state.last_remove === it) return
        state.last_remove = it
        const len = state.requests.length
        state.requests = R.reject(req => it === req, state.requests)
        state.count = state.count + (len - state.requests.length)
      })

      // 並列処理実行
      const asyncGet = req =>
        new Promise(resolve => {
          store.dispatch({type: 'add', num: req})
          store.dispatch({type: 'remove', num: req})
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
