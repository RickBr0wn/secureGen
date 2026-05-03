import zxcvbn from 'zxcvbn'

export default function generatePassphrase(
  wordCount: number,
  separator: string = '-',
  capitalize: boolean = false,
  addNumbers: boolean = false
): [string, number, string] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const words: string[] = require('../public/words.json') as string[]

  const randomInts = crypto.getRandomValues(new Uint32Array(wordCount))
  const selectedWords = Array.from(randomInts).map(num => words[num % words.length])

  let processedWords = selectedWords
  if (capitalize) {
    processedWords = selectedWords.map(w => w.charAt(0).toUpperCase() + w.slice(1))
  }

  let passphrase = processedWords.join(separator)
  if (addNumbers) {
    const num = crypto.getRandomValues(new Uint32Array(1))[0] % 100
    passphrase += separator + num
  }

  const result = zxcvbn(passphrase)
  const feedback = result.feedback.suggestions.join(' ') || 'Strong passphrase'

  return [passphrase, result.score, feedback]
}

