import prisma from "../../lib/prisma";

export default async function handle(req, res) {
  if (req.method === "GET") {
    const evts = await prisma.trendingOpen.findMany();
    res.json(evts);
  }
  res.end();
}
