import { Resolver, Query } from '@nestjs/graphql';
import { TestEntity } from './test.entity';

@Resolver(() => TestEntity)
export class TestResolver {
  @Query(() => String)
  helloWorld(): string {
    return 'Hello from YALC E2E!';
  }

  @Query(() => [TestEntity])
  getTests(): TestEntity[] {
    return [{ id: 'uuid-1', name: 'Test 1' }];
  }
}
