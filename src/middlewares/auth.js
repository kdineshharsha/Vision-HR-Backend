import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const verifyJWT = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (header != null && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = decoded;
      next();
    });
  }
};

export default verifyJWT;
