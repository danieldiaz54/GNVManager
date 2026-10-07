export interface UserEntity {
  id?: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt?: Date;
}

export interface IUserRepository {
  findByUsername(username: string): Promise<UserEntity | null>;
}
