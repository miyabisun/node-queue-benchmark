# Overview

Node.js上で複数サーバで同じ状態を参照する必要が出てきたので、  
Observerパターンの比較調査を実施した。

- スコープの頭に`state.count = 0`を用意
- 各種Observerパターンで簡易的なStoreを用意
- Promiseで用意した100万件の非同期関数を(ほぼ)同時実行
- 各々の非同期関数は20ms待ってからstore.dispatchで値の変更要求を飛ばす
- リスナーが値の変更を検知して`state.count = state.count + 1`を実行
- Promiseが全ての処理を終了した後、state.countが100万であることを確認する

# Installation

```Bash
$ git clone https://github.com/miyabisun/redux-speed-test.git

$ cd node-queue-benchmark

$ npm install -D
```

# Usage

```Bash
$ npm test -s


  MicroEvent2: 並列実行テスト
    ベンチマーク
      ✓ state.count is 1,000,000
{ count: 1000000, last: 1000000, time: '1,624' }
      ✓ state to log
    リクエスト整合性
      ✓ state.count is 1,000,000
{ count: 1000000, requests: [], time: '2,217' }
      ✓ state to log


  4 passing (4s)
```

# Summary

下記のライブラリでテストを実施  
上位スコープにて定義した配列に対して非同期実行で100万件のリクエストの作成→削除を繰り返す。  
結果から言えば、試した全てのライブラリで正常に作成→削除の流れが完了した。

この条件下での各ライブラリの処理時間は以下の通り

- [EventEmitter(Native)](https://nodejs.org/api/events.html): 2068ms -> 2049ms -> 2031ms (AVG: 2049ms)
- [MicroEvent2](https://www.npmjs.com/package/microevent2): 2255ms -> 2263ms -> 2217ms (AVG: 2245ms)
- [PubSubJS](https://www.npmjs.com/package/pubsub-js): 3745ms -> 3721ms -> 3710ms (AVG: 3725ms)
- [Redux](https://www.npmjs.com/package/redux): 6445ms -> 6387ms -> 6462ms (AVG: 6431ms)
- [MobX](https://mobx.js.org/): 4345ms -> 4177ms -> 4407ms (AVG: 4309ms)

やってる事が少ないネイティブのイベントと、MicroEventが高速で安定している。  
Node.jsでやる以上、書き方がほぼ同じで少々速度が落ち込むMicroEvent2を使用する意義があまり見いだせない結果になった。

PubSubJSはドットで区切ったフィールド内でブロードキャスト的に複数のリスナーを実行出来る機能の秀逸さが便利そうだ。  
その処理の代償なのかパフォーマンスはネイティブと比較してそれなりに落ち込んでいる。  
複雑なサーバーを構築する場合は真っ先に考慮に上がるかもしれない。

Reduxは1つのReducer, Listenerに限れば他のライブラリに負けない程の速度を出すが、  
2つのリスナーを含めた時点で他のライブラリと比較して2倍程の処理時間になってしまっている。  
値を更新する度に全てのReducer, Listenerが走り始める設計がパフォーマンスに影響しているのだろうか。

MobXは記述量が極端に少なく表現力がありパワフル。  
処理を増やした時のパフォーマンスへのダメージもRedux程ではなく、  
PubSubJSで手に負えない規模のシステムを構築していく場合はこれ一択になりそうだ。
