import prisma from "../../lib/prisma";

export default async function handle(req, res) {
  const evts = await prisma.pending.findMany();

  res.json(evts);
}
