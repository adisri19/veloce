import crypto from "crypto";
import { prisma } from "../db";
import { jsonIn, jsonOut } from "../db-compat";
import { env } from "../env";

export interface AutomationEvent {
  trigger: "STAGE_ENTERED" | "SLA_BREACHED" | "SCORECARD_SUBMITTED" | "HIRED";
  applicationId?: string;
  candidateId?: string;
  jobId?: string;
  toStage?: string;
  matchScore?: number;
  metadata?: Record<string, unknown>;
}

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Evaluates automation rules for an event and schedules deliveries.
 */
export async function dispatchAutomations(event: AutomationEvent): Promise<void> {
  try {
    const rules = await prisma.automationRule.findMany({
      where: {
        trigger: event.trigger,
        isActive: true,
      },
    });

    for (const rule of rules) {
      const conditions = jsonOut<Record<string, unknown>>(rule.conditions);
      let match = true;

      if (conditions.toStage && conditions.toStage !== event.toStage) {
        match = false;
      }
      if (
        typeof conditions.minScore === "number" &&
        (event.matchScore === undefined || event.matchScore < conditions.minScore)
      ) {
        match = false;
      }

      if (match) {
        const payload = {
          eventId: crypto.randomUUID(),
          ruleId: rule.id,
          ruleName: rule.name,
          trigger: event.trigger,
          timestamp: new Date().toISOString(),
          data: event,
        };

        const delivery = await prisma.webhookDelivery.create({
          data: {
            ruleId: rule.id,
            event: event.trigger,
            payload: jsonIn(payload),
            status: "PENDING",
            attempts: 0,
            nextAttemptAt: new Date(),
          },
        });

        // Fire immediate attempt asynchronously
        attemptDelivery(delivery.id).catch((err) => {
          console.error(`Failed immediate delivery for ${delivery.id}:`, err);
        });
      }
    }
  } catch (err) {
    console.error("Error in dispatchAutomations:", err);
  }
}

const BACKOFF_MINUTES = [1, 5, 30, 60, 120];

export async function attemptDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { rule: true },
  });

  if (!delivery || delivery.status === "DELIVERED") {
    return false;
  }

  const actionConfig = jsonOut<{ url?: string; secret?: string }>(delivery.rule.actionConfig);
  const targetUrl = actionConfig.url;
  const secret = actionConfig.secret || env.WEBHOOK_SIGNING_SECRET;

  if (!targetUrl) {
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        lastError: "Missing destination webhook URL",
      },
    });
    return false;
  }

  const payloadString =
    typeof delivery.payload === "string" ? delivery.payload : JSON.stringify(delivery.payload);
  const signature = signPayload(payloadString, secret);

  const attemptNumber = delivery.attempts + 1;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Veloce-Signature": signature,
        "X-Veloce-Event": delivery.event,
        "X-Veloce-Delivery": delivery.id,
      },
      body: payloadString,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (response.ok) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "DELIVERED",
          attempts: attemptNumber,
          responseCode: response.status,
          lastError: null,
          nextAttemptAt: null,
        },
      });
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err: unknown) {
    const isLastAttempt = attemptNumber >= 5;
    const backoffMin = BACKOFF_MINUTES[attemptNumber - 1] ?? 120;
    const nextAttemptAt = isLastAttempt
      ? null
      : new Date(Date.now() + backoffMin * 60 * 1000);

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: isLastAttempt ? "FAILED" : "PENDING",
        attempts: attemptNumber,
        lastError: (err as Error).message || "Delivery network failure",
        nextAttemptAt,
      },
    });

    return false;
  }
}

export async function drainPendingDeliveries(): Promise<{ processed: number; succeeded: number }> {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: "PENDING",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    take: 50,
  });

  let succeeded = 0;
  for (const delivery of pending) {
    const ok = await attemptDelivery(delivery.id);
    if (ok) succeeded++;
  }

  return { processed: pending.length, succeeded };
}
