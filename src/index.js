const express = require('express');
const crypto = require('crypto')

const app = express();

app.use(express.json());

const customers = [];

function verifyIfAccountExistsByCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(404).send({ error: 'Customer not found!' });
  }

  request.customer = customer;

  return next();
}

app.post('/accounts', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists!' })
  }

  const id = crypto.randomUUID();

  customers.push({
    cpf,
    name,
    id,
    statement: [],
  });

  response.status(201).send();
});

app.get('/statements', verifyIfAccountExistsByCPF, (request, response) => {
  return response.json(request.customer.statement);
});

app.post('/deposits', verifyIfAccountExistsByCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();

});

app.listen(3333);
