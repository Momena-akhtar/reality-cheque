import { authMiddleware } from "../middleware/authMiddleware";
import { UserService } from "../services/userService";
import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/:id", authMiddleware, async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const user = await UserService.getInstance().getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, _id, ...userData } = user.toObject();
    res.json({ id: _id, ...userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.put("/:id", authMiddleware, async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  const updateData = req.body;
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedUser = await UserService.getInstance().updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }
    
    const { password, _id, ...userData } = updatedUser.toObject();
    res.json({ id: _id, ...userData });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/:id", authMiddleware, async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const success = await UserService.getInstance().deleteUser(userId);
    if (!success) {
      return res.status(404).json({ message: "User not found or deletion failed" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id/plan", authMiddleware, async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  const { plan } = req.body;
  
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (!["free", "pro", "enterprise"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }
    
    const updatedUser = await UserService.getInstance().updateUserPlan(userId, plan);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }
    
    const { password, _id, ...userData } = updatedUser.toObject();
    res.json({ id: _id, ...userData });
  } catch (error) {
    console.error("Error updating user plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;