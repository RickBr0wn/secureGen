import zxcvbn from 'zxcvbn'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const words: string[] = require('../public/words.json') as string[]

export default function generatePassphrase(
  wordCount: number,
  separator: string = '-',
  capitalize: boolean = false,
  addNumbers: boolean = false
): [string, number, string] {
  const randomInts = crypto.getRandomValues(new Uint32Array(wordCount))
  const selectedWords: string[] = []
  for (let i = 0; i < randomInts.length; i++) {
    const word = words[randomInts[i] % words.length]
    selectedWords.push(capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word)
  }

  let passphrase = selectedWords.join(separator)
  if (addNumbers) {
    const num = crypto.getRandomValues(new Uint32Array(1))[0] % 100
    passphrase += separator + num
  }

  const result = zxcvbn(passphrase)
  const crackTime = String(result.crack_times_display.offline_slow_hashing_1e4_per_second)

  return [passphrase, result.score, crackTime]
}
