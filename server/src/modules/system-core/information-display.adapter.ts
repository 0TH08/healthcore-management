import { TriagePriority } from '@prisma/client';

interface TriageQueueItem {
  id: number;
  patientName: string;
  priority: TriagePriority;
  status: string;
  symptoms: string;
}

export class InformationDisplayAdapter {
  static broadcastTriageQueue(queue: TriageQueueItem[]): void {
    console.log('[MOCK BROADCAST] Broadcasting triage queue to hospital displays...');
    for (const item of queue) {
      console.log(
        `  [DISPLAY] #${item.id} | ${item.patientName} | ${item.priority} | ${item.status} | ${item.symptoms}`,
      );
    }
    console.log(`[MOCK BROADCAST] Queue broadcast complete (${queue.length} cases)`);
  }
}
