import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { sendEmail } from "./sendmail";
const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

redisConnection.on("error", (error) => {
  console.error(error);
  console.log("Error in Redis connection");
});
export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
//check redisconnection is valid of not
// Worker to process jobs
export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    try {
      console.log(`Processing job ${job.id}`);

      const { email, subject, message } = job.data;

      // Call your email sending function
      await sendEmail(email, subject, message);

      console.log("Task executed successfully");
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
      throw error; // Re-throw the error to trigger retry
    }
  },
  {
    connection: redisConnection,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  }
);
notificationWorker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

// Event listener for completed jobs
notificationWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});
