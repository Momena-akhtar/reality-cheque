import { authMiddleware } from "../middleware/authMiddleware";
import { UserService } from "../services/userService";
import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/:id", async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  try {
    const user = await UserService.getInstance().getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.put("/:id", authMiddleware, async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  const updateData = req.body;
  try {
    const updatedUser = await UserService.getInstance().updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/:id", authMiddleware, async (req: Request, res: Response) : Promise<any> => {
  const userId = req.params.id;
  try {
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
export default router;