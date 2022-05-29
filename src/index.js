const express = require('express');
const crypto = require('crypto');

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

function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
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

app.get('/statements/date', verifyIfAccountExistsByCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');
  console.log(dateFormat);
  console.log(dateFormat.toDateString());

  const statements = customer.statement.filter((statement) => {
    return statement.createdAt.toDateString() === dateFormat.toDateString();
  });

  return response.json(statements);
});

app.post('/withdraw', verifyIfAccountExistsByCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!' })
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  };


  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.put('/accounts', verifyIfAccountExistsByCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get('/accounts', verifyIfAccountExistsByCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete('/accounts', verifyIfAccountExistsByCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyIfAccountExistsByCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement)

  return response.json(balance);
});

app.listen(3333);
