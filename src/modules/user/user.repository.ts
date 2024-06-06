import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, IUser } from './schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<IUser>) {}

  async findAll(): Promise<IUser[]> {
    return this.userModel.find().exec();
  }

  async findByEmail(email: string): Promise<IUser | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<IUser | undefined> {
    return this.userModel.findById(id).exec();
  }

  async create(user: CreateUserDto): Promise<IUser> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async update(user: IUser): Promise<IUser> {
    return this.userModel
      .findByIdAndUpdate(user._id, user, { new: true })
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
