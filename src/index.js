'use strict'
let express = require('express')
const morgan = require('morgan')
const jsau_utils = require('jsau-utils')
let bodyParser = require('body-parser')
let fs = require('fs')
let nunjucks = require('nunjucks')
const fsPromises = fs.promises
let app = express()

app.use(bodyParser.json())
app.use(morgan('dev'))
let server = app.listen(2828)

nunjucks.configure(['resources/views/'], {
    autoescape: true,
    express: app
})

app.get('/info', (request, response) => {
    response.status(200)
    response.send('jsau-webserver-1.0.0')
})

app.get('/', (request, response) => {
    response.render('index.html', {categories: jsau_utils.categories})
})

app.get('/news/:id', (request, response) => {
    let name = 'data/' + request.params.id + '.json'
    fs.readFile(name, 'utf8', (err, data) => {
        if (err) {
            response.status(404).end()
        } else {
            response.status(200).json(JSON.parse(data))
        }
    })
})

app.get('/news', (request, response) => {
    let dir_path = 'data/'
    const readF = (filenames) => {
        return Promise.all(
            filenames.map((f) => fsPromises.readFile(dir_path + f, 'utf8').then((res) => {
                res = JSON.parse(res)
                res.id = f.split('.')[0]
                return res
            }))
        )
    }
    fs.readdir(dir_path, (err, files) => {
        if (err) {
            response.status(404).end()
        }
        readF(files)
            .then((res) => {
                response.status(200).json(res)
            })
    })
})

app.post('/news(/:id)?', (request, response) => {
    fsPromises.readdir('data/', (err, files) => {
    }).then((res) => {
        let name = (request.params.id) ? request.params.id : (res[res.length - 1]) ? (parseInt(res[res.length - 1].split('.')[0]) + 1) : 1
        let data = request.body
        data.id = name
        if (jsau_utils.validate(data)) {
            data = JSON.stringify(request.body)
            name = 'data/' + name + '.json'
            fs.writeFile(name, data, (err) => {
                if (err) {
                    response.status(409)
                } else {
                    response.status(201)
                }
            })
        } else {
            response.status(409)
        }
        response.send()
    })
})

app.put('/news/:id', (request, response) => {
    let name = 'data/' + request.params.id + '.json'
    let updated_data = request.body
    fs.readFile(name, (err, data) => {
        if (err) {
            response.status(409)
        } else {
            let file_data = JSON.parse(data)
            for (let key in updated_data) {
                for (let kkey in file_data) {
                    if (kkey == key) {
                        file_data[key] = updated_data[key]
                    }
                }
            }
            file_data = JSON.stringify(file_data)
            fs.writeFile(name, file_data, (err) => {
                if (err) {
                    response.status(409)
                } else {
                    response.status(200)
                }
            })
        }
    })
    response.send()
})

app.delete('/news/:id', (request, response) => {
    let name = 'data/' + request.params.id + '.json'
    fs.unlink(name, (err) => {
        if (err) {
            response.status(409)
        } else {
            response.status(200)
        }
    })
    response.send()
})

function stop() {
    server.close()
}

module.exports = app
module.exports.stop = stop
