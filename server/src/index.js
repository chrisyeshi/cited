import express from 'express'

const app = express()

app.get('/', (req, res) => res.send('Hello, world!'))

app.listen(8001, () => console.log(`Example app listerning on port 8001`))
