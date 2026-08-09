import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/graphql (POST) - helloWorld', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ helloWorld }',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.helloWorld).toBe('Hello from YALC E2E!');
      });
  });

  it('/graphql (POST) - getTests', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ getTests { id name } }',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.getTests).toEqual([
          { id: 'uuid-1', name: 'Test 1' },
        ]);
      });
  });
});
