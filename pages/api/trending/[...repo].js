import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { repo } = req.query;

  if (req.method === "GET") {
    if ((repo.length === 2) & (repo[1] === "closed")) {
      const evts = await prisma.trendingClosed.findMany({
        where: {
          repo: repo[0],
        },
      });
      res.json(evts);
    }

    if (repo.length == 1) {
      const evts = await prisma.trendingOpen.findMany({
        where: {
          repo: repo[0],
        },
      });
      res.json(evts);
    }
  }

  res.end();
}
