export function copy(text) {
  navigator.clipboard.writeText(text)
}

export function randomInteger(min, max, exc = []) {
  let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
  if (exc.includes(randomNumber)) {
    randomNumber = randomInteger(min, max, exc)
  }
  return randomNumber
}
