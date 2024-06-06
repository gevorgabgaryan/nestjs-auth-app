import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../types/Role.type';
import { UserStatus } from '../types/status.type';
import { compare, genSalt, hash } from 'bcrypt';

// Interface for User with detailed descriptions
export interface IUser extends Document {
  firstName?: string;
  lastname?: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  refreshTokens: string[];

  comparePassword(candidate: string): Promise<boolean>;
  addRefreshToken(refreshToken: string): Promise<void>;
  removeRefreshToken(refreshToken: string): Promise<void>;
  validateRefreshToken(refreshToken: string): Promise<boolean>;
}

@Schema()
export class User extends Document implements IUser {
  @Prop()
  firstName?: string;

  @Prop()
  lastname?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.NEW })
  status: UserStatus;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[];

  comparePassword: (candidate: string) => Promise<boolean>;
  addRefreshToken: (refreshToken: string) => Promise<void>;
  removeRefreshToken: (refreshToken: string) => Promise<void>;
  validateRefreshToken: (refreshToken: string) => Promise<boolean>;

}

// Create the User schema for Mongoose
export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to hash password if modified
UserSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
  }
  next();
});

UserSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

UserSchema.methods.comparePassword = async function(candidate: string): Promise<boolean> {
  return compare(candidate, this.password);
};

UserSchema.methods.addRefreshToken = async function(refreshToken: string): Promise<void> {
  const salt = await genSalt(10);
  const hashedRefreshToken = await hash(refreshToken, salt);
  this.refreshTokens.push(hashedRefreshToken);
  await this.save();
};

UserSchema.methods.removeRefreshToken = async function(refreshToken: string): Promise<void> {
  const updatedTokens = [];
  for (const storedToken of this.refreshTokens) {
    const isMatch = await compare(refreshToken, storedToken);
    if (!isMatch) {
      updatedTokens.push(storedToken);
    }
  }
  this.refreshTokens = updatedTokens;
  await this.save();
};

UserSchema.methods.validateRefreshToken = async function(refreshToken: string): Promise<boolean> {
  for (const token of this.refreshTokens) {
    if (await compare(refreshToken, token)) {
      return true;
    }
  }
  return false;
};