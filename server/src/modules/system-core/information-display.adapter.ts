import { TriagePriority } from '@prisma/client';

interface TriageQueueItem {
  id: number;
  patientName: string;
  priority: TriagePriority;
  status: string;
  symptoms: string;
}

// Mocked hospital information display adapter.
// Simulates broadcasting the triage queue to physical displays throughout the hospital.
//
// Adapter pattern: the application logic (TriageCaseService.broadcast()) calls this
// adapter without knowing whether it's the real implementation or a mock.
// To swap in a real implementation (e.g., WebSocket push or REST API call to a
// hospital display system), replace the body of broadcastTriageQueue().
// The interface remains unchanged.
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
