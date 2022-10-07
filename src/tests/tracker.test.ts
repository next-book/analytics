/**
 * @jest-environment jsdom
 */
import 'jest-location-mock'
import { jest } from '@jest/globals'
import Tracker from '../tracker'

it('should return undefined when tracker is not initiated', () => {
  expect(Tracker.send('clicked')).toBeUndefined()
})

describe('tracker initiated', () => {
  beforeAll(() => {
    Tracker.init('some identifier', 'some domain', 'localhost/api')
  })

  it('should return zero when initiated with localhost', () => {
    window.location.assign('localhost')
    expect(Tracker.send('test')).toBe(0)
  })

  it('should create XMLHttpRequest', () => {
    window.location.assign('http://example.com/some/url')
    Object.defineProperty(document, 'URL', {
      writable: true,
      configurable: true,
      value: 'http://example.com/some/url',
    })
    const mockXHR: Partial<XMLHttpRequest> = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
    }
    jest
      .spyOn(window, 'XMLHttpRequest')
      .mockImplementation(() => mockXHR as XMLHttpRequest)
    Tracker.send('test')
    expect(mockXHR.open).toBeCalledWith(
      'GET',
      expect.stringMatching(
        /localhost\/api\/collect\?v=\d\.\d\.\d&c=\w+\.\w+\.\w+&u=http%3A%2F%2Fexample\.com%2Fsome%2Furl&d=some\+domain&p=%2F&b=some\+identifier&w=1024&en=test/
      )
    )
  })
})
