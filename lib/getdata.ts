import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  role: string;
}
export async function getData(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return {
        status: 401,
        body: { error: "Unauthorized" },
      };
    }
    const token = authHeader.split(" ")[1];
    console.log(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return {
      role: decoded.role,
      id: decoded.id,
    };
  } catch (error) {
    console.error("Error in getting data:", error);
    return {
      body: { error: "Error in getting data" },
    };
  }
}
