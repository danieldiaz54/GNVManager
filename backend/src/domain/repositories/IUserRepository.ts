export interface UserEntity {
  id?: string;
  username: string;
  fullName?: string | null;
  passwordHash: string;
  role: string;
  createdAt?: Date;
}

export interface IUserRepository {
  findByUsername(username: string): Promise<UserEntity | null>;
}
