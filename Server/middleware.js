import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    console.log(token);
    console.log(process.env.JWT_SECRET_KEY);

    next();
  } catch (err) {
    console.log(token);
    console.log(process.env.JWT_SECRET_KEY);

    return res.json({ error: "Invalid or expired token" });
  }
};
