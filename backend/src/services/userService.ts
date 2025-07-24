import User, { IUser } from "../models/user";

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }
    async deleteUser(userId: string): Promise<boolean> {
        try {
        await User.findByIdAndDelete(userId);
        return true;
        } catch (error) {
        console.error('Error deleting user:', error);
        return false;
        }
    }
}