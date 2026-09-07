/** Side of the square the picture is reduced to before it travels to the API. */
export const AVATAR_SIZE = 256

/** Quality of the JPEG the canvas produces; enough for a small round picture. */
const AVATAR_QUALITY = 0.82

const AVATAR_TYPE = 'image/jpeg'

export type CropBox = { sourceX: number; sourceY: number; side: number }

/**
 * Largest centred square that fits in the picture. Cropping before scaling keeps the face in the middle
 * instead of squashing a rectangular photo into a square.
 */
export function squareCrop(width: number, height: number): CropBox {
  const side = Math.min(width, height)
  return { sourceX: (width - side) / 2, sourceY: (height - side) / 2, side }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('The picture could not be read')))
    image.src = source
  })
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(new Error('The file could not be read')))
    reader.readAsDataURL(file)
  })
}

/**
 * Turns the file the customer picked into a small square data URL. The API stores the text as it
 * arrives, so shrinking here is what keeps a phone photo of several megabytes out of the database.
 */
export async function toAvatarDataUrl(file: File): Promise<string> {
  const image = await loadImage(await readFile(file))
  const crop = squareCrop(image.naturalWidth, image.naturalHeight)

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot resize the picture')

  context.drawImage(image, crop.sourceX, crop.sourceY, crop.side, crop.side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  return canvas.toDataURL(AVATAR_TYPE, AVATAR_QUALITY)
}
