import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const evts = await prisma.pending.findMany();

    res.json(evts);
  }
}
