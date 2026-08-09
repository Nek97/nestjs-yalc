import { Resolver, Query } from '@nestjs/graphql';
import { TestEntity } from './test.entity';

@Resolver((): typeof TestEntity => TestEntity)
export class TestResolver {
  @Query((): StringConstructor => String)
  helloWorld(): string {
    return 'Hello from YALC E2E!';
  }

  @Query((): (typeof TestEntity)[] => [TestEntity])
  getTests(): TestEntity[] {
    return [{ id: 'uuid-1', name: 'Test 1' }];
  }
}
