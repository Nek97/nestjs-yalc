import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PostEntity } from './post.entity';
import { decimalMiddleware } from '@nestjs-yalc/field-middleware/decimal-middleware.helper';

@ObjectType('User')
@Entity('users')
export class UserEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field((): StringConstructor => String, { middleware: [decimalMiddleware] })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: string;

  @Field(() => Int)
  @Column('int')
  age: number;

  @Field((): [typeof PostEntity] => [PostEntity], { nullable: 'itemsAndList' })
  @OneToMany((): typeof PostEntity => PostEntity, (post): UserEntity => post.user, { cascade: true })
  posts?: PostEntity[];
}
