import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { repo } = req.query;

  if (req.method === "GET") {
    if (repo) {
      const evts = await prisma.sla.findMany({
        where: {
          repo: repo,
        },
      });
      res.json(evts);
    }
  }

  res.end();
}
