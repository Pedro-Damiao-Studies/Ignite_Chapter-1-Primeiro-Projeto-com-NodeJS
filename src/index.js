const express = require('express');
const crypto = require('crypto')

const app = express();

app.use(express.json());

const customers = [];

app.post('/accounts', (request, response) => {
  const { cpf, name } = request.body;
  const id = crypto.randomUUID();

  customers.push({
    cpf,
    name,
    id,
    statement: [],
  });

  response.status(201).send();
})

app.listen(3333);
