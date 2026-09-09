/**
 * Loads a picked file into an `<img>` through an object URL rather than a base64 data URL: encoding a
 * multi-megabyte photo to base64 just to decode it again would double the memory and CPU spent on a step
 * whose only job is to hand the bytes to an `Image`, which matters most on the low-end phones taking the
 * photo. Shared by every place that needs to read a picture onto a canvas (avatar crop, fursona reference,
 * finished designs).
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    })
    image.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('The picture could not be read'))
    })
    image.src = objectUrl
  })
}

export type ResizeOptions = { maxSide: number; quality?: number; type?: string }

/**
 * Scales a picture down to fit within `maxSide` on its longest edge, without cropping. Used for pictures
 * where the whole frame matters (a fursona reference photo, a finished design), unlike the square avatar
 * crop which deliberately loses the edges.
 */
export async function toResizedDataUrl(file: File, { maxSide, quality = 0.85, type = 'image/jpeg' }: ResizeOptions): Promise<string> {
  const image = await loadImageFromFile(file)
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot resize the picture')

  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL(type, quality)
}
