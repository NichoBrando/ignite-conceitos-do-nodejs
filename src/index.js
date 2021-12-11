const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function isUsernameInUse(username) {
  return users.some(user => user.username === username);
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  if (!username || !isUsernameInUse(username)) {
    return response.status(400).json({ error: '' });
  }
  next();
}

function getUserByUsername(username) {
  return users.find(user => user.username === username);
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  if (!name || !username) {
    response.status(400).json({ error: 'Invalid payload' });
  }
  if (isUsernameInUse(username)) {
    response.status(400).json({ error: 'Invalid username' });
  }
  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };
  users.push(newUser);
  response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const user = getUserByUsername(request.headers.username);
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body; 
  if (!title || !deadline) {
    response.status(400).json({ error: 'invalid todo' });
  }
  const user = getUserByUsername(request.headers.username);
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  user.todos.push(newTodo);
  response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body; 
  if (!title || !deadline) {
    response.status(400).send('Invalid data');
  }
  const user = getUserByUsername(request.headers.username);
  const todoIndexToUpdate = user.todos.findIndex(todo => todo.id === request.params.id);
  if (todoIndexToUpdate === -1) {
    response.status(404).json({ error: 'Todo not found' });
  }
  const updatedTodo = {
    ...user.todos[todoIndexToUpdate],
    title,
    deadline
  };
  user.todos.splice(todoIndexToUpdate, 1, updatedTodo);
  response.status(200).json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const user = getUserByUsername(request.headers.username);
  const todoIndexToUpdate = user.todos.findIndex(todo => todo.id === request.params.id);
  if (todoIndexToUpdate === -1) {
    response.status(404).json({ error: 'Todo not found' });
  }
  const updatedTodo = {
    ...user.todos[todoIndexToUpdate],
    done: true
  };
  user.todos.splice(todoIndexToUpdate, 1, updatedTodo);
  response.status(200).json(updatedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const user = getUserByUsername(request.headers.username);
  const todoIndexToUpdate = user.todos.findIndex(todo => todo.id === request.params.id);
  if (todoIndexToUpdate === -1) {
    response.status(404).send({ error: 'Todo not found' });
  }
  user.todos.splice(todoIndexToUpdate, 1);
  response.status(204).send();
});

module.exports = app;