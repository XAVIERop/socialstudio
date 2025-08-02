const request = require('supertest');
const express = require('express');
const apiRoutes = require('../routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Endpoints', () => {
  it('should return 400 for invalid prototype request', async () => {
    const res = await request(app)
      .post('/api/prototype-request')
      .send({ name: '', email: 'invalid', business_type: '' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 for invalid contact message', async () => {
    const res = await request(app)
      .post('/api/contact-message')
      .send({ name: '', email: 'invalid', message: '' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toBeDefined();
  });
});
