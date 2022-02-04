import prisma from "../../../lib/prisma";

export default async function handle(req, res) {
  const { repo } = req.query;

  if (req.method === "GET") {
    const evts = await prisma.trendingOpen.findMany({
      where: {
        repo: repo,
      },
    });
    res.json(evts);
  }
  res.end();
}
