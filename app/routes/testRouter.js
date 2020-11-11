const express = require('express')
const router = new express.Router()

router.post('/testPost', (req, res) => {
    console.log('[TEST] Server has recieved the test post request')
    res.send('Hello from the server')
})

router.get('/testPost', (req, res) => {
    console.log('[TEST] Server has recieved the test get request')
    res.send('Hello from the server')
})

module.exports = router