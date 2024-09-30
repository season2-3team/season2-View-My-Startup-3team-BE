import prisma from "../prisma.js";

export const getStartups = async (req, res) => {
  const { page = 1, limit = 10, order = 'createdAt', sort = 'desc', keyword = '' } = req.query;

  const offset = (page - 1) * limit;
  const skip = offset;
  const take = parseInt(limit);

  const orderMapping = {
    totalInvestment: 'simInvest',
    revenue: 'revenue',
    employeeCount: 'employees',
    createdAt: 'createdAt',
  }
  const orderBy = { [orderMapping[order] || 'createdAt']: sort };

  const where = {
    AND: [
      keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } }
        ]  
      },
    ].filter(Boolean),    // falsy한 값 제거
  }

  const startups = await prisma.startup.findMany({
    where,
    orderBy,
    skip,
    take,
  });

  const totalCount = await prisma.startup.count({ where });

  res.send({
    list: startups,
    totalCount: totalCount
  });
};

export const getStartupById = async (req, res) => {
  const { page = 1, limit = 10, order = 'investAmount', sort = 'desc', keyword = '' } = req.query;

  const offset = (page - 1) * limit;
  const skip = offset;
  const take = parseInt(limit);

  const { id } = req.params;

  if(isNaN(id)) {
    return res.status(400).send({ message: 'Invalid ID format. ID must be a number' });
  }

  const numId = parseInt(id);
  const startup = await prisma.startup.findUnique({
    where: { id: numId },
    include: {
      mockInvestors: {
        orderBy:  {[order]: sort },
        skip,
        take,
      },
    },
  });
  if (!startup) {
    return res.status(404).send({message: 'No startup found with given ID'});
  }
  // 전체 투자자수 계산
  const mockInvestorsCount = await prisma.mockInvestor.count({
    where: { startupId: numId },
  });
  res.send({
    startup: {
      ...startup,
      mockInvestorsCount,    
    },
  });
}