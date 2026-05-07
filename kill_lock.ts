import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const locks: any[] = await prisma.$queryRaw`
    SELECT pid, mode, granted
    FROM pg_locks
    WHERE locktype = 'advisory' AND objid = 72707369;
  `
  console.log('Locks:', locks)
  
  if (locks.length > 0) {
    for (const lock of locks) {
      console.log('Killing PID:', lock.pid)
      await prisma.$executeRawUnsafe(`SELECT pg_terminate_backend(${lock.pid});`)
    }
    console.log('Done killing locks.')
  } else {
    console.log('No locks found.')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
