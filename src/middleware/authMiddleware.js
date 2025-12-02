import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
