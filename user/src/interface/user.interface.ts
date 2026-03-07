export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface IUserLogin {
  email: string;
  password: string;
}
export interface IUserRegister {
  name: string;
  email: string;
  password: string;
}
