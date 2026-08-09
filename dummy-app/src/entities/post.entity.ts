import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';

@ObjectType('Post')
@Entity('posts')
export class PostEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  content: string;

  @Field((): typeof UserEntity => UserEntity)
  @ManyToOne((): typeof UserEntity => UserEntity, (user): PostEntity[] | undefined => user.posts)
  user: UserEntity;
}
