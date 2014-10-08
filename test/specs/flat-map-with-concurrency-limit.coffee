{stream, prop, send, activate, deactivate, Kefir} = require('../test-helpers.coffee')


describe 'flatMapConcurLimit', ->


  describe 'stream', ->

    it 'should return stream', ->
      expect(stream().flatMapConcurLimit(null, 1)).toBeStream()

    it 'should activate/deactivate source', ->
      a = stream()
      expect(a.flatMapConcurLimit(null, 1)).toActivate(a)

    it 'should be ended if source was ended', ->
      expect(send(stream(), ['<end>']).flatMapConcurLimit(null, 1)).toEmit ['<end:current>']

    it 'should handle events', ->
      a = stream()
      b = stream()
      c = stream()
      d = stream()
      expect(a.flatMapConcurLimit(null, 2)).toEmit [1, 2, 4, 5, 6, '<end>'], ->
        send(b, [0])
        send(a, [b])
        send(b, [1])
        send(a, [c, d, '<end>'])
        send(c, [2])
        send(d, [3])
        send(b, [4, '<end>'])
        send(d, [5, '<end>'])
        send(c, [6, '<end>'])


    it 'should activate sub-sources', ->
      a = stream()
      b = stream()
      c = stream()
      d = stream()
      map = a.flatMapConcurLimit(null, 2)
      activate(map)
      send(a, [b, c, d])
      deactivate(map)
      expect(map).toActivate(b, c)
      expect(map).not.toActivate(d)
      send(b, ['<end>'])
      expect(map).toActivate(d)


    it 'should accept optional map fn', ->
      a = stream()
      b = stream()
      expect(
        a.flatMapConcurLimit ((x) -> x.obs), 1
      ).toEmit [1, 2, '<end>'], ->
        send(b, [0])
        send(a, [{obs: b}, '<end>'])
        send(b, [1, 2, '<end>'])

    it 'should correctly handle current values of sub sources on activation', ->
      a = stream()
      b = send(prop(), [1])
      c = send(prop(), [2])
      d = send(prop(), [3])
      m = a.flatMapConcurLimit(null, 2)
      activate(m)
      send(a, [b, c, d])
      deactivate(m)
      expect(m).toEmit [{current: 1}, {current: 2}]

    it 'should correctly handle current values of new sub sources', ->
      a = stream()
      b = send(prop(), [1, '<end>'])
      c = send(prop(), [2])
      d = send(prop(), [3])
      e = send(prop(), [4])
      expect(a.flatMapConcurLimit(null, 2)).toEmit [4, 1, 2], ->
        send(a, [e, b, c, d])







  describe 'property', ->

    it 'should return stream', ->
      expect(prop().flatMapConcurLimit(null, 1)).toBeStream()

    it 'should activate/deactivate source', ->
      a = prop()
      expect(a.flatMapConcurLimit(null, 1)).toActivate(a)

    it 'should be ended if source was ended', ->
      expect(send(prop(), ['<end>']).flatMapConcurLimit(null, 1)).toEmit ['<end:current>']

    it 'should be ended if source was ended (with value)', ->
      expect(
        send(prop(), [send(prop(), [0, '<end>']), '<end>']).flatMapConcurLimit(null, 1)
      ).toEmit [{current: 0}, '<end:current>']

    it 'should correctly handle current value of source', ->
      a = send(prop(), [0])
      b = send(prop(), [a])
      expect(b.flatMapConcurLimit(null, 1)).toEmit [{current: 0}]


