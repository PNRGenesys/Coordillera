import { describe, expect, it } from 'vitest'
import { squareCrop } from './avatar'

describe('squareCrop', () => {
  it('takes the whole picture when it is already square', () => {
    expect(squareCrop(400, 400)).toEqual({ sourceX: 0, sourceY: 0, side: 400 })
  })

  it('trims the sides of a landscape picture and keeps the centre', () => {
    expect(squareCrop(800, 400)).toEqual({ sourceX: 200, sourceY: 0, side: 400 })
  })

  it('trims top and bottom of a portrait picture', () => {
    expect(squareCrop(400, 900)).toEqual({ sourceX: 0, sourceY: 250, side: 400 })
  })
})
