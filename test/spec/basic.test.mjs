import { findLeaks } from '../../src/index.js'
import { expect } from 'chai'
import { asyncIterableToArray } from './util.js'

describe('basic test suite', () => {
  it('can detect a simple leak', async () => {
    const results = await asyncIterableToArray(findLeaks('http://localhost:3000/test/www/basic/', {
      iterations: 3
    }))

    expect(results.length).to.equal(3)
    expect(results.map(_ => ({ href: _.test.data.href }))).to.deep.equal([
      { href: 'about' },
      { href: 'info' },
      { href: 'contact' }
    ])
    expect(results.map(_ => _.result.leaks.detected)).to.deep.equal([true, false, false])

    const deltas = results.map(_ => _.result.deltaPerIteration)
    expect(deltas[0]).to.be.above(1000000)
    expect(deltas[0]).to.be.below(2000000)

    expect(deltas[1]).to.be.above(0)
    expect(deltas[1]).to.be.below(100000)

    expect(deltas[2]).to.be.above(0)
    expect(deltas[2]).to.be.below(100000)

    const leak = results[0].result.leaks.objects.find(_ => _.name === 'SomeBigObject')
    expect(leak.retainedSizeDeltaPerIteration).to.be.above(1000000)
    expect(leak.retainedSizeDeltaPerIteration).to.be.below(2000000)
  })

  it('works with invisible links', async () => {
    const results = await asyncIterableToArray(findLeaks('http://localhost:3000/test/www/invisibleLinks/', {
      iterations: 3
    }))

    expect(results.length).to.equal(3)
    expect(results.map(_ => ({ href: _.test.data.href }))).to.deep.equal([
      { href: 'about' },
      { href: 'info' },
      { href: 'contact' }
    ])
    expect(results.map(_ => _.result.leaks.detected)).to.deep.equal([false, false, false])

    const deltas = results.map(_ => _.result.deltaPerIteration)
    expect(deltas[0]).to.be.above(0)
    expect(deltas[0]).to.be.below(100000)

    expect(deltas[1]).to.be.above(0)
    expect(deltas[1]).to.be.below(100000)

    expect(deltas[2]).to.be.above(0)
    expect(deltas[2]).to.be.below(100000)
  })
})
