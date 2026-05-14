import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
}

export default createJestConfig(config)
