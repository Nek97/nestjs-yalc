import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserEntity } from '../../entities/user.entity';
import { UserService } from './user.service';
import { AgGridArgs } from '@nestjs-yalc/ag-grid/ag-grid-args.decorator';
import { AgGridFindManyOptions } from '@nestjs-yalc/ag-grid/ag-grid.interface';
import { GqlError } from '@nestjs-yalc/graphql/plugins/gql.error';

@Resolver(() => UserEntity)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserEntity])
  getUsers(
    @AgGridArgs({ entityType: UserEntity }) agGridArgs: AgGridFindManyOptions<UserEntity>,
  ): Promise<UserEntity[]> {
    return this.userService.getEntityListAgGrid(agGridArgs);
  }

  @Query(() => String)
  throwError(): string {
    throw new GqlError('Intentional error for testing', 'TEST_ERROR');
  }

  @Mutation(() => UserEntity)
  async createUser(
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('balance') balance: string,
    @Args('age') age: number,
  ): Promise<UserEntity> {
    return this.userService.userRepository.save({
      firstName,
      lastName,
      balance,
      age,
    });
  }
}
