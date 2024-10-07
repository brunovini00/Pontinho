const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Brunote, deu certo');
})

app.get('/cadastro', (req, res) => {
    res.send('Aqui vamos cadastrar o cliente');
})

app.listen(3000)