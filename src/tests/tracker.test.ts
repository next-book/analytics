/**
 * @jest-environment jsdom
 */
import { createTracker } from '../tracker'

it('should throw when trying to create two intances', () => {
  createTracker('first identifier', 'some domain', 'localhost')

  expect(() =>
    createTracker('second identifier', 'some domain', 'localhost')
  ).toThrowError('Tracker instance already exists.')
})
